// Loads the game in jsdom, drives a few flows, prints a deterministic snapshot.
// usage: node harness.js <repoDir> [outFile]
const { JSDOM, VirtualConsole } = require('jsdom');
const inspector = require('inspector');
const covSession = process.env.COV ? new inspector.Session() : null;
if (covSession) { covSession.connect(); covSession.post('Profiler.enable'); covSession.post('Profiler.startPreciseCoverage', { callCount: true, detailed: true }); }
const fs = require('fs');
const path = require('path');

const repo = path.resolve(process.argv[2] || '.');
const outFile = process.argv[3];
const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => errors.push('jsdomError: ' + (e.detail?.stack || e.message).split('\n').slice(0, 3).join(' | ')));
vc.on('error', (...a) => errors.push('console.error: ' + a.join(' ')));

// Deterministic randomness so snapshots are comparable.
let seed = 12345;
const rng = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

const http = require('http');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff': 'font/woff' };
const server = http.createServer((req, res) => {
  const f = path.join(repo, decodeURIComponent(req.url.split('?')[0]).replace(/^\/$/, '/index.html'));
  if (!f.startsWith(repo) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
async function main() {
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = 'http://127.0.0.1:' + server.address().port + '/';
const html = fs.readFileSync(path.join(repo, 'index.html'), 'utf8');
const dom = new JSDOM(html, {
  url: base,
  runScripts: 'dangerously',
  resources: 'usable',
  pretendToBeVisual: true,
  virtualConsole: vc,
  beforeParse(w) {
    w.Math.random = rng;
    w.HTMLDialogElement.prototype.showModal ||= function () { this.setAttribute('open', ''); };
    w.HTMLDialogElement.prototype.close ||= function () { this.removeAttribute('open'); this.dispatchEvent(new w.Event('close')); };
    Object.defineProperty(w.HTMLDialogElement.prototype, 'open', {
      get() { return this.hasAttribute('open'); }, configurable: true,
    });
    w.matchMedia ||= () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
    w.AudioContext = function () { return { resume: () => Promise.resolve(), suspend: () => Promise.resolve(), createOscillator() { throw Error('no audio'); } }; };
    w.scrollTo = () => {};
    w.Element.prototype.scrollIntoView ||= function () {};
    w.createImageBitmap = async () => ({ width: 1, height: 1, close() {} });
    w.HTMLCanvasElement.prototype.getContext = () => null;
  },
});

const w = dom.window;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const $ = id => w.document.getElementById(id);
const click = el => el && el.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));

await (async () => {
  await new Promise(r => w.addEventListener('load', r));
  await sleep(300);
  const snap = { errors: [], steps: {} };
  const ev = code => w.eval(code); // run in page global scope

  const step = (name, fn) => {
    try { snap.steps[name] = fn(); } catch (e) { snap.steps[name] = 'THROW: ' + e.message; errors.push(name + ': ' + e.message); }
  };
  const text = sel => [...w.document.querySelectorAll(sel)].map(e => e.textContent.replace(/\s+/g, ' ').trim()).join(' || ');

  step('globals', () => ev(`[typeof render,typeof startMini,typeof care,typeof drawShop,typeof drawGardenPanel,typeof renderGarden,typeof renderQuests,typeof renderFortune,typeof winMini,typeof confirmPetSale,typeof training,typeof decorateGarden,typeof residents,typeof currentResidents,typeof animateFriends,typeof openUpgrade].join(',')`));
  step('slotDialogOpen', () => ev(`slotDialog.open`));
  step('newGame', () => { click(w.document.querySelector('[data-open-slot="0"]')); return ev(`document.getElementById('saveNameInput')?'name-form':'no-form'`); });
  step('nameSave', () => { $('saveNameInput').value = 'Test'; click($('submitSaveName')); return ev(`[activeSlot,current,state.saveName].join(',')`); });
  step('gardenText', () => text('#view').slice(0, 400));
  // Give coins + a pet through the real code paths.
  step('seedState', () => {
    ev(`state.coins=1000;state.eggs.push({id:'e1',species:3,color:2,hatchAt:null});state.pets.push({id:'p1',species:3,color:2,food:50,clean:50,joy:50,energy:50,xp:0});state.pets.push({id:'p2',species:4,color:5,food:50,clean:50,joy:50,energy:50,xp:0});PetHomes.normalize(state,now());PetHomes.assign(state,0,'p1',now());save();render();`);
    return ev(`[state.coins,state.pets.length,state.homes.length,state.pens.join('|'),state.homeVersion].join(',')`);
  });
  step('careFood', () => { ev(`care('p1','food')`); return ev(`[state.coins,state.pets[0].totalXP,Math.round(state.pets[0].food)].join(',')`); });
  step('training', () => { ev(`training('p1')`); return ev(`[state.coins,state.pets[0].totalXP].join(',')`); });
  step('sellPrice', () => ev(`PetHomes.price(state.pets[0],now())`));
  step('income', () => ev(`JSON.stringify(IdleIncome.rates(state,homeItems))`));
  step('merge', () => { ev(`PetHomes.merge(state,'p1','p2',now())`); return ev(`[state.pets.length,state.pets[0].totalXP,state.pets[0].capital].join(',')`); });
  step('tab:quests', () => { ev(`current='quests';render()`); return text('#view').slice(0, 300); });
  step('tab:collection', () => { ev(`current='collection';render()`); return text('#view').slice(0, 200); });
  step('tab:garden', () => { ev(`current='garden';render()`); return text('#view').length > 100 ? 'ok:' + text('.home-heading') : 'EMPTY'; });
  step('shopTabs', () => {
    const out = [];
    ev(`showShop()`);
    for (const t of ['care', 'style', 'home', 'decor', 'pages']) { ev(`homeShopTab='${t}';drawShop()`); out.push(t + ':' + w.document.querySelectorAll('#shopDialog .shop-items > *').length); }
    ev(`shopDialog.close()`);
    return out.join(',');
  });
  step('gardenPanels', () => ['pet', 'residents', 'eggs'].map(m => { ev(`openGardenPanel('${m}','p1')`); const n = w.document.querySelector('#gardenDialog')?.textContent.length > 50; ev(`closeGardenPanel()`); return m + ':' + n; }).join(','));
  step('miniGames', () => {
    const ids = ev(`arcadeGames.map(g=>g[0])`);
    const ok = [];
    for (const id of ids) { try { ev(`startMini('${id}')`); ok.push(id + ':' + (w.document.querySelector('#adventureDialog').textContent.length > 20 ? 'ok' : 'empty')); ev(`adventureDialog.close()`); } catch (e) { ok.push(id + ':THROW ' + e.message); } }
    return ok.join(' ');
  });
  step('eggJourney', () => { ev(`showEggJourney()`); const t = $('adventureDialog').textContent.slice(0, 120); ev(`adventureDialog.close()`); return t; });
  step('evolutionDialog', () => { ev(`state.pets[0].totalXP=100;state.pets[0].xp=100;PetHomes.normalize(state);evolutionDialog('p1')`); const t = $('adventureDialog').textContent.slice(0, 100); ev(`adventureDialog.close()`); return t; });
  step('rewards', () => ev(`JSON.stringify(arcadeGames.map(g=>[g[0],g[4]]))`));
  step('eggsPanelFlow', () => {
    ev(`state.eggs.push({id:'e2',species:1,color:1,hatchAt:null});state.firstHatch=false;save();render();openGardenPanel('eggs')`);
    const before = ev(`state.coins`);
    click(w.document.querySelector('[data-nursery-hatch="e1"]'));
    const hatched = ev(`!!state.eggs.find(e=>e.id==='e1').hatchAt`);
    click(w.document.querySelector('[data-nursery-sell="e2"]'));
    const out = [before, ev(`state.coins`), hatched, ev(`state.eggs.length`)].join(',');
    ev(`closeGardenPanel()`);
    return out;
  });
  step('rushPurchase', () => { ev(`buyHomeConsumable('rush')`); return ev(`[state.coins,state.eggs.length,state.eggs.filter(e=>e.hatchAt&&e.hatchAt<=now()).length].join(',')`); });
  step('hatchResolve', () => { ev(`advance()`); return ev(`[state.pets.length,state.eggs.length,state.homes.length].join(',')`); });
  step('petPanelCare', () => {
    ev(`openGardenPanel('pet','p1')`);
    click(w.document.querySelector('[data-home-detail-care="clean"]'));
    click($('homeTrain'));
    const out = ev(`[state.coins,Math.round(state.pets[0].clean),state.pets[0].totalXP].join(',')`);
    ev(`closeGardenPanel()`); return out;
  });
  step('homeShopBuy', () => {
    ev(`showShop()`);
    const res = [];
    for (const [tab, id] of [['home', 'ball'], ['style', 'cap'], ['decor', 'sunset']]) {
      ev(`homeShopTab='${tab}';drawShop()`);
      click(w.document.querySelector('[data-home-item="' + id + '"]'));
      res.push(id + ':' + ev(`activeHome().owned.includes('${id}')`));
    }
    ev(`shopDialog.close()`);
    return res.join(',') + ' coins=' + ev(`state.coins`) + ' income=' + ev(`JSON.stringify(IdleIncome.rates(state,homeItems).map(r=>r.rate))`);
  });
  step('newHomePage', () => { ev(`homeShopTab='pages';showShop()`); click($('buyHomePage')); ev(`shopDialog.close()`); return ev(`[state.homes.length,state.homePage,state.coins].join(',')`); });
  step('darkMode', () => { click($('displayToggle')); const a = w.document.documentElement.dataset.display; click($('displayToggle')); return a + ',' + w.document.documentElement.dataset.display; });
  step('headerButtons', () => [...w.document.querySelectorAll('header button')].map(b => b.id).join(','));
  step('navLabels', () => text('#nav'));
  step('treatBuy', () => { ev(`state.pets[0].lastTreat=0`); ev(`buyHomeConsumable('treat')`); return ev(`[state.coins,state.pets[0].totalXP].join(',')`); });
  step('saveRoundTrip', () => ev(`(()=>{const s=SaveStore.load();return [s.slots[0].state.saveName,s.slots[0].state.coins===state.coins].join(',')})()`));
  step('renderCount10', () => { const t0 = Date.now(); ev(`for(let i=0;i<10;i++)render()`); return 'ok'; });

  if (covSession) {
    await new Promise(r => covSession.post('Profiler.takePreciseCoverage', (err, res) => {
      const rows = [];
      for (const sc of res.result) {
        if (!sc.url.startsWith(base)) continue;
        const file = sc.url.slice(base.length).split('?')[0] || 'index.html';
        for (const fn of sc.functions) {
          if (!fn.functionName && fn.ranges.length === 1 && fn.isBlockCoverage === false) continue;
          rows.push({ file, name: fn.functionName || '(anon)', count: fn.ranges[0].count, start: fn.ranges[0].startOffset, end: fn.ranges[0].endOffset });
        }
      }
      fs.writeFileSync(process.env.COV, JSON.stringify(rows));
      r();
    }));
  }
  snap.errors = errors;
  const out = JSON.stringify(snap, null, 1);
  if (outFile) fs.writeFileSync(outFile, out);
  console.log(out);
  w.close();
  server.close();
  process.exit(errors.length ? 1 : 0);
})();
}
main();

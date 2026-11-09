const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 800 }, deviceScaleFactor: 1 });
  p.on('pageerror', e => console.log('PAGEERR', e.message));
  await p.goto('http://127.0.0.1:8765/'); await p.waitForTimeout(500);
  await p.click('[data-open-slot="0"]'); await p.fill('#saveNameInput', 'Bông'); await p.click('#submitSaveName'); await p.waitForTimeout(300);
  await p.evaluate(() => { state.coins = 3000; state.pets.push({ id: 'p1', species: 3, color: 2, food: 80, clean: 80, joy: 80, energy: 80, xp: 40, totalXP: 40 }); PetHomes.normalize(state, now()); save(); });
  await p.evaluate(() => { for (const id of ['sofa','tv','lamp','pot2','ball','cake','frame','balloon','teddy','window','rug'].filter(i=>DollHouse.find(i))) { DollHouse.buy(state,id); DollHouse.place(state,'living',id); } DollHouse.build(state,'bedroom'); DollHouse.setStyle(state,'living','wall','stripe'); DollHouse.setStyle(state,'living','floor','carpet'); const o=state.dollhouse.rooms.living.objs; o.forEach((x,i)=>{x.x=12+(i*8)%76;x.y=55+(i*13)%38}); save(); current='dollhouse'; render(); });
  await p.waitForTimeout(300); await p.screenshot({ path: process.argv[2] + '/dh-overview.png' });
  await p.click('[data-room="living"]'); await p.waitForTimeout(800); await p.screenshot({ path: process.argv[2] + '/dh-editor.png' });
  await p.click('[data-dhtab="shop"]'); await p.waitForTimeout(200); await p.screenshot({ path: process.argv[2] + '/dh-shop.png', fullPage: false });
  await p.evaluate(() => { dhCelebrate('living',[{stars:3,coins:85}]); }); await p.waitForTimeout(900); await p.screenshot({ path: process.argv[2] + '/dh-cele.png' });
  await b.close();
})();

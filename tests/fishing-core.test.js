'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { load, seq, clone } = require('./helpers');
const { Fishing: F } = load(['fishing-core.js'], ['Fishing']);
const st = (extra = {}) => ({ coins: 1000, eggs: [], pets: [], ...extra });
const D = '2026-11-09';

function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
/* người chơi giả: nhìn vị trí cá trễ một chút, ngắm lệch một chút. skill 0..1 */
function bot(skill, rnd) {
  const delay = 0.45 - 0.35 * skill, noise = (1 - skill) * 0.16, buf = []; let nz = 0, nt = 0;
  return (r, dt) => {
    buf.push(r.f); const n = Math.max(0, Math.round(delay / dt)); const seen = buf[Math.max(0, buf.length - 1 - n)];
    nt -= dt; if (nt <= 0) { nz = (rnd() + rnd() + rnd() - 1.5) * noise * 2; nt = .25; }
    return r.z + r.p.h / 2 + r.zv * .3 < seen + nz;
  };
}
function reel(lake, fish, rodId, holdFn, seed) {
  const rnd = rng(seed), r = F.reelStart(F.reelParams(lake, fish, rodId), rnd), h = holdFn(rnd);
  while (!r.over) F.reelStep(r, 1 / 60, h(r, 1 / 60), rnd);
  return r;
}
function rate(lake, rodId, skill, n = 120) {
  let ok = 0;
  for (let i = 0; i < n; i++) { const fish = F.pickFish(lake, 'worm', rng(i * 7 + 1)); if (reel(lake, fish.id, rodId, r => bot(skill, r), i + 1).over === 'caught') ok++; }
  return ok / n;
}
const ready = (extra = {}) => { const s = st(extra); F.buyRod(s, 'bamboo'); F.buyBait(s, 'worm'); F.buyBait(s, 'worm'); return s; };

test('data: tiers get pricier, every lake has 4+ fish and fish values grow with the lake', () => {
  for (let i = 1; i < F.rods.length; i++) { assert.ok(F.rods[i].cost > F.rods[i - 1].cost); assert.ok(F.rods[i].zone > F.rods[i - 1].zone); }
  for (let i = 1; i < F.lakes.length; i++) {
    assert.ok(F.lakes[i].ticket > F.lakes[i - 1].ticket);
    assert.ok(F.expectedValue(F.lakes[i].id, 'worm') > F.expectedValue(F.lakes[i - 1].id, 'worm'));
    assert.ok(F.lakes[i].reel.speed > F.lakes[i - 1].reel.speed, 'hồ đắt khó hơn');
    assert.ok(F.lakes[i].reel.zone < F.lakes[i - 1].reel.zone);
    assert.ok(F.lakes[i].window < F.lakes[i - 1].window);
  }
  F.lakes.forEach((l, i) => { assert.equal(l.stars, i + 1); assert.ok(F.rod(l.rec), 'cần gợi ý hợp lệ'); if (i) assert.ok(F.rods.indexOf(F.rod(l.rec)) >= F.rods.indexOf(F.rod(F.lakes[i - 1].rec))); });
  for (const l of F.lakes) { assert.ok(l.fish.length >= 4); for (let i = 1; i < l.fish.length; i++) { assert.ok(l.fish[i].v > l.fish[i - 1].v, l.id + ' cá hiếm đáng tiền hơn'); assert.ok(l.fish[i].w < l.fish[i - 1].w, l.id + ' cá hiếm ít gặp hơn'); } }
  const ids = F.allFish().map(f => f.id); assert.equal(new Set(ids).size, ids.length, 'id cá không trùng');
});
test('shop: rod needed first, rods only upgrade, accessories once, bait in packs, never negative coins', () => {
  const s = st({ coins: 50 });
  assert.equal(F.rent(s, 'pond', D).ok, false, 'chưa có cần');
  assert.equal(F.buyRod(s, 'fiber').ok, false, 'không đủ xu'); assert.equal(s.coins, 50);
  assert.equal(F.buyRod(s, 'bamboo').ok, true); assert.equal(s.coins, 10); assert.equal(F.normalize(s).rod, 'bamboo');
  assert.equal(F.buyRod(s, 'bamboo').ok, false, 'đã có');
  s.coins = 1000; assert.equal(F.buyRod(s, 'carbon').ok, true); assert.equal(F.buyRod(s, 'fiber').ok, false, 'không hạ cấp');
  assert.equal(F.buyAcc(s, 'net').ok, true); assert.equal(F.buyAcc(s, 'net').ok, false);
  const c = s.coins; assert.equal(F.buyBait(s, 'corn').ok, true); assert.equal(s.coins, c - 3 * F.BAIT_PACK); assert.equal(F.normalize(s).bait.corn, F.BAIT_PACK);
  for (let i = 0; i < 20; i++) F.buyBait(s, 'corn'); assert.equal(F.normalize(s).bait.corn, F.BAIT_CAP);
  assert.equal(F.buyBait(s, 'nope').ok, false); assert.equal(F.buyAcc(s, 'nope').ok, false); assert.equal(F.buyRod(s, 'nope').ok, false);
  const p = st({ coins: 3 }); assert.equal(F.buyBait(p, 'worm').ok, false); assert.equal(p.coins, 3);
});
test('rent: costs the ticket, one ticket at a time, price per lake, decays for repeat rentals of the same lake in a day', () => {
  const s = ready({ coins: 5000 }), mults = [];
  for (let i = 0; i < 6; i++) { const r = F.rent(s, 'pond', D); assert.equal(r.ok, true); mults.push(r.mult); assert.equal(F.rent(s, 'forest', D).ok, false, 'còn vé'); F.dropTicket(s); }
  assert.deepEqual(mults, [1, .8, .6, .4, .25, .25]);
  assert.equal(F.ticketsToday(s, D, 'pond'), 6); assert.equal(F.ticketsToday(s, D, 'forest'), 0);
  assert.equal(F.rent(s, 'forest', D).mult, 1, 'hồ khác tính riêng'); F.dropTicket(s);
  assert.equal(F.rent(s, 'pond', '2026-11-10').mult, 1, 'sang ngày mới thì đặt lại');
  const poor = ready({ coins: 5 }); poor.coins = 5; assert.equal(F.rent(poor, 'pond', D).ok, false); assert.equal(poor.coins, 5);
  const t = ready({ coins: 100 }); const c = t.coins; F.rent(t, 'pond', D); assert.equal(t.coins, c - 10); assert.equal(F.normalize(t).ticket.left, 6);
  assert.equal(F.rent(t, 'nope', D).ok, false);
});
test('cast: uses 1 bait and 1 cast, waits in the lake range, glasses/float adjust the bite window', () => {
  const s = ready({ coins: 5000 }); F.rent(s, 'pond', D);
  const before = F.normalize(s).bait.worm, c = F.cast(s, 'worm', seq(0, 1, .5));
  assert.equal(c.ok, true); assert.equal(F.normalize(s).bait.worm, before - 1); assert.equal(F.normalize(s).ticket.left, 5);
  const l = F.lake('pond'); assert.ok(c.wait >= l.wait[0] && c.wait <= l.wait[1]); assert.equal(c.window, l.window); assert.equal(c.warn, 0);
  F.buyAcc(s, 'float'); F.buyAcc(s, 'glasses'); const c2 = F.cast(s, 'worm'); assert.equal(c2.window, l.window * 1.5); assert.equal(c2.warn, .5);
  assert.equal(F.cast(s, 'corn').ok, false, 'không có mồi này');
  const e = st({ coins: 500 }); F.buyRod(e, 'bamboo'); F.rent(e, 'pond', D); assert.equal(F.cast(e, 'worm').ok, false, 'hết mồi'); assert.equal(F.normalize(e).ticket.left, 6);
  assert.equal(F.cast(st(), 'worm').ok, false, 'chưa thuê hồ');
});
test('judgeHook: early / ok / late', () => {
  assert.equal(F.judgeHook(1, 2, 1.5), 'early'); assert.equal(F.judgeHook(2, 2, 1.5), 'ok'); assert.equal(F.judgeHook(3.5, 2, 1.5), 'ok'); assert.equal(F.judgeHook(3.6, 2, 1.5), 'late');
});
test('pickFish: better bait shifts weight to rarer fish and the whole table is reachable', () => {
  for (const l of F.lakes) {
    const w1 = F.weights(l.id, 'worm'), w3 = F.weights(l.id, 'shrimp');
    assert.deepEqual(w1, l.fish.map(f => f.w), 'giun = bảng gốc');
    const share = w => w[w.length - 1] / w.reduce((a, x) => a + x, 0);
    assert.ok(share(w3) > share(w1) * 2, l.id + ' mồi tôm ra cá hiếm nhiều hơn');
    assert.ok(F.expectedValue(l.id, 'corn') > F.expectedValue(l.id, 'worm'));
    const seen = new Set(); const r = rng(5); for (let i = 0; i < 4000; i++) seen.add(F.pickFish(l.id, 'shrimp', r).id); assert.equal(seen.size, l.fish.length);
  }
  assert.equal(F.pickFish('pond', 'worm', () => 0).id, 'rophi'); assert.equal(F.pickFish('pond', 'worm', () => 0.9999).id, 'tre');
});
test('reel: holding does nothing without skill — never holding or always holding does not catch fish', () => {
  for (const l of F.lakes) for (const rodId of ['bamboo', 'carbon']) {
    let idle = 0, held = 0;
    for (let i = 0; i < 40; i++) {
      const fish = l.fish[i % l.fish.length].id;
      if (reel(l.id, fish, rodId, () => () => false, i + 1).over === 'caught') idle++;
      if (reel(l.id, fish, rodId, () => () => true, i + 1).over === 'caught') held++;
    }
    assert.ok(idle <= 4, `${l.id}/${rodId}: không bấm gì mà vẫn được ${idle}/40`);
    assert.ok(held <= 4, `${l.id}/${rodId}: giữ mãi mà vẫn được ${held}/40`);
  }
});
test('reel: deterministic for the same seed, always terminates, positions stay inside the bar', () => {
  const a = reel('forest', 'lang', 'fiber', r => bot(.6, r), 77), b = reel('forest', 'lang', 'fiber', r => bot(.6, r), 77);
  assert.equal(a.over, b.over); assert.equal(a.T, b.T); assert.equal(a.prog, b.prog);
  const rnd = rng(3), r = F.reelStart(F.reelParams('deep', 'kiem', 'bamboo'), rnd), h = bot(.5, rnd);
  while (!r.over) { F.reelStep(r, 1 / 30, h(r, 1 / 30), rnd); assert.ok(r.z >= 0 && r.z + r.p.h <= 1 + 1e-9); assert.ok(r.f >= 0 && r.f <= 1); assert.ok(r.prog >= 0 && r.prog <= 1); }
  assert.ok(r.T <= r.p.maxT + 1 / 30);
  const done = F.reelStep(r, 1, true); assert.equal(done, r, 'đã xong thì không đổi nữa');
});
test('difficulty: easy lake is easy for beginners; pricier lakes need real skill; a better rod helps; skill always helps', () => {
  assert.ok(rate('pond', 'bamboo', .4) >= .8 && rate('pond', 'bamboo', .2) >= .6, 'ao làng dễ cho người mới');
  assert.ok(rate('forest', 'bamboo', .2) <= .35, 'hồ rừng không dễ với cần tre + tay mới');
  assert.ok(rate('deep', 'bamboo', .4) <= .15, 'vịnh sâu rất khó với cần tre');
  assert.ok(rate('deep', 'carbon', .95) >= .6, 'nhưng cao thủ + cần tốt vẫn làm được');
  for (const l of ['forest', 'deep']) {
    assert.ok(rate(l, 'carbon', .6) > rate(l, 'bamboo', .6) + .1, l + ': cần tốt hơn thì dễ hơn');
    assert.ok(rate(l, 'bamboo', .9) > rate(l, 'bamboo', .3) + .1, l + ': kỹ năng cao hơn thì dễ hơn');
  }
  for (const rodId of ['bamboo', 'fiber', 'carbon']) assert.ok(rate('pond', rodId, .6) >= rate('forest', rodId, .6) && rate('forest', rodId, .6) >= rate('deep', rodId, .6), rodId + ': hồ đắt khó hơn');
  /* kéo giỏi thì cá to hơn (chất lượng cao hơn) */
  const q = skill => { let s = 0, n = 0; for (let i = 0; i < 60; i++) { const r = reel('pond', 'diec', 'fiber', r2 => bot(skill, r2), i + 1); if (r.over === 'caught') { s += r.quality; n++; } } return s / n; };
  assert.ok(q(.95) > q(.3) + .1);
});
test('rescue: net saves one escaped fish per ticket, only if owned', () => {
  const s = ready({ coins: 5000 }); F.rent(s, 'forest', D);
  const lost = () => { const r = F.reelStart(F.reelParams('forest', 'loc', 'bamboo')); r.over = 'escaped'; r.T = 30; return r; };
  assert.equal(F.rescue(s, lost()), false, 'chưa có lưới');
  F.buyAcc(s, 'net'); const r = lost(); assert.equal(F.rescue(s, r), true); assert.equal(r.over, null); assert.equal(r.prog, .35); assert.ok(r.T <= r.p.maxT - 8 + 1e-9);
  assert.equal(F.rescue(s, lost()), false, 'chỉ 1 lần mỗi vé');
  const c = lost(); c.over = 'caught'; F.dropTicket(s); F.rent(s, 'forest', D); assert.equal(F.rescue(s, c), false, 'cá đã bắt được thì không cần');
  assert.equal(F.rescue(s, lost()), true, 'vé mới có lưới lại');
});
test('land + sell: value scales with quality and the day multiplier, first catch gives a one-time bonus, selling pays the bucket', () => {
  const s = ready({ coins: 5000 }); F.rent(s, 'pond', D);
  const a = F.land(s, 'chep', 1), c0 = s.coins;
  assert.equal(a.ok, true); assert.equal(a.isNew, true); assert.equal(a.value, Math.round(11 * 1.2)); assert.equal(a.cm, Math.round(35 * 1.3)); assert.equal(a.bonus, 6); assert.equal(c0 - 0, s.coins);
  const b = F.land(s, 'chep', 0); assert.equal(b.isNew, false); assert.equal(b.bonus, 0); assert.equal(b.value, Math.round(11 * .8)); assert.ok(b.value < a.value);
  assert.equal(F.normalize(s).caught.chep, 2); assert.equal(F.normalize(s).record.chep, a.cm); assert.equal(F.normalize(s).ticket.catches, 2);
  const cash = s.coins, sold = F.sellAll(s); assert.equal(sold.ok, true); assert.equal(sold.n, 2); assert.equal(sold.coins, a.value + b.value); assert.equal(s.coins, cash + sold.coins);
  assert.equal(F.sellAll(s).ok, false, 'giỏ trống');
  F.dropTicket(s); F.rent(s, 'pond', D); F.dropTicket(s); F.rent(s, 'pond', D); /* vé thứ 3 trong ngày ×0.6 */
  const d = F.land(s, 'chep', .5); assert.equal(d.mult, .6); assert.equal(d.value, Math.round(11 * 1 * .6));
  assert.equal(F.land(s, 'nope', .5).ok, false); assert.equal(F.land(st(), 'chep', .5).ok, false, 'không có vé');
});
test('settle: ticket ends only when no casts are left', () => {
  const s = ready({ coins: 500 }); F.rent(s, 'pond', D);
  for (let i = 0; i < 5; i++) { F.cast(s, 'worm'); assert.equal(F.settle(s).done, false); }
  F.cast(s, 'worm'); const e = F.settle(s); assert.equal(e.done, true); assert.equal(e.casts, 6); assert.equal(F.normalize(s).ticket, null);
});
test('economy: a decent player profits at the easy lake once or twice a day, then repeating the same lake stops paying (no grinding)', () => {
  const l = F.lake('pond'), ev = F.expectedValue('pond', 'worm') * 1.08, net = n => l.casts * ev * F.decayFor(n) - l.ticket - l.casts * F.bait('worm').cost;
  assert.ok(net(0) >= 12 && net(0) <= 30, 'vé đầu: lãi vừa phải ' + net(0));
  assert.ok(net(1) > 0, 'vé 2 vẫn còn lãi nhẹ');
  assert.ok(net(2) < net(1) && net(3) < 0 && net(4) < 0, 'từ vé 4 trở đi lỗ vốn');
  /* hồ khó: người chơi kém lỗ, cao thủ + cần tốt lời hơn hồ ao */
  const lakeNet = (id, rodId, skill, bait = 'corn') => { const k = F.lake(id), p = rate(id, rodId, skill, 100); return k.casts * p * F.expectedValue(id, bait) * 1.08 - k.ticket - k.casts * F.bait(bait).cost; };
  assert.ok(lakeNet('deep', 'bamboo', .4) < -30, 'tay mới + cần tre ở vịnh sâu thì lỗ nặng');
  assert.ok(lakeNet('deep', 'carbon', .85) > net(0), 'cao thủ + cần tốt lời hơn ao làng');
  assert.ok(lakeNet('forest', 'fiber', .6) > net(0) * .8 && lakeNet('forest', 'fiber', .6) < 110);
  assert.ok(lakeNet('deep', 'carbon', .95) < 160, 'trần thu nhập hợp lý');
  /* mồi: ở hồ rẻ giun lời nhất, mồi xịn dành cho hồ lớn */
  const bn = (id, b) => F.lake(id).casts * F.expectedValue(id, b) * 1.08 - F.lake(id).casts * F.bait(b).cost;
  assert.ok(bn('pond', 'worm') >= bn('pond', 'shrimp')); assert.ok(bn('forest', 'corn') > bn('forest', 'worm'));
});
test('normalize: repairs corrupted fishing data, keeps valid data, survives JSON round trip', () => {
  const s = st({ fishing: { rod: 'x', acc: { net: 1, zzz: true }, bait: { worm: -5, corn: '7', shrimp: 9999 }, pick: 'q', bucket: [{ f: 'chep', v: 12, cm: 30 }, { f: 'nope', v: 3 }, null, { f: 'loc', v: -1 }],
    ticket: { lake: 'pond', left: 99, mult: 7, catches: -2 }, day: { d: 5, n: { pond: 2, bad: 1, forest: -1 } }, caught: { chep: 3, nope: 4 }, record: { chep: 55 }, earned: 'a' } });
  const f = F.normalize(s);
  assert.equal(f.rod, null); assert.deepEqual(f.acc, { float: false, glasses: false, net: true });
  assert.equal(f.bait.worm, 0); assert.equal(f.bait.corn, 0); assert.equal(f.bait.shrimp, F.BAIT_CAP); assert.equal(f.pick, 'worm');
  assert.deepEqual(f.bucket, [{ f: 'chep', v: 12, cm: 30 }]);
  assert.equal(f.ticket.left, 6); assert.equal(f.ticket.mult, 1); assert.equal(f.ticket.catches, 0);
  assert.deepEqual(f.day, { d: '', n: { pond: 2 } }); assert.deepEqual(f.caught, { chep: 3 }); assert.equal(f.record.chep, 55); assert.equal(f.earned, 0);
  const ok = ready({ coins: 900 }); F.rent(ok, 'pond', D); F.cast(ok, 'worm'); F.land(ok, 'rophi', .5);
  const copy = clone(ok); assert.deepEqual(F.normalize(clone(copy)), F.normalize(ok), 'lưu/đọc lại không đổi');
  const old = { coins: 5, eggs: [], pets: [] }; assert.equal(F.normalize(old).rod, null, 'file lưu cũ không có state.fishing vẫn chạy');
  const z = { coins: 1, fishing: { ticket: { lake: 'pond', left: 0 } } }; assert.equal(F.normalize(z).ticket.left, 0, 'vé hết lượt vẫn giữ cho tới khi tất toán'); assert.equal(F.settle(z).done, true); assert.equal(F.normalize(z).ticket, null);
  assert.equal(F.normalize({ coins: 1, fishing: { ticket: { lake: 'zzz', left: 3 } } }).ticket, null);
});
test('a full ticket flow: rent, cast x6 with a decent player, sell — coins are conserved', () => {
  const s = ready({ coins: 300 }); F.buyBait(s, 'worm'); const start = s.coins;
  const rnd = rng(11); F.rent(s, 'pond', D); let landed = 0, spentBait = 0;
  while (F.normalize(s).ticket) {
    const bt = F.activeBait(s); const c = F.cast(s, bt, rnd); assert.equal(c.ok, true); spentBait++;
    const fish = F.pickFish('pond', bt, rnd); const r = reel('pond', fish.id, 'bamboo', r2 => bot(.5, r2), landed + 100);
    if (r.over === 'caught') { assert.equal(F.land(s, fish.id, r.quality).ok, true); landed++; }
    F.settle(s);
  }
  const sold = F.sellAll(s), f = F.normalize(s);
  assert.equal(f.earned, sold.coins + Object.keys(f.caught).reduce((a, id) => a + Math.max(2, Math.round(F.fishInfo(id).v * F.FIRST_BONUS)), 0));
  assert.equal(s.coins, start - 10 + f.earned, 'xu = ban đầu − vé + thu (bán cá + thưởng lần đầu)');
});

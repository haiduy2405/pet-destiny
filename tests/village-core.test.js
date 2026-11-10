'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { load, clone } = require('./helpers');
const { Village, EcoData } = load(['farm-core.js', 'fishing-core.js', 'village-core.js'], ['Village', 'EcoData']);
const D1 = '2026-11-10', D2 = '2026-11-11';
const mk = (x = {}) => ({ coins: 0, pets: [], collection: [], farm: { barn: {} }, fishing: { bucket: [], bait: {}, caught: {} }, ...x });
const sellOf = id => EcoData.farm.crops.find(c => c.id === id).sell;

test('orders: deterministic per date, three slots, premium 1.3–1.5 over base and rounded to 5', () => {
  assert.deepEqual(Village.orders(D1), Village.orders(D1));
  for (let d = 1; d <= 60; d++) {
    const date = '2026-12-' + String(d % 28 + 1).padStart(2, '0') + (d > 28 ? '' : '');
    const o = Village.orders(date);
    assert.equal(o.length, 3);
    o.forEach((x, i) => {
      let base = 0;
      for (const [id, n] of Object.entries(x.need.crop || {})) base += n * sellOf(id);
      if (x.need.fish) base += x.need.fish.n * x.need.fish.min;
      assert.ok(x.reward % 5 === 0 && x.reward >= base * 1.25 && x.reward <= base * 1.55 + 5, `slot ${i} ${x.reward} vs ${base}`);
    });
  }
});

test('deliver: consumes crops and the cheapest qualifying fish, pays once per day', () => {
  const o = Village.orders(D1);
  const s = mk();
  for (const [id, n] of Object.entries(o[0].need.crop)) s.farm.barn[id] = n + 2;
  const r = Village.deliver(s, D1, 0);
  assert.equal(r.ok, true);
  assert.equal(s.coins, o[0].reward);
  assert.equal(Object.values(o[0].need.crop)[0] + 2 - (s.farm.barn[Object.keys(o[0].need.crop)[0]] || 0), Object.values(o[0].need.crop)[0]);
  assert.equal(Village.deliver(s, D1, 0).ok, false);
  const s2 = mk(); const f = o[1].need.fish;
  s2.fishing.bucket = [{ f: 'x', v: f.min + 50, cm: 1 }, { f: 'x', v: f.min, cm: 1 }, { f: 'x', v: f.min + 5, cm: 1 }, { f: 'x', v: f.min - 1, cm: 1 }, { f: 'x', v: f.min + 1, cm: 1 }];
  assert.equal(Village.deliver(s2, D1, 1).ok, true);
  const left = s2.fishing.bucket.map(x => x.v);
  assert.ok(left.includes(f.min + 50) && left.includes(f.min - 1), 'giữ cá đắt và cá không đủ điều kiện');
  assert.equal(left.length, 5 - f.n);
  assert.equal(Village.deliver(s2, D2, 1).ok, false, 'ngày mới nhưng giỏ không đủ → từ chối');
});

test('deliver: insufficient goods leave state untouched', () => {
  const s = mk({ farm: { barn: {} } }); const before = clone(s);
  for (let i = 0; i < 3; i++) assert.equal(Village.deliver(s, D1, i).ok, false);
  assert.equal(s.coins, 0); assert.deepEqual(s.farm, before.farm); assert.deepEqual(s.fishing, before.fishing);
  assert.equal(Village.deliver(s, D1, 9).ok, false);
});

test('orders reset on a new day', () => {
  const s = mk(); const o = Village.orders(D1);
  for (const [id, n] of Object.entries(o[0].need.crop)) s.farm.barn[id] = n;
  Village.deliver(s, D1, 0);
  assert.equal(Village.status(s, D1)[0].done, true);
  assert.equal(Village.status(s, D2)[0].done, false);
});

test('check-in: cycles 1..7, once per day, no punishment for gaps, bait respects cap', () => {
  const s = mk(); const L = EcoData.village.checkin.length; let date = new Date(Date.UTC(2026, 10, 1));
  const iso = () => date.toISOString().slice(0, 10);
  for (let i = 1; i <= L + 1; i++) {
    const r = Village.checkin(s, iso());
    assert.equal(r.ok, true); assert.equal(r.day, (i - 1) % L + 1);
    assert.equal(Village.checkin(s, iso()).ok, false);
    date = new Date(date.getTime() + (i === 3 ? 3 : 1) * 86400000);
  }
  assert.equal(s.village.ci.total, L + 1);
  const s2 = mk(); s2.village = { ci: { last: '2026-01-01', day: 2, total: 2 } };
  s2.fishing.bait.worm = EcoData.fishing.baitCap - 2;
  assert.equal(Village.checkin(s2, D1).ok, true);
  assert.equal(s2.fishing.bait.worm, EcoData.fishing.baitCap);
  const st = Village.checkinStatus(s2, D1);
  assert.equal(st.claimed, true); assert.equal(st.days.filter(d => d.got).length, 3);
});

test('achievements: claim once, only when reached, rewards add up', () => {
  const s = mk({ pets: [{}, {}], fishing: { bucket: [], bait: {}, caught: { a: 6, b: 5 } } });
  let a = Village.achievements(s, D1);
  assert.equal(a.find(x => x.id === 'fish').value, 11);
  assert.equal(Village.claimAch(s, D1, 'fish:2').ok, false);
  assert.equal(Village.claimAch(s, D1, 'fish:1').ok, true);
  assert.equal(Village.claimAch(s, D1, 'fish:1').ok, false);
  assert.equal(s.coins, 15);
  assert.equal(Village.claimAch(s, D1, 'nope:1').ok, false);
  assert.ok(Village.badge(s, D1) >= 1);
});

test('normalize repairs corrupted village state', () => {
  for (const bad of [null, 5, 'x', [], { od: 7, ci: 'z', ach: 'q', orders: -4, best: NaN }, { ci: { day: 99, total: -1 } }]) {
    const s = mk({ village: bad });
    const v = Village.normalize(s, D1);
    assert.ok(Array.isArray(v.od.done) && Array.isArray(v.ach));
    assert.ok(v.orders >= 0 && v.best >= 0 && v.ci.day <= EcoData.village.checkin.length && v.ci.total >= 0);
    assert.doesNotThrow(() => { Village.status(s, D1); Village.achievements(s, D1); Village.checkinStatus(s, D1); Village.badge(s, D1); });
  }
});

test('best streak follows the quest streak', () => {
  const s = mk({ dq: { streak: 9 } }); assert.equal(Village.normalize(s, D1).best, 9);
  s.dq.streak = 2; assert.equal(Village.normalize(s, D1).best, 9);
});

test('economy: orders add a modest daily income; achievements are a bounded one-time total', () => {
  const quests = load(['quests-core.js'], ['Quests']).Quests;
  assert.ok(Village.maxOrdersDaily() <= quests.maxDaily() * 4, 'đơn hàng không vượt xa nhiệm vụ ngày');
  const total = EcoData.village.ach.reduce((a, x) => a + x.tiers.reduce((b, t) => b + t[1], 0), 0);
  assert.ok(total <= 2000, 'tổng thưởng thành tựu ' + total);
  const week = EcoData.village.checkin.reduce((a, r) => a + (r.coins || 0), 0);
  assert.ok(week <= 200, 'điểm danh cả tuần ' + week);
  for (const a of EcoData.village.ach) for (let i = 1; i < a.tiers.length; i++) assert.ok(a.tiers[i][0] > a.tiers[i - 1][0] && a.tiers[i][1] > a.tiers[i - 1][1]);
});

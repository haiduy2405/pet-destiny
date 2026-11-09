'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { load, pet, seq, clone } = require('./helpers');
const { Farm: F } = load(['farm-core.js'], ['Farm']);
const st = (extra = {}) => ({ coins: 1000, eggs: [], pets: [], ...extra });
const adult = (id, extra = {}) => pet(id, { totalXP: 60, food: 80, clean: 80, joy: 80, energy: 80, ...extra });

test('crops: always profitable even at the worst market price, longer crops earn more per seed', () => {
  for (const c of F.crops) {
    const worst = Math.round(c.sell * 0.85);
    assert.ok(worst > c.seed, c.id + ' worst price still profitable');
  }
  for (let i = 1; i < F.crops.length; i++) { assert.ok(F.crops[i].grow > F.crops[i - 1].grow); assert.ok(F.crops[i].sell - F.crops[i].seed > F.crops[i - 1].sell - F.crops[i - 1].seed); }
});
test('market price is deterministic per day and within 85%-125%', () => {
  for (const c of F.crops) for (let d = 1; d <= 40; d++) { const day = '2026-11-' + d; const m = F.market(day, c.id); assert.ok(m >= 0.85 - 1e-9 && m <= 1.25 + 1e-9); assert.equal(F.market(day, c.id), m); }
  const set = new Set(Array.from({ length: 60 }, (_, d) => F.market('d' + d, 'corn').toFixed(2))); assert.ok(set.size >= 4, 'prices vary');
});
test('plant -> grow -> harvest -> sell cycle', () => {
  const s = st(), t0 = 1e9;
  assert.equal(F.plant(s, 0, 'carrot', t0).ok, true); assert.equal(s.coins, 985);
  assert.equal(F.harvest(s, 0, t0 + 5 * F.MIN).ok, false, 'not ripe yet');
  assert.equal(F.plotInfo(s.farm.plots[0], t0 + 5 * F.MIN).state, 'growing');
  const h = F.harvest(s, 0, t0 + 10 * F.MIN, () => 0.99); assert.equal(h.ok, true); assert.equal(h.n, 1); assert.equal(s.farm.plots[0], null);
  const r = F.sell(s, 'carrot', 'all', 'd1'); assert.equal(r.ok, true); assert.equal(s.coins, 985 + r.coins); assert.ok(r.coins > 15);
  assert.equal(F.sell(s, 'carrot', 1, 'd1').ok, false);
});
test('bonus harvest gives 2', () => {
  const s = st(); F.plant(s, 0, 'cabbage', 0); const h = F.harvest(s, 0, 3 * F.MIN, () => 0); assert.equal(h.n, 2); assert.equal(s.farm.barn.cabbage, 2);
});
test('cannot plant without coins, on busy or locked plots, or unknown seed', () => {
  const s = st({ coins: 5 }); assert.equal(F.plant(s, 0, 'cabbage', 0).ok, false); assert.equal(s.coins, 5);
  s.coins = 500; assert.equal(F.plant(s, 5, 'cabbage', 0).ok, false); assert.equal(F.plant(s, 0, 'nope', 0).ok, false);
  F.plant(s, 0, 'cabbage', 0); const c = s.coins; assert.equal(F.plant(s, 0, 'cabbage', 0).ok, false); assert.equal(s.coins, c);
});
test('watering cuts 20% once per plant and not when ripe', () => {
  const s = st(), t0 = 0; F.plant(s, 0, 'corn', t0);
  assert.equal(F.water(s, 0, t0).ok, true); assert.equal(F.water(s, 0, t0).ok, false);
  assert.equal(F.plotInfo(s.farm.plots[0], t0).left, F.find('corn').grow * 0.8);
  F.plant(s, 1, 'cabbage', t0); assert.equal(F.water(s, 1, t0 + 4 * F.MIN).ok, false);
});
test('clock set backwards never breaks (progress clamps, no negative time)', () => {
  const s = st(); F.plant(s, 0, 'pumpkin', 5e9); const i = F.plotInfo(s.farm.plots[0], 1e9);
  assert.equal(i.state, 'growing'); assert.ok(i.progress >= 0 && i.progress <= 1 && i.left > 0);
});
test('plots: buy up to the limit with rising cost', () => {
  const s = st({ coins: 5000 }); const costs = [];
  for (let i = 0; i < 6; i++) { const c = F.plotCost(s); const r = F.buyPlot(s); if (r.ok) costs.push(c); }
  assert.deepEqual(costs, [150, 300, 600]); assert.equal(s.farm.unlocked, F.MAX_PLOTS); assert.equal(s.farm.plots.length, F.MAX_PLOTS);
  assert.equal(F.plant(s, 5, 'cabbage', 0).ok, true);
});
test('barn cap blocks harvest instead of losing the crop', () => {
  const s = st(); F.normalize(s); s.farm.barn.cabbage = F.BARN_CAP; F.plant(s, 0, 'cabbage', 0);
  const h = F.harvest(s, 0, 3 * F.MIN, () => 0.9); assert.equal(h.ok, false); assert.ok(s.farm.plots[0]);
});
test('corrupt farm data is repaired', () => {
  const s = st({ farm: { plots: [{ crop: 'bad', at: 1 }, { crop: 'corn', at: 'x' }, { crop: 'corn', at: 5 }], unlocked: 99, barn: { corn: -2, fake: 3, melon: 5.7 }, job: { a: 'x' }, cd: [] } });
  const f = F.normalize(s); assert.equal(f.unlocked, F.MAX_PLOTS); assert.equal(f.plots[0], null); assert.equal(f.plots[1], null); assert.equal(f.plots[2].crop, 'corn');
  assert.deepEqual(f.barn, { melon: 5 }); assert.equal(f.job, null); assert.deepEqual(f.cd, {});
});
test('breeding: cost, wait, egg inherits from parents', () => {
  const s = st({ pets: [adult('a', { species: 2, color: 3 }), adult('b', { species: 5, color: 7 })] }), t0 = 1e9;
  const r = F.startBreed(s, 'a', 'b', t0); assert.equal(r.ok, true); assert.equal(s.coins, 1000 - F.BREED_COST);
  assert.equal(F.collect(s, t0 + 60000).ok, false, 'not ready');
  assert.equal(F.startBreed(s, 'a', 'b', t0).ok, false, 'busy');
  let n = 0; const rnd = seq(0.3, 0.9, 0.9, 0.2); // species a, colour b(.9 -> second), no mutations
  const c = F.collect(s, t0 + F.BREED_MS, rnd, () => 'E' + ++n);
  assert.equal(c.ok, true); assert.equal(s.eggs.length, 1); const e = s.eggs[0];
  assert.equal(e.id, 'E1'); assert.equal(e.species, 2); assert.equal(e.color, 7); assert.equal(e.hatchAt, null); assert.equal(e.bred, true);
  assert.equal(s.farm.job, null); assert.equal(s.farm.bred, 1);
});
test('breeding statistics: offspring species come from parents ~90% of the time, mutations happen', () => {
  let parent = 0, mutant = 0, N = 4000, x = 12345; const rnd = () => (x = (x * 1664525 + 1013904223) % 4294967296) / 4294967296;
  for (let i = 0; i < N; i++) {
    const s = st({ pets: [adult('a', { species: 1 }), adult('b', { species: 2 })] }); F.startBreed(s, 'a', 'b', 0); const c = F.collect(s, F.BREED_MS, rnd, () => 'e');
    if ([1, 2].includes(c.egg.species)) parent++; else mutant++;
  }
  assert.ok(parent / N > 0.9 && parent / N < 0.995, 'parent share ' + parent / N); assert.ok(mutant > 0);
});
test('breeding rules: young, unhappy, resting, identical or missing pets are refused without charging', () => {
  const s = st({ pets: [adult('a'), adult('b'), pet('baby', { totalXP: 5 }), adult('sad', { food: 5, clean: 5, joy: 5, energy: 5 })] });
  const before = clone(s);
  for (const [a, b] of [['a', 'a'], ['a', 'zzz'], ['a', 'baby'], ['sad', 'a']]) assert.equal(F.startBreed(s, a, b, 0).ok, false);
  assert.equal(s.coins, before.coins); assert.equal(s.farm.job, null);
  assert.equal(F.startBreed(st({ coins: 10, pets: s.pets }), 'a', 'b', 0).ok, false);
});
test('cooldown after breeding keeps both parents resting', () => {
  const s = st({ pets: [adult('a'), adult('b'), adult('c')] }); F.startBreed(s, 'a', 'b', 0); F.collect(s, F.BREED_MS);
  assert.equal(F.startBreed(s, 'a', 'c', F.BREED_MS + 1).ok, false);
  assert.equal(F.startBreed(s, 'c', 'a', F.BREED_MS + F.BREED_COOLDOWN + 1).ok, true);
});
test('collect survives a deleted parent', () => {
  const s = st({ pets: [adult('a', { species: 4, color: 4 }), adult('b')] }); F.startBreed(s, 'a', 'b', 0); s.pets = s.pets.filter(p => p.id === 'a');
  assert.equal(F.collect(s, F.BREED_MS, () => 0.5).ok, true);
});

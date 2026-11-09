'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { load, pet, legacyState, HOUR, MIN, clone } = require('./helpers');

const { PetHomes } = load(['home-core.js'], ['PetHomes']);
const T = 10 * HOUR, GRACE = 30 * MIN;

/** A normalized v1 state: pets placed on pages in order. */
function homesState(pets, extra = {}) {
  const s = legacyState({ pets, ...extra });
  PetHomes.normalize(s, T);
  return s;
}

test('normalize migrates a legacy save: pens become pages, the shop moves to page 1', () => {
  const s = legacyState({
    pets: [pet('a'), pet('b'), pet('c')], gardenLevel: 1, pens: ['b', 'ghost', 'a'],
    shop: { owned: ['sunset', 'flowers'], theme: 'sunset', decor: ['flowers'] },
  });
  PetHomes.normalize(s, T);
  assert.equal(s.homeVersion, 1);
  assert.equal(s.homes.length, 5, '1 + 4 per garden level');
  assert.deepEqual(s.homes.slice(0, 2).map(h => h.petId), ['b', 'a'], 'valid pens keep their order; unknown ids dropped');
  assert.deepEqual(s.homes[0].owned, ['sunset', 'flowers']);
  assert.equal(s.homes[0].theme, 'sunset');
  assert.deepEqual(s.homes[0].decor, ['flowers']);
  assert.deepEqual(s.pens, s.homes.map(h => h.petId));
});

test('normalize is idempotent and gives each pet at most one page', () => {
  const s = homesState([pet('a'), pet('b')]);
  s.homes.push({ petId: 'a', owned: [], equipped: {}, theme: 'classic', decor: [] });
  PetHomes.normalize(s, T);
  const once = clone(s);
  PetHomes.normalize(s, T);
  assert.deepEqual(s, once);
  assert.equal(s.homes.filter(h => h.petId === 'a').length, 1);
});

test('normalize repairs pet fields and starts the waiting clock only for unhoused pets', () => {
  const s = legacyState({ pets: [pet('a', { xp: 40, food: -5, evolution: 1 }), pet('b', { food: 'x' })] });
  PetHomes.normalize(s, T);
  const [a, b] = s.pets;
  assert.equal(a.totalXP, 40);
  assert.equal(a.food, 0, 'negative stats clamp to 0');
  assert.equal(a.evolutionCredits, 1);
  assert.equal(a.capital, 10);
  assert.equal(a.waitUntil, null, 'housed pet is not waiting');
  assert.equal(b.food, 0, 'non-numeric stats become 0');
  assert.equal(b.waitUntil, T + 24 * HOUR, 'migrated waiting pets get a 24h grace');
  const again = legacyState({ pets: [pet('a'), pet('b')] });
  PetHomes.normalize(again, T);
  again.pets[1].waitUntil = null;
  PetHomes.normalize(again, T + 1);
  assert.equal(again.pets[1].waitUntil, T + 1 + GRACE, 'later-waiting pets get the 30 minute grace');
});

test('sale price: base value grows with XP and evolution, floored', () => {
  assert.equal(PetHomes.rawValue(pet('a', { totalXP: 0 })), 10);
  assert.equal(PetHomes.rawValue(pet('a', { totalXP: 99 })), 10 + 9);
  assert.equal(PetHomes.rawValue(pet('a', { totalXP: 250, capital: 30, evolutionCredits: 2 })), 30 + 25 + 50);
  assert.equal(PetHomes.price(pet('a', { totalXP: 0 }), T), 10);
});

test('waiting discount: none during grace, then 10% per 30 minutes up to 50%', () => {
  const p = pet('a', { totalXP: 0, waitUntil: T });
  const at = ms => PetHomes.discount(p, T + ms);
  assert.equal(PetHomes.discount(p, T - 1), 0);
  assert.equal(at(0), 0.1);
  assert.equal(at(GRACE - 1), 0.1);
  assert.equal(at(GRACE), 0.2);
  assert.equal(at(3 * GRACE), 0.4);
  assert.equal(at(4 * GRACE), 0.5);
  assert.equal(at(100 * HOUR), 0.5, 'capped');
  assert.equal(PetHomes.price(pet('a', { totalXP: 100, waitUntil: T }), T + 100 * HOUR), Math.floor(20 * 0.5));
  assert.equal(PetHomes.discount(pet('a', { sickness: 0.3 }), T), 0.3, 'existing sickness counts');
});

test('assign moves a pet between pages and starts the displaced pet waiting', () => {
  const s = homesState([pet('a'), pet('b'), pet('c')]);
  PetHomes.buyPage; // (page purchase covered separately)
  s.homes.push({ petId: null, owned: [], equipped: {}, theme: 'classic', decor: [] });
  assert.equal(s.homes[0].petId, 'a');
  assert.equal(PetHomes.assign(s, 0, 'b', T + 5), true);
  assert.equal(s.homes[0].petId, 'b');
  assert.equal(s.pets.find(p => p.id === 'a').waitUntil, T + 5 + GRACE);
  assert.equal(s.homes.filter(h => h.petId === 'b').length, 1, 'a pet never occupies two pages');
});

test('assign rejects bad pages and unknown pets', () => {
  const s = homesState([pet('a')]);
  assert.equal(PetHomes.assign(s, 7, 'a', T), false);
  assert.equal(PetHomes.assign(s, -1, 'a', T), false);
  assert.equal(PetHomes.assign(s, 0, 'ghost', T), false);
  assert.equal(s.homes[0].petId, 'a');
});

test('merge conserves XP, capital, evolution credits and care stats', () => {
  const s = homesState([
    pet('a', { totalXP: 120, capital: 12, food: 80, clean: 40, joy: 100, energy: 10 }),
    pet('b', { totalXP: 70, capital: 20, evolution: 1, food: 60, clean: 30, joy: 50, energy: 90 }),
  ]);
  const a = s.pets[0], b = s.pets[1];
  a.reserve.joy = 5;
  const before = Object.fromEntries(PetHomes.keys.map(k => [k, a[k] + a.reserve[k] + b[k] + b.reserve[k]]));
  assert.equal(PetHomes.merge(s, 'a', 'b', T), true);
  assert.equal(s.pets.length, 1);
  assert.equal(a.totalXP, 190);
  assert.equal(a.capital, 32);
  assert.equal(a.evolution, 1);
  assert.equal(a.evolutionCredits, 1);
  for (const k of PetHomes.keys) {
    assert.ok(a[k] <= 100, k + ' never exceeds 100');
    assert.equal(a[k] + a.reserve[k], before[k], k + ' is conserved (overflow goes to reserve)');
  }
  assert.equal(a.food, 100);
  assert.equal(a.reserve.food, 40);
  assert.ok(s.homes.every(h => h.petId !== 'b'), 'the absorbed pet leaves every page');
});

test('merge refuses self-merge, missing pets and locked sources', () => {
  const s = homesState([pet('a'), pet('b', { locked: true })]);
  assert.equal(PetHomes.merge(s, 'a', 'a', T), false);
  assert.equal(PetHomes.merge(s, 'a', 'ghost', T), false);
  assert.equal(PetHomes.merge(s, 'a', 'b', T), false);
  assert.equal(s.pets.length, 2);
  assert.equal(PetHomes.merge(s, 'b', 'a', T), true, 'a locked pet may still absorb others');
});

test('merge keeps the target on the absorbed pet\'s page when the target had none', () => {
  const s = homesState([pet('a'), pet('b')]);
  PetHomes.assign(s, 0, null, T);
  s.homes[1] = { ...s.homes[0] };
  s.homes[0].petId = 'b';
  PetHomes.normalize(s, T);
  assert.equal(PetHomes.merge(s, 'a', 'b', T), true);
  assert.equal(s.homes[0].petId, 'a');
});

test('remove pays the current price, frees the page, and respects the lock', () => {
  const s = homesState([pet('a', { totalXP: 100 }), pet('b', { locked: true })]);
  assert.equal(PetHomes.remove(s, 'b', T), false);
  assert.equal(PetHomes.remove(s, 'ghost', T), false);
  const coins = PetHomes.remove(s, 'a', T);
  assert.equal(coins, 20);
  assert.equal(s.coins, 20);
  assert.deepEqual(s.pets.map(p => p.id), ['b']);
  assert.ok(s.homes.every(h => h.petId !== 'a'));
});

test('extra pages cost 120, then +90 each, and only when affordable', () => {
  const s = homesState([pet('a')], { coins: 119 });
  assert.equal(PetHomes.pagePrice(s), 120);
  assert.equal(PetHomes.buyPage(s), false);
  s.coins = 120 + 210;
  assert.equal(PetHomes.buyPage(s), true);
  assert.equal(s.coins, 210);
  assert.equal(s.homePage, 1, 'jumps to the new page');
  assert.equal(PetHomes.pagePrice(s), 210);
  assert.equal(PetHomes.buyPage(s), true);
  assert.equal(s.coins, 0);
  assert.equal(s.homes.length, 3);
});

test('xp accumulates without a cap; the 0-100 xp field is derived and level counts hundreds', () => {
  const p = pet('a', { totalXP: 95 });
  PetHomes.xp(p, 10);
  assert.equal(p.totalXP, 105);
  assert.equal(p.xp, 100);
  assert.equal(PetHomes.level(p), 2);
  PetHomes.xp(p, -500);
  assert.equal(p.totalXP, 0, 'cannot go negative');
});

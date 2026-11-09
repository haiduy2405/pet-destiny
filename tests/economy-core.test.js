'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { load, pet, legacyState, MIN } = require('./helpers');

const { Economy } = load(['economy-core.js'], ['Economy']);
const T = 1_000_000;

test('catalogue is sane: unique ids, positive integer prices, known types', () => {
  const ids = Economy.items.map(i => i.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const i of Economy.items) {
    assert.ok(Number.isInteger(i.price) && i.price > 0, i.id);
    assert.ok(['consume', 'theme', 'decor'].includes(i.type), i.id);
  }
});

test('normalize creates the shop record once and keeps it', () => {
  const s = legacyState();
  const shop = Economy.normalize(s);
  assert.deepEqual(shop, { owned: [], theme: 'classic', decor: [] });
  shop.owned.push('x');
  assert.equal(Economy.normalize(s).owned[0], 'x');
});

test('buy rejects unknown items, eggs, and insufficient coins without charging', () => {
  const s = legacyState({ coins: 10 });
  assert.equal(Economy.buy(s, 'nope', null, T).ok, false);
  assert.equal(Economy.buy(s, 'egg', null, T).ok, false);
  const r = Economy.buy(s, 'sunset', null, T);
  assert.equal(r.ok, false);
  assert.equal(s.coins, 10);
});

test('themes and decor are bought once, charged once, and applied', () => {
  const s = legacyState({ coins: 500 });
  assert.equal(Economy.buy(s, 'sunset', null, T).ok, true);
  assert.equal(s.coins, 500 - 80);
  assert.equal(s.shop.theme, 'sunset');
  assert.equal(Economy.buy(s, 'sunset', null, T).ok, false, 'no double purchase');
  assert.equal(s.coins, 420);

  assert.equal(Economy.buy(s, 'flowers', null, T).ok, true);
  assert.deepEqual(s.shop.decor, ['flowers']);
  assert.equal(s.coins, 420 - 40);
});

test('growth treat: +15 XP and +25 food, capped, with a 2 minute per-pet cooldown', () => {
  const s = legacyState({ coins: 100, pets: [pet('p', { xp: 90, food: 90 })] });
  assert.equal(Economy.buy(s, 'treat', 'p', T).ok, true);
  assert.equal(s.pets[0].xp, 100, 'xp capped at 100');
  assert.equal(s.pets[0].food, 100, 'food capped at 100');
  assert.equal(s.coins, 75);

  s.pets[0].xp = 10;
  assert.equal(Economy.buy(s, 'treat', 'p', T + MIN).ok, false, 'still on cooldown');
  assert.equal(s.coins, 75, 'a refused purchase costs nothing');
  assert.equal(Economy.buy(s, 'treat', 'p', T + 2 * MIN).ok, true);
});

test('growth treat refuses grown-up, evolved, or missing pets', () => {
  for (const p of [pet('p', { xp: 100 }), pet('p', { xp: 10, evolution: 1 })]) {
    const s = legacyState({ coins: 100, pets: [p] });
    assert.equal(Economy.buy(s, 'treat', 'p', T).ok, false);
    assert.equal(s.coins, 100);
  }
  assert.equal(Economy.buy(legacyState({ coins: 100 }), 'treat', 'ghost', T).ok, false);
});

test('rush hatches an incubating egg immediately and refuses idle/unknown eggs', () => {
  const s = legacyState({ coins: 40, eggs: [
    { id: 'hatching', hatchAt: T + 60_000 }, { id: 'idle', hatchAt: null },
  ] });
  assert.equal(Economy.buy(s, 'rush', 'idle', T).ok, false);
  assert.equal(Economy.buy(s, 'rush', 'ghost', T).ok, false);
  assert.equal(s.coins, 40);
  assert.equal(Economy.buy(s, 'rush', 'hatching', T).ok, true);
  assert.equal(s.eggs[0].hatchAt, T);
  assert.equal(s.coins, 25);
});

test('sellEgg pays 15 once and only for unhatched eggs', () => {
  const s = legacyState({ coins: 0, eggs: [{ id: 'a', hatchAt: null }, { id: 'b', hatchAt: T }] });
  assert.equal(Economy.sellEgg(s, 'b').ok, false, 'incubating egg cannot be sold');
  assert.equal(Economy.sellEgg(s, 'a').ok, true);
  assert.equal(s.coins, 15);
  assert.equal(Economy.sellEgg(s, 'a').ok, false, 'cannot sell the same egg twice');
  assert.equal(s.coins, 15);
});

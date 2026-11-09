'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./helpers');

const { DollHouse: D } = load(['dollhouse-core.js'], ['DollHouse']);
const fresh = (coins = 1000) => ({ coins });
/** buy + place `ids` into a room */
function fill(s, rid, ids) { for (const id of ids) { assert.ok(D.buy(s, id).ok, id); assert.ok(D.place(s, rid, id), id); } }

test('catalog sanity: unique ids, positive prices, known categories', () => {
  const ids = D.items.map(i => i.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(D.items.every(i => i.price > 0 && i.icon && i.name && D.cats[i.cat]));
  assert.equal(D.rooms[0].cost, 0);
});

test('normalize creates a playable default house and repairs garbage', () => {
  const s = fresh(); const d = D.normalize(s);
  assert.equal(d.rooms.living.built, true);
  assert.equal(d.rooms.bedroom.built, false);
  s.dollhouse = { owned: ['sofa', 'ghost'], rooms: { living: { wall: 'nope', objs: [{ id: 'sofa', x: -9, y: 999, s: 99 }, { id: 'tv', x: 5, y: 5 }, null] } }, roof: 'x', name: 'a'.repeat(50) };
  const r = D.normalize(s);
  assert.deepEqual(r.owned, ['sofa']);
  assert.equal(r.rooms.living.wall, 'cream');
  assert.equal(r.rooms.living.objs.length, 1, 'unowned and invalid objects are dropped');
  assert.deepEqual([r.rooms.living.objs[0].x, r.rooms.living.objs[0].y, r.rooms.living.objs[0].s], [2, 98, 3]);
  assert.equal(r.roof, D.roofs[0]);
  assert.equal(r.name.length, 24);
});

test('buying spends coins once; owned items can be placed many times', () => {
  const s = fresh(50);
  assert.equal(D.buy(s, 'sofa').ok, true);          // 45
  assert.equal(s.coins, 5);
  assert.equal(D.buy(s, 'sofa').paid, 0, 're-buy is free');
  assert.equal(s.coins, 5);
  assert.equal(D.buy(s, 'bed').ok, false);
  assert.equal(D.buy(s, 'nothing').ok, false);
  assert.ok(D.place(s, 'living', 'sofa')); assert.ok(D.place(s, 'living', 'sofa'));
  assert.equal(D.normalize(s).rooms.living.objs.length, 2);
  assert.equal(D.place(s, 'living', 'bed'), null, 'not owned');
});

test('rooms must be built (and paid for) before use', () => {
  const s = fresh(130);
  D.buy(s, 'sofa');
  assert.equal(D.place(s, 'bedroom', 'sofa'), null, 'locked room');
  assert.equal(D.build(s, 'bedroom').ok, false, '85 coins is not enough');
  s.coins = 500;
  assert.deepEqual(D.build(s, 'bedroom'), { ok: true, paid: 120 });
  assert.equal(s.coins, 380);
  assert.equal(D.build(s, 'bedroom').ok, false, 'already built');
  assert.ok(D.place(s, 'bedroom', 'sofa'));
});

test('walls and floors: paid once, free afterwards, clamped to built rooms', () => {
  const s = fresh(100);
  assert.deepEqual(D.setStyle(s, 'living', 'wall', 'pink'), { ok: true, paid: 20 });
  assert.deepEqual(D.setStyle(s, 'living', 'wall', 'cream'), { ok: true, paid: 0 });
  assert.deepEqual(D.setStyle(s, 'living', 'wall', 'pink'), { ok: true, paid: 0 }, 'already owned');
  assert.equal(s.coins, 80);
  assert.equal(D.setStyle(s, 'bedroom', 'wall', 'sky').ok, false, 'locked room');
  s.coins = 1; assert.equal(D.setStyle(s, 'living', 'floor', 'marble').ok, false);
});

test('move / resize / flip / remove objects with clamping', () => {
  const s = fresh(); fill(s, 'living', ['teddy']);
  const u = D.normalize(s).rooms.living.objs[0].u;
  assert.equal(D.update(s, 'living', u, { x: 30, y: 40, s: 10, f: true }), true);
  const o = D.normalize(s).rooms.living.objs[0];
  assert.deepEqual([o.x, o.y, o.s, o.f], [30, 40, 3, true]);
  assert.equal(D.update(s, 'living', 999, { x: 1 }), false);
  assert.equal(D.remove(s, 'living', u), true);
  assert.equal(D.remove(s, 'living', u), false);
});

test('object limit per room', () => {
  const s = fresh(1e6); D.buy(s, 'ball');
  for (let i = 0; i < D.MAX_OBJ; i++) assert.ok(D.place(s, 'living', 'ball'));
  assert.equal(D.place(s, 'living', 'ball'), null);
});

test('star rating needs enough items, variety, and a restyled wall + floor for 3 stars', () => {
  const s = fresh(5000);
  assert.equal(D.rate(s, 'living').stars, 0);
  fill(s, 'living', ['ball', 'teddy']);
  assert.equal(D.rate(s, 'living').stars, 1);
  fill(s, 'living', ['sofa', 'lamp', 'pot2']);                 // 5 items, 3 categories (toy, furn, plant)
  assert.equal(D.rate(s, 'living').stars, 2);
  fill(s, 'living', ['frame', 'cake', 'tv']);                  // 8 items, 5 categories
  assert.equal(D.rate(s, 'living').stars, 2, 'needs a custom wall AND floor');
  D.setStyle(s, 'living', 'wall', 'sky');
  assert.equal(D.rate(s, 'living').stars, 2, 'wall alone is not enough');
  D.setStyle(s, 'living', 'floor', 'carpet');
  const r = D.rate(s, 'living');
  assert.equal(r.stars, 3);
  assert.match(r.need, /hoàn hảo/);
});

test('star coins are paid exactly once per room per star', () => {
  const s = fresh(5000); fill(s, 'living', ['ball', 'teddy']);
  const before = s.coins;
  assert.deepEqual(D.claim(s, 'living'), [{ stars: 1, coins: 10 }]);
  assert.equal(s.coins, before + 10);
  assert.deepEqual(D.claim(s, 'living'), [], 'no double pay');
  D.remove(s, 'living', D.normalize(s).rooms.living.objs[0].u);           // drop to 0 stars, then restore
  fill(s, 'living', ['ball']);
  assert.deepEqual(D.claim(s, 'living'), [], 'rebuilding the same star does not pay again');
  fill(s, 'living', ['sofa', 'lamp', 'pot2']);
  assert.deepEqual(D.claim(s, 'living'), [{ stars: 2, coins: 25 }]);
});

test('house-warming party needs 3 built rooms, each with 2+ stars, and pays once', () => {
  const s = fresh(1e5);
  assert.equal(D.partyReady(s), false);
  D.build(s, 'bedroom'); D.build(s, 'kitchen');
  fill(s, 'living', ['ball', 'sofa', 'lamp', 'pot2', 'frame']);
  fill(s, 'bedroom', ['bed', 'teddy', 'lamp', 'tulip', 'ribbon']);
  assert.equal(D.partyReady(s), false, 'kitchen is still empty');
  fill(s, 'kitchen', ['cake', 'pizza', 'sofa', 'tulip', 'star']);
  assert.equal(D.partyReady(s), true);
  const before = s.coins;
  assert.deepEqual(D.party(s), { ok: true, coins: 100 });
  assert.equal(D.party(s).coins, 0, 'repeat parties are free fun, no coins');
  assert.equal(s.coins, before + 100);
  assert.equal(D.normalize(s).party, 2);
  assert.deepEqual(D.pride(s), { stars: 6, max: 9, rooms: 3 });
});

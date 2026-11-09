'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { load, seq } = require('./helpers');
const { LuckyBox: L } = load(['lucky-core.js'], ['LuckyBox']);
const mk = (coins = 1000) => ({ coins });
const lcg = seed => () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;

test('odds sum to 100% and expected value is slightly below the ticket price', () => {
  const sum = L.odds().reduce((a, o) => a + o.percent, 0);
  assert.ok(Math.abs(sum - 100) < 0.2);
  const ev = L.expected() / L.PRICE;
  assert.ok(ev >= 0.65 && ev <= 0.9, 'EV ratio ' + ev);
});
test('simulated spending returns 80–100% of the price (no money machine)', () => {
  const rnd = lcg(7), s = mk(1e9); let spent = 0, back = 0;
  for (let i = 0; i < 20000; i++) {
    const day = 'd' + i, before = s.coins; s.lucky = { day, bought: 0, freeDay: day, tickets: 0, pity: s.lucky?.pity || 0 };
    const r = L.open(s, { rnd, today: day, pool: { common: ['a'], rare: ['b'] } });
    if (r.source === 'paid') { spent += 60; back += r.gain + (r.prize.kind === 'decor' && r.item ? r.prize.value : 0) + (r.prize.kind === 'ticket' ? 60 * .88 : 0); }
  }
  const ratio = back / spent; assert.ok(ratio > .8 && ratio < 1.02, 'ratio ' + ratio);
});
test('first open of a day is free, later ones cost 60', () => {
  const s = mk(100), o = { rnd: lcg(1), today: 'd1' };
  const a = L.open(s, o); assert.equal(a.source, 'free'); assert.equal(a.paid, 0);
  const c = s.coins, b = L.open(s, o); assert.equal(b.source, 'paid'); assert.equal(s.coins, c - 60 + b.gain);
});
test('cannot buy without enough coins and nothing changes', () => {
  const s = mk(10), o = { rnd: lcg(2), today: 'd1' }; L.open(s, o);
  const snap = JSON.stringify(s), r = L.open(s, o);
  assert.equal(r.ok, false); assert.equal(JSON.stringify(s), snap);
});
test('daily purchase cap', () => {
  const s = mk(1e6), o = { rnd: lcg(3), today: 'd1' }; L.open(s, o);
  let paid = 0; for (let i = 0; i < 40; i++) { const r = L.open(s, o); if (r.ok && r.source === 'paid') paid++; }
  assert.ok(paid <= L.DAILY_CAP + 0); assert.equal(L.status(s, 'd1').left >= 0, true);
  s.lucky.tickets = 0; const next = L.open(s, { rnd: lcg(4), today: 'd2' }); assert.equal(next.ok, true);
});
test('pity guarantees a rare prize after enough misses', () => {
  const s = mk(1e6); s.lucky = { day: 'd1', bought: 0, freeDay: 'd1', tickets: 0, pity: L.PITY_AFTER };
  for (let i = 0; i < 50; i++) { s.lucky.pity = L.PITY_AFTER; s.lucky.bought = 0; const r = L.open(s, { rnd: lcg(i + 9), today: 'd1' }); assert.ok(L.isRare(r.prize)); assert.equal(s.lucky.pity, 0); }
});
test('pity never exceeds the threshold in a long run', () => {
  const s = mk(1e9), rnd = lcg(11); let max = 0;
  for (let i = 0; i < 3000; i++) { const day = 'd' + (i % 400); L.open(s, { rnd, today: day }); max = Math.max(max, s.lucky.pity); s.lucky.bought = 0; s.lucky.freeDay = ''; }
  assert.ok(max <= L.PITY_AFTER);
});
test('decor prize hands out an item, or converts to coins when none left', () => {
  const rnd = seq(0.78, 0.0); // roll lands on dec1 region then picks item 0
  const s = mk(100); const r = L.open(s, { rnd, today: 'd1', pool: { common: ['sofa'], rare: [] } });
  assert.equal(r.prize.id, 'dec1'); assert.equal(r.item, 'sofa'); assert.equal(r.gain, 0);
  const s2 = mk(100); const r2 = L.open(s2, { rnd: seq(0.78), today: 'd1', pool: { common: [], rare: [] } });
  assert.equal(r2.converted, true); assert.equal(s2.coins, 100 + 30);
});
test('free-ticket prize adds a ticket that is used before paying', () => {
  const s = mk(100), r = L.open(s, { rnd: seq(0.87), today: 'd1' });
  assert.equal(r.prize.id, 'tick'); assert.equal(s.lucky.tickets, 1); const c = s.coins, r2 = L.open(s, { rnd: lcg(5), today: 'd1' });
  assert.equal(r2.source, 'ticket'); assert.equal(s.coins, c + r2.gain);
});
test('corrupt lucky data is repaired', () => {
  const s = { coins: 100, lucky: { day: 5, bought: -3, tickets: 'x', history: [null, { id: 'c30' }, 7] } };
  const st = L.status(s, 'd1'); assert.equal(st.tickets, 0); assert.equal(st.history.length, 1); assert.equal(st.left, L.DAILY_CAP);
});

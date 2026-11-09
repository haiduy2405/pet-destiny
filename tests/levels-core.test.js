'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { load, seq } = require('./helpers');
const { Levels: L } = load(['levels-core.js'], ['Levels']);

test('level definitions: three levels, strictly harder and strictly better paid', () => {
  assert.deepEqual(L.defs.map(d => d.name), ['Dễ', 'Vừa', 'Khó']);
  for (let i = 1; i < 3; i++) {
    assert.ok(L.defs[i].mult > L.defs[i - 1].mult, 'multiplier grows');
    assert.ok(L.defs[i].options > L.defs[i - 1].options, 'more options');
    assert.ok(L.defs[i].roundsAdd >= L.defs[i - 1].roundsAdd, 'never fewer rounds');
  }
  assert.equal(L.defs[0].hints && L.defs[1].hints && !L.defs[2].hints, true);
  assert.equal(L.clampLevel(0), 1); assert.equal(L.clampLevel(9), 1); assert.equal(L.clampLevel('2'), 2); assert.equal(L.clampLevel(NaN), 1);
});

test('rewards rise with the level, on both the floor and the ceiling, and Dễ equals the old flat pay', () => {
  const r = [1, 2, 3].map(n => L.payRange(n));
  assert.deepEqual(r[0], [15, 20], 'Dễ keeps the original 15–20');
  for (let i = 1; i < 3; i++) { assert.ok(r[i][0] > r[i - 1][0]); assert.ok(r[i][1] > r[i - 1][1]); }
  assert.deepEqual(r[1], [23, 31]); assert.deepEqual(r[2], [33, 44]);
  assert.equal(L.bonus(1), 0); assert.equal(L.firstTryExtra(1, 9), 0);
  assert.equal(L.firstTryExtra(3, 99), 6, 'first-try bonus is capped at 5 questions');
});

test('pay per round does not fall as the level rises (harder is never a worse deal)', () => {
  const base = 6, perRound = n => L.payRange(n)[0] / L.roundsFor(n, base);
  assert.ok(perRound(2) >= perRound(1) && perRound(3) >= perRound(2));
});

test('roundsFor respects a cap and a floor of 3', () => {
  assert.deepEqual([1, 2, 3].map(n => L.roundsFor(n, 6)), [5, 6, 8]);
  assert.equal(L.roundsFor(3, 6, 7), 7);
  assert.equal(L.roundsFor(1, 3), 3);
});

test('fitOptions keeps the answer, trims/pads to n, never duplicates and leaves 2-option questions alone', () => {
  const rnd = seq(.1, .7, .3, .9, .5);
  const opts = ['a', 'b', 'c', 'd'];
  for (const n of [3, 4, 5]) {
    const out = L.fitOptions(opts, 'a', ['x', 'y', 'z', 'a', 'b'], n, rnd);
    assert.equal(out.length, n); assert.ok(out.includes('a')); assert.equal(new Set(out).size, n);
  }
  assert.deepEqual(L.fitOptions(['yes', 'no'], 'yes', ['x', 'y'], 5), ['yes', 'no']);
  assert.equal(L.fitOptions(opts, 'a', [], 5).length, 4, 'no extras available -> keeps what exists');
  assert.equal(L.fitOptions(['a', 'a', 'b'], 'a', [], 3).length, 2, 'duplicates collapse');
});

test('progress: levels unlock one at a time and only with enough first-try accuracy', () => {
  const s = {};
  assert.equal(L.unlocked(s, 'clock', 1), true); assert.equal(L.unlocked(s, 'clock', 2), false);
  assert.equal(L.record(s, 'clock', 1, .5).unlockedNext, false);
  assert.equal(L.unlocked(s, 'clock', 2), false);
  assert.deepEqual(L.record(s, 'clock', 1, .6), { unlockedNext: true, level: 2 });
  assert.equal(L.unlocked(s, 'clock', 2), true); assert.equal(L.unlocked(s, 'clock', 3), false);
  assert.equal(L.record(s, 'clock', 3, 1).unlockedNext, false, 'cannot skip a locked level');
  assert.equal(L.record(s, 'clock', 1, 1).unlockedNext, false, 'replaying an old level does not unlock again');
  assert.equal(s.levels.clock.best[1], 1, 'best ratio is kept');
  L.record(s, 'clock', 2, .9); assert.equal(L.progress(s, 'clock').max, 3);
  L.record(s, 'clock', 3, 1); assert.equal(L.progress(s, 'clock').max, 3, 'max never exceeds 3');
  assert.equal(L.unlocked(s, 'other', 2), false, 'progress is per game');
});

test('progress repairs garbage in a save', () => {
  const s = { levels: { clock: { max: 'x', best: 5 } } };
  assert.deepEqual(L.progress(s, 'clock'), { max: 1, best: {} });
  s.levels = 'oops'; assert.equal(L.progress(s, 'clock').max, 1);
});

test('arcade parameters grow with the level for every game', () => {
  assert.deepEqual(L.arcadeTypes.sort(), ['colors', 'count', 'memory', 'order', 'pairs', 'snacks']);
  for (const t of L.arcadeTypes) {
    const p = [1, 2, 3].map(n => L.arcade[t](n));
    for (const k of Object.keys(p[0])) { assert.ok(p[1][k] >= p[0][k] && p[2][k] > p[0][k], `${t}.${k}`); }
  }
  assert.deepEqual(L.arcade.memory(1), { len: 3, symbols: 4 }, 'Dễ matches the original game');
  assert.equal(L.arcade.pairs(1).pairs, 3); assert.equal(L.arcade.snacks(1).need, 8); assert.equal(L.arcade.order(1).n, 9);
});

test('arcade generators are valid for every seed and level', () => {
  const rng = seed => { let s = seed; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 } };
  for (let seed = 1; seed <= 200; seed++) for (const n of [1, 2, 3]) {
    const r = rng(seed);
    const m = L.arcade.memory(n), sq = L.sequence(m.len, m.symbols, r);
    assert.equal(sq.length, m.len); assert.ok(sq.every(x => Number.isInteger(x) && x >= 0 && x < m.symbols));
    const c = L.arcade.count(n), count = c.min + Math.floor(r() * (c.max - c.min + 1)), ch = L.countChoices(count, c.min, c.max, c.choices, r);
    assert.ok(ch.includes(count), `count ${count} in ${ch}`); assert.equal(new Set(ch).size, ch.length); assert.ok(ch.every(x => x >= 1));
    const deck = L.pairDeck(L.arcade.pairs(n).pairs, ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], r);
    assert.equal(deck.length, L.arcade.pairs(n).pairs * 2);
    for (const icon of new Set(deck)) assert.equal(deck.filter(x => x === icon).length, 2);
    const cc = L.arcade.colors(n), target = Math.floor(r() * 12), col = L.colorChoices(target, cc.choices, 12, r);
    assert.equal(col.length, cc.choices); assert.ok(col.includes(target)); assert.equal(new Set(col).size, col.length);
  }
});

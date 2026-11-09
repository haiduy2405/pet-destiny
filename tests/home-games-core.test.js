'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./helpers');
const { HomeGames: G } = load(['home-games-core.js'], ['HomeGames']);

const rng = seed => { let s = seed; return n => { s = (s * 1664525 + 1013904223) >>> 0; return Math.floor(s / 4294967296 * n) }; };
const truth = q => ({
  multiply: () => q.calc.a * q.calc.b, subtract: () => (q.calc.n - (q.calc.u ?? q.calc.w)),
  share: () => q.calc.total / q.calc.k, grid: () => q.calc.r * q.calc.c, add: () => q.calc.a + q.calc.b,
}[q.kind]());

test('every generated question is correct, has 4 distinct non-negative options and contains the answer', () => {
  for (const game of ['cook', 'garden']) for (let seed = 1; seed <= 400; seed++) for (let round = 0; round < 6; round++) {
    const q = G[game](round, rng(seed * 7 + round));
    const where = `${game} seed ${seed} round ${round}: ${q.text}`;
    assert.equal(q.answer, String(truth(q)), where);
    assert.equal(q.options.length, 4, where);
    assert.equal(new Set(q.options).size, 4, 'distinct: ' + where);
    assert.ok(q.options.includes(q.answer), where);
    assert.ok(q.options.every(o => /^\d+$/.test(o)), 'non-negative integers: ' + where);
    assert.ok(Number.isInteger(truth(q)) && truth(q) > 0, where);
    assert.ok(q.text && q.hint && q.explanation && q.icons, where);
  }
});

test('questions vary by round: all three kinds appear and later rounds are harder', () => {
  for (const game of ['cook', 'garden']) {
    const kinds = new Set([0, 1, 2].map(r => G[game](r, rng(5)).kind));
    assert.equal(kinds.size, 3, game);
  }
  const max = (round, game) => Math.max(...Array.from({ length: 300 }, (_, i) => +G[game](round, rng(i + 1)).answer));
  assert.ok(max(3, 'cook') > max(0, 'cook'));
  assert.ok(max(4, 'garden') > max(1, 'garden'));
});

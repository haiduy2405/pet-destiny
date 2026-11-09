'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./helpers');
const { Balance: B } = load(['balance-core.js'], ['Balance']);

test('effort ordering: tapping games pay less than reasoning games', () => {
  assert.ok(B.baseOf('patterns') > B.baseOf('math'), 'number patterns pay more than quick maths');
  assert.ok(B.baseOf('patterns') >= 2 * B.baseOf('count'));
  assert.ok(B.baseOf('snacks') < B.baseOf('reading'));
  for (const id of Object.keys(B.base)) assert.ok(B.base[id] >= 8 && B.base[id] <= 32, id);
});
test('repeat plays of one game pay less and less but never zero', () => {
  const s = {}, p = [];
  for (let i = 0; i < 6; i++) { p.push(B.pay(s, 'd', 'math', 0)); B.record(s, 'd', 'math'); }
  for (let i = 1; i < p.length; i++) assert.ok(p[i] <= p[i - 1]);
  assert.equal(p[0], 15); assert.ok(p[5] >= 3 && p[5] < 4);
});
test('a new day resets repeat decay', () => {
  const s = {}; for (let i = 0; i < 4; i++) B.record(s, 'd1', 'math');
  assert.equal(B.pay(s, 'd2', 'math', 0), 15);
});
test('spreading plays across games out-earns grinding one game', () => {
  const total = ids => { const s = {}; let sum = 0; for (const id of ids) { sum += B.pay(s, 'd', id, 3); const r = B.record(s, 'd', id); sum += r.bonus + (B.plays(s, 'd', id) === 1 ? 10 : 0); } return sum; };
  const grind = total(Array(10).fill('patterns')), varied = total(['patterns', 'reading', 'clock', 'math', 'count', 'pairs', 'colors', 'tone', 'english', 'cook']);
  assert.ok(varied > grind, `${varied} vs ${grind}`);
  const grindCheap = total(Array(10).fill('count'));
  assert.ok(varied > 2 * grindCheap);
});
test('grinding the best game 20 times is capped well below playing 10 different games', () => {
  const s = {}; let best = 0; for (let i = 0; i < 20; i++) { best += B.pay(s, 'd', 'patterns', 5); B.record(s, 'd', 'patterns'); }
  assert.ok(best < 200, 'grinding total ' + best);
});
test('variety milestones pay once each', () => {
  const s = {}; let bonus = 0;
  for (const id of ['a', 'b', 'c', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'j']) bonus += B.record(s, 'd', id).bonus;
  assert.equal(bonus, 15 + 30 + 60);
  assert.equal(B.nextMilestone(s, 'd'), null);
});
test('corrupt plays data is repaired', () => {
  const s = { plays: { day: 'd', counts: 'x', bonus: 5 } };
  assert.equal(B.pay(s, 'd', 'math', 0), 15); assert.equal(B.record(s, 'd', 'math').distinct, 1);
});

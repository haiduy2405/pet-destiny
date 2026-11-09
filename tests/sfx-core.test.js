'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./helpers');
const { Sfx: S } = load(['sfx-core.js'], ['Sfx']);

test('note frequencies match the standard scale', () => {
  assert.ok(Math.abs(S.freq('A', 4) - 440) < 1e-9);
  assert.ok(Math.abs(S.freq('C', 4) - 261.6256) < 1e-3);
  assert.ok(Math.abs(S.freq('C', 5) - 2 * S.freq('C', 4)) < 1e-9);
  assert.ok(Math.abs(S.freq('g', 4) - 391.995) < 1e-2);
  assert.throws(() => S.freq('H', 4));
});
test('every recipe is short, quiet and well-formed', () => {
  for (const [name, r] of Object.entries(S.recipes)) {
    assert.ok(Array.isArray(r) && r.length > 0, name);
    assert.ok(S.total(name) <= 1.4, name + ' too long');
    let peak = 0;
    for (const n of r) {
      const f = Array.isArray(n.f) ? n.f : [n.f];
      for (const x of f) assert.ok(x >= 80 && x <= 4200, name + ' freq ' + x);
      assert.ok(n.g > 0 && n.g <= 0.17, name + ' gain ' + n.g); assert.ok(n.d > 0 && n.t >= 0);
    }
    assert.ok(r.length <= S.MAX_VOICES, name + ' too many voices');
  }
  assert.equal(S.recipes.reward, S.recipes.win);
});
test('everyday sounds are quieter than the win fanfare', () => {
  const peak = n => Math.max(...S.recipes[n].map(x => x.g));
  assert.ok(peak('tap') < peak('good')); assert.ok(peak('tap') <= 0.05);
  assert.ok(peak('bad') <= peak('good'));
});
test('rate limiter blocks bursts of the same sound but not different ones', () => {
  const last = {};
  assert.equal(S.shouldPlay('tap', 1000, last), true);
  assert.equal(S.shouldPlay('tap', 1020, last), false);
  assert.equal(S.shouldPlay('tap', 1060, last), true);
  assert.equal(S.shouldPlay('good', 1061, last), true);
  assert.equal(S.shouldPlay('win', 2000, last), true);
  assert.equal(S.shouldPlay('reward', 2300, last), false, 'reward is the same group as win');
  assert.equal(S.shouldPlay('win', 3000, last), true);
});
test('feedback text is classified for sound', () => {
  assert.equal(S.classify('Đúng rồi! 3 + 4 = 7'), 'good');
  assert.equal(S.classify('Chưa đúng. Thử lại nhé'), 'bad');
  assert.equal(S.classify('Chưa đúng, quan sát thêm một chút nhé.'), 'bad');
  assert.equal(S.classify('Đó là chiếc lá. Tìm trái cây nhé!'), 'bad');
  assert.equal(S.classify('Hãy tìm số 3 trước nhé.'), 'bad');
  assert.equal(S.classify('Chọn tên của nốt trên khuông.'), null);
  assert.equal(S.classify('3/5 biểu tượng đúng'), null);
  assert.equal(S.classify(''), null); assert.equal(S.classify(undefined), null);
});

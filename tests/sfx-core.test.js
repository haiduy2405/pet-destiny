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

const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
test('every sampled cue and piano sample exists on disk, and each cue has a synth fallback', () => {
  for (const [name, [cue, gain]] of Object.entries(S.samples)) {
    assert.ok(fs.existsSync(path.join(root, S.uiFile(cue))), name + ' -> ' + cue);
    assert.ok(gain > 0 && gain <= 0.8, name + ' gain'); assert.ok(S.recipes[name], name + ' fallback recipe');
  }
  for (const [, n] of S.pianoMidi) assert.ok(fs.existsSync(path.join(root, S.pianoFile(n))), n);
  assert.ok(fs.existsSync(path.join(root, 'audio/CREDITS.md')), 'credits file');
});
test('piano: nearest sample and pitch shift stay within 1.5 semitones across the staff range (timbre stays natural)', () => {
  assert.equal(S.nearestPiano(S.freq('C', 4)).name, 'C4'); assert.ok(Math.abs(S.nearestPiano(S.freq('C', 4)).rate - 1) < 1e-9);
  const d = S.nearestPiano(S.freq('D', 4)); assert.equal(d.name, 'Ds4'); assert.ok(Math.abs(d.rate - 2 ** (-1 / 12)) < 1e-6);
  for (let m = 36; m <= 84; m++) assert.ok(Math.abs(S.nearestPiano(S.midi(m)).shift) <= 1.5001, 'midi ' + m);
  assert.equal(S.pianoMidi.length, 17); for (let i = 1; i < S.pianoMidi.length - 1; i++) assert.equal(S.pianoMidi[i][0] - S.pianoMidi[i - 1][0], 3);
});


test('director: one main idea at a time — piano silences UI, fanfare silences weaker sounds, results chain instead of stacking', () => {
  const t = (name, at, st, deferred) => S.decide(name, at, st, deferred).act;
  let st = S.newDirector();
  S.holdPiano(st, 1000, 900);
  assert.equal(t('tap', 1100, st), 'drop', 'tiếng nút bị bỏ khi piano đang ngân');
  assert.equal(t('nav', 1200, st), 'drop');
  const d = S.decide('good', 1200, st); assert.equal(d.act, 'defer'); assert.ok(d.ms >= 740 && d.ms <= 760, 'chuông đúng dời tới sau nốt: ' + d.ms);
  assert.equal(t('win', 1300, st), 'defer');
  assert.equal(t('good', 1950, st, true), 'play', 'sau khi nốt dứt thì phát bình thường');
  assert.equal(t('coin', 1950, st, true), 'defer', 'hai chuông bị dời cùng lúc vẫn nối đuôi nhau, không chồng');
  assert.equal(t('coin', 2180, st, true), 'play');
  assert.equal(S.decide('tap', 2000, S.newDirector()).act, 'play');
  st = S.newDirector();
  assert.equal(t('win', 5000, st), 'play');
  assert.equal(t('coin', 5100, st), 'drop', 'xu không chồng lên fanfare');
  assert.equal(t('good', 5400, st), 'drop'); assert.equal(t('tap', 5500, st), 'drop');
  assert.equal(t('tap', 5800, st), 'play', 'hết thời gian giữ thì tiếng nhẹ trở lại');
  st = S.newDirector();
  assert.equal(t('good', 100, st), 'play');
  assert.equal(S.decide('coin', 160, st).act, 'defer', 'hai tiếng kết quả sát nhau thì nối đuôi');
  assert.equal(t('tap', 120, st), 'drop', 'tiếng nút ngay sau tiếng kết quả bị bỏ');
  assert.equal(t('coin', 400, st), 'play');
  assert.equal(t('win', 410, st), 'play', 'tiếng nặng hơn luôn được phát');
});
test('notices: celebrate only real good news, spend/coin/neutral get the right small sound', () => {
  assert.equal(S.noticeKind('Chưa đủ xu cho món này.'), 'info');
  assert.equal(S.noticeKind('Đã lưu'), 'info');
  assert.equal(S.noticeKind('Nhiệm vụ xong · +20 xu'), 'coin');
  assert.equal(S.noticeKind('Hoàn thành ngày · chuỗi 3 · +38 xu'), 'win');
  assert.equal(S.noticeKind('Một bạn nhỏ đã nở!'), 'win');
  assert.equal(S.noticeKind('Đã mua Bồn hoa · −40 xu'), 'spend');
  assert.equal(S.noticeKind(''), null); assert.equal(S.noticeKind(undefined), null);
});
test('volume levels: off then rising, haptics are short, every cue has a priority', () => {
  assert.equal(S.LEVELS[0].v, 0); for (let i = 1; i < S.LEVELS.length; i++) assert.ok(S.LEVELS[i].v > S.LEVELS[i - 1].v);
  assert.equal(S.LEVELS.length, 4);
  for (const v of Object.values(S.HAPTIC)) assert.ok([].concat(v).reduce((a, b) => a + b, 0) <= 300);
  for (const n of Object.keys(S.recipes)) assert.ok(S.PRI[n] >= 1 && S.PRI[n] <= 4, n + ' thiếu độ ưu tiên');
});

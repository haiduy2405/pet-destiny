'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { load, legacyState } = require('./helpers');

const { MusicCore, Visuals } = load(['music-core.js', 'visual-core.js'], ['MusicCore', 'Visuals']);

test('staff positions map to the right pitches (E4, G2, A4 = 440 Hz)', () => {
  const e4 = MusicCore.note('treble', 0);
  assert.deepEqual([e4.letter, e4.name, e4.octave, e4.midi], ['E', 'Mi', 4, 64]);
  const g2 = MusicCore.note('bass', 0);
  assert.deepEqual([g2.letter, g2.octave, g2.midi], ['G', 2, 43]);
  const a4 = MusicCore.note('treble', 3);
  assert.equal(a4.letter, 'A');
  assert.equal(a4.midi, 69);
  assert.ok(Math.abs(a4.frequency - 440) < 1e-9);
  assert.equal(MusicCore.note('treble', 7).letter, 'E', 'an octave up is the same letter');
  assert.equal(MusicCore.note('treble', 7).octave, 5);
  assert.equal(MusicCore.note('treble', 0).key, 'treble:0');
});

test('negative (ledger-line) steps still resolve to real notes', () => {
  const c4 = MusicCore.note('treble', -2);
  assert.deepEqual([c4.letter, c4.octave, c4.midi], ['C', 4, 60]);
  assert.ok(Math.abs(c4.frequency - 261.6255653) < 1e-6);
});

test('note() rejects unknown clefs and non-integer steps', () => {
  assert.throws(() => MusicCore.note('alto', 0), /Invalid staff position/);
  assert.throws(() => MusicCore.note('treble', 1.5), /Invalid staff position/);
  assert.throws(() => MusicCore.note('treble', '2'), /Invalid staff position/);
});

test('record(): a correct answer climbs the box (max 5); a miss drops it to 0', () => {
  const s = legacyState(), m = MusicCore.normalize(s), n = MusicCore.note('treble', 2);
  for (let i = 0; i < 8; i++) MusicCore.record(m, n, true);
  assert.deepEqual(m.notes[n.key], { attempts: 8, correct: 8, misses: 0, box: 5 });
  MusicCore.record(m, n, false);
  assert.deepEqual(m.notes[n.key], { attempts: 9, correct: 8, misses: 1, box: 0 });
});

test('summary() reports accuracy, mastery and per-clef progress', () => {
  const m = MusicCore.normalize(legacyState());
  const t = MusicCore.note('treble', 1), b = MusicCore.note('bass', 1);
  for (let i = 0; i < 3; i++) MusicCore.record(m, t, true);
  MusicCore.record(m, b, true);
  MusicCore.record(m, b, false);
  assert.deepEqual(MusicCore.summary(m), { first: 4, attempts: 5, accuracy: 80, mastered: 1, treble: 3, bass: 1 });
  assert.equal(MusicCore.summary(MusicCore.normalize(legacyState())).accuracy, 0, 'no attempts is 0%, not NaN');
});

test('pick(): stays in range, honours avoid, and favours notes the learner misses', () => {
  const m = MusicCore.normalize(legacyState());
  const step = n => Number(n.key.split(':')[1]);
  assert.equal(step(MusicCore.pick(m, 'treble', false, () => 0)), 0);
  assert.equal(step(MusicCore.pick(m, 'treble', false, () => 0.999999)), 8);
  assert.equal(step(MusicCore.pick(m, 'treble', true, () => 0)), -2);
  assert.equal(step(MusicCore.pick(m, 'treble', true, () => 0.999999)), 10);
  for (let i = 0; i < 200; i++) {
    assert.notEqual(MusicCore.pick(m, 'bass', false, Math.random, 'bass:4').key, 'bass:4');
  }

  const weak = MusicCore.note('treble', 4);
  for (let i = 0; i < 3; i++) MusicCore.record(m, weak, false);   // 3 misses -> heavier weight
  let hits = 0, N = 2000;
  for (let i = 0; i < N; i++) if (MusicCore.pick(m, 'treble', false, () => i / N).key === weak.key) hits++;
  assert.ok(hits / N > 1 / 9 * 1.5, 'a missed note comes up clearly more often than 1-in-9: ' + hits / N);
});

test('staff() draws one head per note and a ledger line only when needed', () => {
  const count = (svg, re) => (svg.match(re) || []).length;
  const inside = MusicCore.staff('treble', [4], 0, false);
  const below = MusicCore.staff('treble', [-2], 0, false);
  const high = MusicCore.staff('treble', [12], 0, false);
  assert.equal(count(inside, /<ellipse/g), 1);
  assert.equal(count(MusicCore.staff('bass', [1, 2, 3], 1, false), /<ellipse/g), 3);
  assert.equal(count(below, /<line/g) - count(inside, /<line/g), 1, 'one ledger line for C4');
  assert.equal(count(high, /<line/g) - count(inside, /<line/g), 2, 'two ledger lines for step 12');
  assert.ok(!/note-label/.test(inside), 'names hidden until revealed');
  assert.ok(/note-label/.test(MusicCore.staff('treble', [4], 0, true)));
  assert.ok(/active-note/.test(MusicCore.staff('treble', [1, 2], 1, false)));
});

test('Visuals.round(): 9 choices with exactly one correct shape, all valid', () => {
  for (let target = 0; target < Visuals.shapes.length; target++) {
    for (const r of [0, 0.5, 0.999]) {
      const choices = Visuals.round(target, () => r);
      assert.equal(choices.length, 9);
      assert.equal(choices.filter(c => c.shape === target).length, 1, 'shape ' + target);
      assert.ok(choices.every(c => Number.isInteger(c.shape) && c.shape >= 0 && c.shape < 8));
      assert.ok(choices.every(c => Number.isInteger(c.color) && c.color >= 0 && c.color < 12));
    }
  }
});

test('Visuals.palette(): three channel ramps from a hex colour', () => {
  assert.deepEqual(Visuals.palette('#ffffff'), Array(3).fill('0.0000 0.0900 0.3000 0.6500 1.0000 1.0000'));
  const [r, g, b] = Visuals.palette('#ff0000');
  assert.equal(r.split(' ').length, 6);
  assert.equal(g, '0.0000 0.0000 0.0000 0.0000 0.0000 0.2800');
  assert.equal(b, g);
  assert.equal(Visuals.shapes.length, 8);
  assert.equal(new Set(Visuals.shapes.map(s => s[0])).size, 8);
});

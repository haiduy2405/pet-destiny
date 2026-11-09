'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./helpers');

const { Atelier } = load(['atelier-core.js'], ['Atelier']);
const home = (extra = {}) => ({ owned: [], equipped: {}, decor: [], ...extra });
const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, a + ' vs ' + b);

test('cleanName strips control characters, trims, and caps at 24 characters (not UTF-16 units)', () => {
  assert.equal(Atelier.cleanName('  Bông \u0000\u0007xinh  '), 'Bông xinh');
  assert.equal(Atelier.cleanName('🐱'.repeat(30)), '🐱'.repeat(24));
  assert.equal(Array.from(Atelier.cleanName('a'.repeat(40))).length, 24);
  for (const v of [undefined, null, '', 0]) assert.equal(Atelier.cleanName(v), '');
  assert.equal(Atelier.cleanName('0'), '0', 'a typed zero is a legitimate name');
});

test('escape neutralises every HTML-significant character', () => {
  assert.equal(Atelier.escape(`<img src=x onerror="a('b')">&`),
    '&lt;img src=x onerror=&quot;a(&#39;b&#39;)&quot;&gt;&amp;');
  assert.equal(Atelier.escape(42), '42');
});

test('normalize clamps every field and keeps text for signs only', () => {
  const o = Atelier.normalize({ id: 'ball', x: -50, y: 9999, scale: 9, rotation: 400, z: -3, text: 'ignored' });
  assert.deepEqual(o, { id: 'ball', x: 8, y: 90, scale: 1.6, rotation: 45, flip: false, z: 0 });
  const sign = Atelier.normalize({ id: 'woodsign', x: 50, y: 0, text: ' Chào \u0001bạn ' });
  assert.equal(sign.y, 10, 'signs may sit higher than other objects');
  assert.equal(sign.text, 'Chào bạn');
  assert.equal(Atelier.normalize({ id: 'ball', x: NaN, y: 'x' }).x, 8, 'garbage coordinates fall back inside bounds');
  assert.equal(Atelier.normalize({ id: 'ball', y: 'x' }).y, 35);
});

test('objects() seeds the room from equipped items and decor, once and without duplicates', () => {
  const h = home({ equipped: { house: 'cabin', toy: 'ball' }, decor: ['flowers', 'ball'] });
  const list = Atelier.objects(h);
  assert.deepEqual(list.map(o => o.id), ['cabin', 'ball', 'flowers']);
  assert.equal(Atelier.objects(h), list, 'cached on the home');
});

test('put() adds only owned, not-yet-placed items', () => {
  const h = home({ owned: ['ball', 'teddy'] });
  assert.equal(Atelier.put(h, 'ball'), true);
  assert.equal(Atelier.put(h, 'ball'), false, 'already in the room');
  assert.equal(Atelier.put(h, 'castle'), false, 'not owned');
  assert.deepEqual(h.roomObjects.map(o => o.id), ['ball']);
});

test('commit() drops unowned and duplicate drafts and clamps what remains', () => {
  const h = home({ owned: ['ball', 'teddy'] });
  Atelier.commit(h, [
    { id: 'ball', x: 500, y: 50 }, { id: 'ball', x: 20, y: 50 }, { id: 'castle', x: 20, y: 50 }, { id: 'teddy', x: 40, y: 40 },
  ]);
  assert.deepEqual(h.roomObjects.map(o => o.id), ['ball', 'teddy']);
  assert.equal(h.roomObjects[0].x, 92, 'first occurrence wins and is clamped');
});

test('wearPose clamps pet accessories and defaults sensibly', () => {
  assert.deepEqual(Atelier.wearPose('hat'), { id: 'hat', x: 0, y: 0, scale: 1, rotation: 0 });
  assert.deepEqual(Atelier.wearPose('hat', { x: 999, y: -999, scale: 10, rotation: 999 }),
    { id: 'hat', x: 110, y: -130, scale: 2.2, rotation: 180 });
  assert.equal(Atelier.wearPose('hat', { scale: 0.01 }).scale, 0.35);
});

test('gesture(): one finger has no distance; two fingers give midpoint, distance and angle', () => {
  assert.deepEqual(Atelier.gesture([{ x: 5, y: 7 }]), { x: 5, y: 7, distance: 0, angle: 0 });
  const g = Atelier.gesture([{ x: 0, y: 0 }, { x: 6, y: 8 }]);
  assert.deepEqual([g.x, g.y, g.distance], [3, 4, 10]);
  near(g.angle, Math.atan2(8, 6));
});

test('transform(): one finger pans, two fingers pinch and twist', () => {
  const pose = { x: 10, y: 20, scale: 1, rotation: 0 };
  const pan = Atelier.transform(pose, Atelier.gesture([{ x: 0, y: 0 }]), Atelier.gesture([{ x: 5, y: -3 }]), 2, 1);
  assert.deepEqual([pan.x, pan.y, pan.scale, pan.rotation], [20, 17, 1, 0]);

  const a = Atelier.gesture([{ x: 0, y: 0 }, { x: 10, y: 0 }]);
  const b = Atelier.gesture([{ x: 0, y: 0 }, { x: 0, y: 20 }]);   // twice as far, turned +90 degrees
  const t = Atelier.transform(pose, a, b);
  near(t.scale, 2);
  near(t.rotation, 90);
});

test('transform(): rotation takes the short way round the +/-180 seam, and tiny pinches are ignored', () => {
  const rad = d => d * Math.PI / 180;
  const at = d => Atelier.gesture([{ x: 0, y: 0 }, { x: 10 * Math.cos(rad(d)), y: 10 * Math.sin(rad(d)) }]);
  const t = Atelier.transform({ x: 0, y: 0, scale: 1, rotation: 0 }, at(170), at(-170));
  near(t.rotation, 20, 1e-6);

  const tiny = Atelier.transform({ x: 0, y: 0, scale: 1, rotation: 7 },
    Atelier.gesture([{ x: 0, y: 0 }, { x: 1, y: 0 }]), Atelier.gesture([{ x: 0, y: 0 }, { x: 0, y: 3 }]));
  assert.equal(tiny.scale, 1);
  assert.equal(tiny.rotation, 7);
});

'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./helpers');

const { ShapeCamera } = load(['shape-camera-core.js'], ['ShapeCamera']);

/** Synthetic photo: light background, dark shape(s) drawn by a predicate. */
function image(w, h, inside, { dark = 20, light = 235 } = {}) {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const v = inside(x, y) ? dark : light, i = (y * w + x) * 4;
    data[i] = data[i + 1] = data[i + 2] = v; data[i + 3] = 255;
  }
  return { width: w, height: h, data };
}
const rect = (x0, y0, x1, y1) => (x, y) => x >= x0 && x < x1 && y >= y0 && y < y1;
const disc = (cx, cy, r) => (x, y) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
const tri = (x, y) => y >= 20 && y <= 100 && Math.abs(x - 60) <= (y - 20) * 0.75;

test('recognises a clean square, rectangle, circle and triangle', () => {
  assert.equal(ShapeCamera.analyze(image(120, 120, rect(30, 30, 90, 90))).shape, 'square');
  assert.equal(ShapeCamera.analyze(image(120, 120, rect(15, 35, 105, 85))).shape, 'rectangle');
  assert.equal(ShapeCamera.analyze(image(120, 120, disc(60, 60, 35))).shape, 'circle');
  assert.equal(ShapeCamera.analyze(image(120, 120, tri)).shape, 'triangle');
});

test('works for a light object on a dark background too', () => {
  const r = ShapeCamera.analyze(image(120, 120, rect(30, 30, 90, 90), { dark: 235, light: 20 }));
  assert.equal(r.ok, true);
  assert.equal(r.shape, 'square');
});

test('reports a confidence between 0 and 1 and the measured geometry', () => {
  const r = ShapeCamera.analyze(image(120, 120, rect(30, 30, 90, 90)));
  assert.ok(r.score > 0.5 && r.score <= 0.98, String(r.score));
  assert.ok(r.area > 0);
  assert.equal(r.vertices, 4);
});

test('refuses a flat, contrast-free photo with a helpful reason', () => {
  const r = ShapeCamera.analyze(image(80, 80, () => false));
  assert.equal(r.ok, false);
  assert.match(r.reason, /tương phản/);
});

test('refuses shapes it cannot judge conservatively: too small, too big, or cut by the frame', () => {
  const small = ShapeCamera.analyze(image(120, 120, rect(55, 55, 65, 65)));
  assert.equal(small.ok, false, 'tiny speck');
  const huge = ShapeCamera.analyze(image(120, 120, rect(2, 2, 118, 118)));
  assert.equal(huge.ok, false, 'fills the frame');
  const cropped = ShapeCamera.analyze(image(120, 120, rect(0, 20, 70, 100)));
  assert.equal(cropped.ok, false, 'touches the border');
});

test('does not call an irregular blob a shape', () => {
  // A plus sign is solid but is neither a square, circle nor triangle.
  const plus = (x, y) => (x >= 50 && x < 70 && y >= 20 && y < 100) || (y >= 50 && y < 70 && x >= 20 && x < 100);
  assert.equal(ShapeCamera.analyze(image(120, 120, plus)).ok, false);
});

test('when two shapes are present the larger one is reported', () => {
  const both = (x, y) => rect(10, 10, 40, 40)(x, y) || disc(85, 85, 30)(x, y);
  const r = ShapeCamera.analyze(image(120, 120, both));
  assert.equal(r.ok, true);
  assert.equal(r.shape, 'circle');
});

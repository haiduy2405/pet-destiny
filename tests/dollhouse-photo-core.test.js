'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./helpers');

const { DollHouse: D, DollPhotoCore: P } = load(['dollhouse-core.js', 'dollhouse-photo-core.js'], ['DollHouse', 'DollPhotoCore']);

test('every wall and floor style has a canvas painter spec', () => {
  for (const w of D.walls) assert.ok(P.walls[w.id], 'wall ' + w.id);
  for (const f of D.floors) assert.ok(P.floors[f.id], 'floor ' + f.id);
  assert.deepEqual(Object.keys(P.walls).sort(), D.walls.map(w => w.id).sort(), 'no stale wall specs');
  assert.deepEqual(Object.keys(P.floors).sort(), D.floors.map(f => f.id).sort(), 'no stale floor specs');
});

test('painter specs are well-formed', () => {
  const kinds = { solid: ['c'], stripes: ['dir', 'a', 'b', 'pa', 'pb'], dots: ['bg', 'c', 'step', 'r'], checker: ['a', 'b', 'size'], grad: ['angle', 'stops'] };
  for (const spec of [...Object.values(P.walls), ...Object.values(P.floors)]) {
    assert.ok(kinds[spec.k], 'unknown kind ' + spec.k);
    for (const key of kinds[spec.k]) assert.ok(spec[key] !== undefined, spec.k + ' needs ' + key);
  }
  assert.equal(P.wallSpec('nope'), P.walls.cream);
  assert.equal(P.floorSpec('nope'), P.floors.wood);
});

test('photo is 4:3 and sizes are clamped', () => {
  assert.equal(P.W / P.H, 4 / 3);
  assert.equal(P.objSize(1), 135);
  assert.equal(P.objSize(99), P.objSize(3));
  assert.equal(P.objSize('x'), P.objSize(1));
});

test('petBox stays inside the photo for every spot the pet can reach', () => {
  for (const pos of [null, { x: 13, y: 36 }, { x: 87, y: 98 }, { x: 50, y: 70 }]) {
    const b = P.petBox(pos, 1);
    assert.ok(b.x >= 0 && b.y >= 0 && b.x + b.w <= P.W && b.y + b.h <= P.H, JSON.stringify(pos) + ' ' + JSON.stringify(b));
  }
  assert.equal(P.petBox(null, 9).g, 1.15);
  assert.equal(P.petBox(null, 'x').g, 1);
});

test('sprite cells cover the 4x3 sheet and file names are safe', () => {
  assert.deepEqual(P.sheetCell(0), { sx: 0, sy: 0, sw: 300, sh: 300 });
  assert.deepEqual(P.sheetCell(11), { sx: 900, sy: 600, sw: 300, sh: 300 });
  assert.equal(P.fileName('living', '2026-11-09'), 'pet-destiny-living-2026-11-09.png');
  assert.equal(P.fileName('../x y', '2026/11'), 'pet-destiny-xy-202611.png');
});

test('drawOrder paints back to front without mutating the room', () => {
  const objs = [{ u: 2, y: 80 }, { u: 1, y: 40 }, { u: 3, y: 80 }];
  assert.deepEqual(P.drawOrder(objs).map(o => o.u), [1, 2, 3]);
  assert.deepEqual(objs.map(o => o.u), [2, 1, 3]);
});

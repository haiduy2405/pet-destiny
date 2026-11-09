'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { load, memoryStorage, legacyState, clone } = require('./helpers');

const KEY = 'pet-destiny-slots-v1', LEGACY = 'pet-destiny-v1';
const store = storage => load(['save-store.js'], ['SaveStore'], { storage }).SaveStore;

test('empty storage yields four empty slots and persists them', () => {
  const storage = memoryStorage();
  const data = store(storage).load();
  assert.equal(data.version, 1);
  assert.deepEqual(data.slots, [null, null, null, null]);
  assert.deepEqual(JSON.parse(storage.getItem(KEY)), data);
});

test('legacy single save migrates into slot 0 and the legacy key is kept as backup', () => {
  const old = legacyState({ coins: 42 });
  const storage = memoryStorage({ [LEGACY]: JSON.stringify(old) });
  const data = store(storage).load();
  assert.equal(data.slots[0].state.coins, 42);
  assert.deepEqual(data.slots.slice(1), [null, null, null]);
  assert.equal(storage.getItem(LEGACY), JSON.stringify(old));
});

test('an invalid legacy save throws instead of being silently dropped', () => {
  const storage = memoryStorage({ [LEGACY]: JSON.stringify({ coins: 'lots' }) });
  assert.throws(() => store(storage).load(), /Invalid legacy save/);
});

test('corrupt slot data throws and is never overwritten', () => {
  const bad = [
    'not json',
    JSON.stringify({ version: 2, slots: [null, null, null, null] }),
    JSON.stringify({ version: 1, slots: [null, null, null] }),
    JSON.stringify({ version: 1, slots: [{ state: { coins: NaN, eggs: [], pets: [], collection: [] } }, null, null, null] }),
    JSON.stringify({ version: 1, slots: [{ state: { coins: 1, eggs: {}, pets: [], collection: [] } }, null, null, null] }),
  ];
  for (const raw of bad) {
    const storage = memoryStorage({ [KEY]: raw });
    assert.throws(() => store(storage).load(), undefined, raw);
    assert.equal(storage.getItem(KEY), raw, 'corrupt data must be left untouched');
  }
});

test('write/load round-trips and copy() is a deep clone', () => {
  const storage = memoryStorage();
  const s = store(storage);
  const data = s.load();
  data.slots[2] = { state: legacyState({ coins: 7, pets: [{ id: 'a' }] }), createdAt: 1, updatedAt: 2 };
  s.write(data);
  assert.deepEqual(store(storage).load(), data);

  const copy = s.copy(data);
  copy.slots[2].state.pets[0].id = 'changed';
  assert.equal(data.slots[2].state.pets[0].id, 'a');
  assert.deepEqual(clone(data), data);
});

const sample = () => ({ version: 1, slots: [
  { state: legacyState({ coins: 11, saveName: 'Bông' }), createdAt: 1, updatedAt: 2 },
  null,
  { state: legacyState({ coins: 33, saveName: 'Mít' }), createdAt: 3, updatedAt: 4 },
  null,
] });

test('exportData -> parseBackup round-trips all slots, or only the picked ones', () => {
  const s = store(memoryStorage());
  const all = s.parseBackup(s.exportData(sample()));
  assert.deepEqual(all.slots, sample().slots);
  const only = s.parseBackup(s.exportData(sample(), [2]));
  assert.equal(only.slots[0], null);
  assert.equal(only.slots[2].state.coins, 33);
  assert.throws(() => s.exportData({ version: 1, slots: [null, null, null, null] }), /Nothing to export/);
  assert.throws(() => s.exportData(sample(), [1]), /Nothing to export/);
});

test('parseBackup also accepts the raw slot store, and rejects anything else', () => {
  const s = store(memoryStorage());
  assert.equal(s.parseBackup(JSON.stringify(sample())).slots[0].state.coins, 11);
  const bad = [
    'not json', '[]', 'null', '{}',
    JSON.stringify({ app: 'other', format: 1, slots: sample().slots }),
    JSON.stringify({ app: 'pet-destiny', format: 2, slots: sample().slots }),
    JSON.stringify({ app: 'pet-destiny', format: 1, slots: [null, null, null] }),
    JSON.stringify({ app: 'pet-destiny', format: 1, slots: [null, null, null, null] }),
    JSON.stringify({ app: 'pet-destiny', format: 1, slots: [{ state: { coins: 'x' } }, null, null, null] }),
  ];
  for (const text of bad) assert.throws(() => s.parseBackup(text), undefined, text);
  assert.throws(() => s.parseBackup('x'.repeat(9e6)), /Invalid backup file/);
  assert.throws(() => s.parseBackup(undefined), /Invalid backup file/);
});

test('parseBackup fills missing timestamps instead of failing', () => {
  const s = store(memoryStorage());
  const text = JSON.stringify({ app: 'pet-destiny', format: 1, slots: [{ state: legacyState() }, null, null, null] });
  const slot = s.parseBackup(text).slots[0];
  assert.ok(slot.createdAt > 0 && slot.updatedAt > 0);
});

test('importInto writes the chosen slots, reports overwrites and never mutates its inputs', () => {
  const s = store(memoryStorage());
  const current = sample(), before = clone(current);
  const incoming = s.parseBackup(s.exportData(sample()));
  incoming.slots[0].state.coins = 999;
  const res = s.importInto(current, incoming, [[0, 1], [2, 0]]);
  assert.deepEqual(current, before);
  assert.equal(res.data.slots[1].state.coins, 999);
  assert.equal(res.data.slots[0].state.coins, 33);
  assert.equal(res.data.slots[2].state.coins, 33);
  assert.deepEqual(res.overwritten, [0]);
  res.data.slots[1].state.coins = 1;
  assert.equal(incoming.slots[0].state.coins, 999, 'imported slot is a deep copy');
});

test('importInto rejects bad moves', () => {
  const s = store(memoryStorage());
  const incoming = s.parseBackup(s.exportData(sample()));
  for (const moves of [[], undefined, [[0, 4]], [[-1, 0]], [[1, 0]], [[0, 1], [2, 1]], [[0.5, 1]], ['x']])
    assert.throws(() => s.importInto(sample(), incoming, moves), undefined, JSON.stringify(moves));
});

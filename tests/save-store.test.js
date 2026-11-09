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

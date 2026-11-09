'use strict';
// The *-core.js files are plain browser scripts (`const X=(()=>{...})()`), so evaluate them
// together inside one function body (same realm as the tests, so deepStrictEqual works)
// and return the requested globals.
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: k => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => void data.set(k, String(v)),
    removeItem: k => void data.delete(k),
    clear: () => data.clear(),
    get length() { return data.size; },
  };
}

/** load(['home-core.js', 'adventure-core.js'], ['PetHomes', 'Adventure']) -> {PetHomes, Adventure} */
function load(files, names, { storage } = {}) {
  const source = ['economy-data.js', ...files].map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n;\n');
  const factory = new Function('localStorage', source + '\n;return {' + names.join(',') + '};');
  return factory(storage || memoryStorage());
}

const HOUR = 3600000, MIN = 60000;

function pet(id, extra = {}) {
  return { id, species: 0, color: 0, food: 50, clean: 50, joy: 50, energy: 50, xp: 0, ...extra };
}

/** Plain state in the legacy (pre-homes) shape the game still migrates from. */
function legacyState(extra = {}) {
  return { coins: 0, eggs: [], pets: [], collection: [], firstHatch: true, ...extra };
}

/** Deterministic random(): cycles through the given values. */
function seq(...values) {
  let i = 0;
  return () => values[i++ % values.length];
}

const clone = x => JSON.parse(JSON.stringify(x));

module.exports = { load, memoryStorage, HOUR, MIN, pet, legacyState, seq, clone };

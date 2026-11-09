'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { load, pet, legacyState } = require('./helpers');

const { Adventure } = load(['home-core.js', 'adventure-core.js'], ['Adventure']);
const D = '2026-01-01';

/** A legacy-shaped (pre-homes) state with one grown-up pet standing in a pen. */
function grown(extra = {}) {
  const s = legacyState({ pets: [pet('p', { xp: 100, food: 100, clean: 100, joy: 100, energy: 100 })], pens: ['p'], ...extra });
  Adventure.normalize(s);
  return s;
}
const times = (s, type, n) => { for (let i = 0; i < n; i++) Adventure.event(s, type, D); };

test('legacy normalize: dedupes pens, drops strangers, offers one free slot, clamps pet fields', () => {
  const s = legacyState({ pets: [pet('a', { xp: 250 }), pet('b', { xp: -3 })], pens: ['a', 'ghost', 'a', null], gardenLevel: -2 });
  Adventure.normalize(s);
  assert.deepEqual(s.pens, ['a', null]);
  assert.equal(s.gardenLevel, 0);
  assert.equal(s.pets[0].xp, 100);
  assert.equal(s.pets[1].xp, 0);
  assert.equal(s.pets[0].evolution, 0);
  assert.equal(Adventure.capacity(s), 4);
  s.gardenLevel = 2;
  assert.equal(Adventure.capacity(s), 12);
});

test('daily counters reset on a new date and events feed both lifetime and daily stats', () => {
  const s = grown();
  Adventure.event(s, 'care', D);
  Adventure.event(s, 'care', D);
  assert.equal(s.stats.care, 2);
  assert.equal(Adventure.daily(s, D).counts.care, 2);
  Adventure.event(s, 'care', '2026-01-02');
  assert.equal(s.stats.care, 3);
  assert.equal(Adventure.daily(s, '2026-01-02').counts.care, 1);
  assert.deepEqual(Adventure.daily(s, '2026-01-02').claimed, []);
});

test('evolution can only start for a fully grown, unevolved pet, and only once', () => {
  const s = grown();
  s.pets.push(pet('young', { xp: 99 }));
  Adventure.normalize(s);
  assert.equal(Adventure.startEvolution(s, 'young'), false);
  assert.equal(Adventure.startEvolution(s, 'ghost'), false);
  assert.equal(Adventure.startEvolution(s, 'p'), true);
  assert.equal(Adventure.startEvolution(s, 'p'), false, 'already started');
  s.pets[0].evolution = 1;
  s.pets[0].evoStart = undefined;
  assert.equal(Adventure.startEvolution(s, 'p'), false, 'already evolved');
});

test('only activity AFTER the quest started counts towards evolution', () => {
  const s = grown();
  times(s, 'care', 5);
  times(s, 'color', 5);
  Adventure.startEvolution(s, 'p');
  const steps = Adventure.evolution(s, s.pets[0]);
  assert.equal(steps.length, 5);
  assert.ok(steps.every(([, n]) => n === 0), 'old progress is not carried over');
  times(s, 'care', 1);
  assert.equal(Adventure.evolution(s, s.pets[0])[1][1], 1);
});

test('evolve succeeds only when every requirement is met, then crowns the pet once', () => {
  const s = grown();
  Adventure.startEvolution(s, 'p');
  assert.equal(Adventure.evolve(s, 'p', D), false);

  times(s, 'color', 1); times(s, 'camera_shape', 1);       // 2 camera wins (either kind)
  times(s, 'care', 2); times(s, 'care_food', 1); times(s, 'care_clean', 1);  // 2 cares, 2 kinds
  times(s, 'mini', 1);
  assert.equal(Adventure.evolve(s, 'p', D), false, 'still missing the two-different-games step');
  times(s, 'mini_memory', 1); times(s, 'mini_count', 1);
  assert.equal(Adventure.evolve(s, 'p', D), false, 'two cares is one short of the three required');
  assert.equal(Adventure.evolution(s, s.pets[0])[1][2], 3);
  times(s, 'care', 1);

  const steps = Adventure.evolution(s, s.pets[0]);
  for (const [name, n, target] of steps) assert.ok(n >= target, name);
  assert.equal(Adventure.evolve(s, 'p', D), true);
  assert.equal(s.pets[0].evolution, 1);
  assert.equal(s.stats.evolve, 1);
  assert.equal(Adventure.evolve(s, 'p', D), false, 'cannot evolve twice');
});

test('"play two different games" can also be met by the legacy positive-event counter', () => {
  const s = grown();
  Adventure.startEvolution(s, 'p');
  times(s, 'positive', 1);
  assert.equal(Adventure.evolution(s, s.pets[0])[4][1], 2);
});

test('gentle-care options only appear for full stats and respect the variety rule', () => {
  const s = grown();
  const p = s.pets[0];
  assert.deepEqual(Adventure.evolutionCareOptions(s, p), [], 'quest not started');
  Adventure.startEvolution(s, 'p');
  assert.deepEqual(Adventure.evolutionCareOptions(s, p).sort(), ['clean', 'energy', 'food', 'joy']);
  p.joy = 50;
  assert.ok(!Adventure.evolutionCareOptions(s, p).includes('joy'), 'stat below 95 is not offered');

  times(s, 'care', 3); times(s, 'care_food', 3);            // care count met, one kind used
  assert.ok(!Adventure.evolutionCareOptions(s, p).includes('food'), 'food already used and care count is met');
  assert.ok(Adventure.evolutionCareOptions(s, p).includes('clean'), 'a second kind is still wanted');
  times(s, 'care_clean', 1);
  assert.deepEqual(Adventure.evolutionCareOptions(s, p), [], 'quota and variety both met');

  s.pens = [null];
  assert.deepEqual(Adventure.evolutionCareOptions(s, p), [], 'pet must be in a pen');
});

test('homes-era saves delegate to the home model (capacity = number of pages)', () => {
  const s = legacyState({ pets: [pet('a')], gardenLevel: 1 });
  load(['home-core.js'], ['PetHomes']).PetHomes; // module loads standalone
  const { PetHomes } = load(['home-core.js', 'adventure-core.js'], ['PetHomes']);
  PetHomes.normalize(s, 0);
  assert.equal(s.homeVersion, 1);
  assert.equal(Adventure.capacity(s), 5);
});

test('any mini_<game> event counts as a distinct game for the evolution quest (new games need no registration)', () => {
  const s = grown();
  Adventure.startEvolution(s, 'p');
  times(s, 'mini_hangman', 1); times(s, 'mini_buildsen', 3);
  assert.equal(Adventure.evolution(s, s.pets[0])[4][1], 2);
});

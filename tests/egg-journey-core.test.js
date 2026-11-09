'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { load, pet, legacyState } = require('./helpers');

const { EggJourney } = load(['egg-journey-core.js'], ['EggJourney']);
const makeEgg = () => ({ id: 'egg', species: 1, color: 2, hatchAt: null });

test('a brand-new save has not received its starter egg; an established one has', () => {
  assert.equal(EggJourney.normalize(legacyState()).starter, false);
  assert.equal(EggJourney.normalize(legacyState({ pets: [pet('a')] })).starter, true);
  assert.equal(EggJourney.normalize(legacyState({ collection: ['1-1'] })).starter, true);
});

test('the starter egg is free, unconditional, and only given once', () => {
  const s = legacyState({ coins: 0 });
  assert.deepEqual(EggJourney.claim(s, '2026-01-01', makeEgg), { ok: true, starter: true });
  assert.equal(s.eggs.length, 1);
  assert.equal(s.coins, 0);
  const second = EggJourney.claim(s, '2026-01-01', makeEgg);
  assert.equal(second.ok, false, 'afterwards the normal requirements apply');
  assert.equal(s.eggs.length, 1);
});

test('learning stamps need >=60% first-try accuracy, except the math stamp', () => {
  const s = legacyState({ pets: [pet('a')] });
  assert.equal(EggJourney.stamp(s, 'music', 2, 5, 'd'), false, '40%');
  assert.equal(EggJourney.stamp(s, 'music', 3, 5, 'd'), true, '60%');
  assert.equal(EggJourney.stamp(s, 'melody', 0, 0, 'd'), false, 'no answers');
  assert.equal(EggJourney.stamp(s, 'math', 0, 5, 'd'), true, 'math only needs completion');
  assert.deepEqual(s.eggJourney.stamps, ['music', 'math']);
});

test('stamps: unknown kinds and repeats are ignored; none are earned on a claim day', () => {
  const s = legacyState({ pets: [pet('a')] });
  assert.equal(EggJourney.stamp(s, 'karaoke', 5, 5, 'd'), false);
  assert.equal(EggJourney.stamp(s, 'music', 5, 5, 'd'), true);
  assert.equal(EggJourney.stamp(s, 'music', 5, 5, 'd'), false, 'same kind twice');
  s.eggJourney.lastClaim = 'd';
  assert.equal(EggJourney.stamp(s, 'rhythm', 5, 5, 'd'), false, 'already claimed today');
  assert.equal(EggJourney.stamp(s, 'rhythm', 5, 5, 'next-day'), true);
});

test('a learning egg needs three stamps, 60 coins and a new day; it spends the coins and the stamps', () => {
  const s = legacyState({ pets: [pet('a')], coins: 59 });
  EggJourney.stamp(s, 'music', 5, 5, 'd1');
  EggJourney.stamp(s, 'melody', 5, 5, 'd1');
  assert.equal(EggJourney.claim(s, 'd1', makeEgg).ok, false, 'only two stamps');
  EggJourney.stamp(s, 'rhythm', 5, 5, 'd1');
  assert.equal(EggJourney.claim(s, 'd1', makeEgg).ok, false, 'one coin short');
  assert.equal(s.coins, 59);
  s.coins = 100;
  assert.deepEqual(EggJourney.claim(s, 'd1', makeEgg), { ok: true, starter: false });
  assert.equal(s.coins, 40);
  assert.deepEqual(s.eggJourney.stamps, []);
  assert.equal(s.eggs.length, 1);

  for (const kind of ['music', 'melody', 'rhythm']) EggJourney.stamp(s, kind, 5, 5, 'd1');
  assert.equal(s.eggJourney.stamps.length, 0, 'no new stamps on the claim day');
  const same = EggJourney.claim(s, 'd1', makeEgg);
  assert.equal(same.ok, false, 'one learning egg per day');
  assert.equal(s.coins, 40);

  for (const kind of ['music', 'melody', 'rhythm']) EggJourney.stamp(s, kind, 5, 5, 'd2');
  assert.equal(EggJourney.claim(s, 'd2', makeEgg).ok, false, 'next day, but only 40 coins');
  s.coins = 60;
  assert.equal(EggJourney.claim(s, 'd2', makeEgg).ok, true, 'next day with the fee works');
  assert.equal(s.coins, 0);
  assert.equal(s.eggs.length, 2);
});

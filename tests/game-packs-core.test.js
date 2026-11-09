'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { load, legacyState, seq } = require('./helpers');

const { GamePacks } = load(['game-packs-core.js'], ['GamePacks']);
const IDS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const finish = (s, id) => { (s.stats ??= {})['mini_' + id] = (s.stats['mini_' + id] || 0) + 1; };

test('a pack has 5 distinct games drawn from the offered ids', () => {
  const s = legacyState();
  assert.equal(GamePacks.roll(s, IDS, 'd1', seq(0.1, 0.9, 0.5, 0.3, 0.7)), true);
  const ids = GamePacks.entries(s).map(e => e.id);
  assert.equal(ids.length, GamePacks.size);
  assert.equal(new Set(ids).size, 5);
  assert.ok(ids.every(id => IDS.includes(id)));
});

test('rolling with fewer than 5 candidate games fails without touching the save', () => {
  const s = legacyState();
  assert.equal(GamePacks.roll(s, ['a', 'b', 'c'], 'd1'), false);
  assert.equal(s.gamePacks, undefined);
});

test('the daily reward needs every game in the pack completed after it was dealt', () => {
  const s = legacyState({ coins: 0 });
  GamePacks.roll(s, IDS, 'd1', seq(0.2));
  const ids = GamePacks.entries(s).map(e => e.id);
  assert.equal(GamePacks.claim(s, 'd1'), false);
  ids.slice(0, 4).forEach(id => finish(s, id));
  assert.equal(GamePacks.claim(s, 'd1'), false, 'four of five is not enough');
  finish(s, ids[4]);
  assert.equal(GamePacks.claim(s, 'd1'), true);
  assert.equal(s.coins, GamePacks.reward);
  assert.deepEqual(GamePacks.entries(s), []);
});

test('games cleared BEFORE the pack was dealt do not count towards it', () => {
  const s = legacyState();
  IDS.forEach(id => finish(s, id));
  GamePacks.roll(s, IDS, 'd1', seq(0.4));
  assert.ok(GamePacks.entries(s).every(e => !GamePacks.completed(s, e)));
});

test('one reward per day: no second claim, and no re-roll until tomorrow', () => {
  const s = legacyState({ coins: 0 });
  GamePacks.roll(s, IDS, 'd1', seq(0.6));
  GamePacks.entries(s).forEach(e => finish(s, e.id));
  assert.equal(GamePacks.claim(s, 'd1'), true);
  assert.equal(GamePacks.claim(s, 'd1'), false);
  assert.equal(GamePacks.roll(s, IDS, 'd1'), false);
  assert.equal(s.coins, GamePacks.reward, 'no double pay');
  assert.equal(GamePacks.roll(s, IDS, 'd2', seq(0.6)), true);
});

test('re-rolling keeps finished games and replaces only the unfinished ones', () => {
  const s = legacyState();
  GamePacks.roll(s, IDS, 'd1', seq(0.3));
  const first = GamePacks.entries(s).map(e => e.id);
  finish(s, first[0]);
  finish(s, first[1]);
  assert.equal(GamePacks.roll(s, IDS, 'd1', seq(0.8, 0.1, 0.5)), true);
  const second = GamePacks.entries(s).map(e => e.id);
  assert.ok(second.includes(first[0]) && second.includes(first[1]), 'finished games stay');
  assert.equal(new Set(second).size, 5);
});

test('camera games are counted from their own event names', () => {
  const s = legacyState({ stats: { color: 3, camera_shape: 1, mini_memory: 2 } });
  assert.equal(GamePacks.count(s, 'colorMain'), 3);
  assert.equal(GamePacks.count(s, 'shapeMain'), 1);
  assert.equal(GamePacks.count(s, 'memory'), 2);
  assert.equal(GamePacks.count(s, 'never'), 0);
});

test('practice rewards: 12 coins per game cleared 3 times, paid once per game', () => {
  const s = legacyState({ coins: 0, stats: { mini_a: 3, mini_b: 2, mini_c: 9 } });
  assert.deepEqual(GamePacks.practiceReady(s, ['a', 'b', 'c']), ['a', 'c']);
  assert.equal(GamePacks.claimPractice(s, ['a', 'b', 'c']), 24);
  assert.equal(s.coins, 24);
  assert.equal(GamePacks.claimPractice(s, ['a', 'b', 'c']), 0, 'already paid');
  s.stats.mini_b = 3;
  assert.equal(GamePacks.claimPractice(s, ['a', 'b', 'c']), 12);
  assert.equal(s.coins, 36);
});

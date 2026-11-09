'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { load, pet, legacyState, HOUR, clone } = require('./helpers');

const { IdleIncome } = load(['income-core.js'], ['IdleIncome']);
const U = IdleIncome.unit;
const items = [{ id: 'ball', price: 40 }, { id: 'castle', price: 360 }];

function stateWith(pets, homes) {
  return { ...legacyState({ pets }), homes };
}
const home = (petId, owned = []) => ({ petId, owned, equipped: {} });
const sum = rates => rates.reduce((n, r) => n + r.rate, 0);

test('a page without a pet earns nothing; a bare pet earns the base rate', () => {
  const s = stateWith([pet('a', { totalXP: 0 })], [home(null), home('a')]);
  const [empty, occupied] = IdleIncome.rates(s, items);
  assert.equal(empty.rate, 0);
  assert.equal(empty.petId, null);
  // raw = 4000; share = raw * 40000 / (40000 + total raw)
  assert.equal(occupied.rate, Math.floor(4000 * 40000 / 44000));
});

test('XP, evolution and furnishing each raise the rate; duplicates in owned count once', () => {
  const base = stateWith([pet('a')], [home('a')]);
  const r0 = IdleIncome.rates(base, items)[0].rate;
  const xp = stateWith([pet('a', { totalXP: 400 })], [home('a')]);
  const evolved = stateWith([pet('a', { evolution: 1 })], [home('a')]);
  const furnished = stateWith([pet('a')], [home('a', ['castle'])]);
  const dup = stateWith([pet('a')], [home('a', ['castle', 'castle'])]);
  assert.ok(IdleIncome.rates(xp, items)[0].rate > r0);
  assert.ok(IdleIncome.rates(evolved, items)[0].rate > r0);
  assert.ok(IdleIncome.rates(furnished, items)[0].rate > r0);
  assert.equal(IdleIncome.rates(dup, items)[0].rate, IdleIncome.rates(furnished, items)[0].rate);
});

test('account-wide income stays under 144 coins/hour no matter how many maxed pages exist', () => {
  for (const pages of [1, 2, 10, 100, 1000]) {
    const pets = Array.from({ length: pages }, (_, i) => pet('p' + i, { totalXP: 1e9, evolution: 1 }));
    const s = stateWith(pets, pets.map(p => home(p.id, ['ball', 'castle'])));
    const perHour = sum(IdleIncome.rates(s, items)) * 3600 / U;
    assert.ok(perHour < 144, pages + ' pages -> ' + perHour);
  }
});

test('adding a page always increases total income (diminishing, never negative)', () => {
  let previous = 0;
  for (let pages = 1; pages <= 30; pages++) {
    const pets = Array.from({ length: pages }, (_, i) => pet('p' + i, { totalXP: 300 }));
    const total = sum(IdleIncome.rates(stateWith(pets, pets.map(p => home(p.id))), items));
    assert.ok(total > previous, 'page ' + pages);
    previous = total;
  }
});

test('offline settle pays 25% of the rate and is capped at 2 hours per absence', () => {
  const rates = [{ page: 0, petId: 'a', rate: 4000 }];
  const s = legacyState({ coins: 0 });
  IdleIncome.settle(s, 0, rates, false);                       // initialise the clock
  const r = IdleIncome.settle(s, 10 * HOUR, rates, false);     // 10h away
  assert.equal(r.delta, IdleIncome.offlineCap);
  const expectedMicro = Math.floor(IdleIncome.offlineCap * 4000 / 4000);
  assert.equal(s.income.total, expectedMicro);
  assert.equal(s.coins, Math.floor(expectedMicro / U));
  assert.equal(s.income.remainder, expectedMicro % U);
});

test('online settle pays full rate for at most 5 seconds per tick', () => {
  const rates = [{ page: 0, petId: 'a', rate: 4000 }];
  const s = legacyState({ coins: 0 });
  IdleIncome.settle(s, 0, rates, true);
  const r = IdleIncome.settle(s, 60_000, rates, true);
  assert.equal(r.delta, 5000);
  assert.equal(s.income.total, 5000 * 4000 / 1000, 'full rate = 4x the offline factor');
});

test('time never runs backwards: a non-positive delta pays nothing and changes nothing', () => {
  const rates = [{ page: 0, petId: 'a', rate: 4000 }];
  const s = legacyState({ coins: 5 });
  IdleIncome.settle(s, 1000, rates, false);
  const snapshot = clone(s);
  assert.deepEqual(IdleIncome.settle(s, 1000, rates, false), { coins: 0, micro: 0, delta: 0 });
  assert.deepEqual(IdleIncome.settle(s, 500, rates, false), { coins: 0, micro: 0, delta: 0 });
  assert.deepEqual(s, snapshot);
});

test('splitting a period into many settles never creates or loses money', () => {
  const rates = [{ page: 0, petId: 'a', rate: 3637 }, { page: 1, petId: 'b', rate: 1234 }];
  const whole = legacyState({ coins: 0 }), parts = legacyState({ coins: 0 });
  IdleIncome.settle(whole, 0, rates, false);
  IdleIncome.settle(parts, 0, rates, false);
  IdleIncome.settle(whole, 90 * 60_000, rates, false);
  let t = 0, step = 7;
  while (t < 90 * 60_000) { t = Math.min(90 * 60_000, t + step); step = (step * 31 + 11) % 99_991 + 1; IdleIncome.settle(parts, t, rates, false); }
  assert.equal(parts.income.total, whole.income.total);
  assert.equal(parts.coins, whole.coins);
  assert.equal(parts.income.remainder, whole.income.remainder);
});

test('rebase swaps rates without paying anything', () => {
  const s = legacyState({ coins: 0 });
  IdleIncome.settle(s, 0, [{ page: 0, petId: 'a', rate: 1 }], false);
  const next = [{ page: 0, petId: 'a', rate: 999 }];
  IdleIncome.rebase(s, 5000, next);
  assert.deepEqual(s.income.rates, next);
  assert.equal(s.coins, 0);
  assert.equal(s.income.total, 0);
});

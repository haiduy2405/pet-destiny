'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./helpers');
const { Quests, EcoData } = load(['quests-core.js'], ['Quests', 'EcoData']);
const fresh = () => ({ coins: 0 });
const D = '2026-11-10';
const all = { mini: 9, care: 9, mini_a: 1, mini_b: 1, mini_c: 1, mini_fishing: 3, color: 2 };

test('every day offers exactly 4 quests, deterministic per date, valid templates', () => {
  for (const d of ['2026-01-01', D, '2027-02-28']) {
    const a = Quests.today(d), b = Quests.today(d);
    assert.equal(a.length, 4); assert.deepEqual(a, b);
    assert.equal(new Set(a.map(q => q.id)).size, 4);
  }
  const ids = new Set(); for (let i = 1; i <= 28; i++) Quests.today('2026-02-' + String(i).padStart(2, '0')).forEach(q => ids.add(q.id));
  assert.ok(ids.size >= 6, 'các ngày khác nhau phải có nhiều loại nhiệm vụ');
});
test('progress per metric, capped at target', () => {
  assert.equal(Quests.value('mini', all), 9);
  assert.equal(Quests.value('variety', all), 4);
  assert.equal(Quests.value('fish', all), 3);
  assert.equal(Quests.value('hunt', { color: 1, camera_shape: 2 }), 3);
  const s = fresh(), st = Quests.status(s, {}, D);
  assert.ok(st.items.every(x => x.value === 0 && !x.done));
  assert.ok(Quests.status(s, all, D).items.every(x => x.done && x.value === x.target));
});
test('claim: pays once, only when done, coins exact', () => {
  const s = fresh(), q = Quests.today(D)[0];
  assert.equal(Quests.claim(s, {}, D, q.id).ok, false);
  const r = Quests.claim(s, all, D, q.id);
  assert.equal(r.ok, true); assert.equal(s.coins, q.reward);
  assert.equal(Quests.claim(s, all, D, q.id).ok, false); assert.equal(s.coins, q.reward);
  assert.equal(Quests.claim(s, all, D, 'nope').ok, false);
});
test('bonus needs all 4 claimed; streak grows on consecutive days, resets after a gap', () => {
  const s = fresh();
  const finish = d => { for (const q of Quests.today(d)) assert.ok(Quests.claim(s, all, d, q.id).ok); return Quests.claimBonus(s, all, d) };
  assert.equal(Quests.claimBonus(s, all, D).ok, false);
  const r1 = finish(D); assert.equal(r1.streak, 1); assert.equal(r1.paid, Quests.bonusPay(1));
  assert.equal(Quests.claimBonus(s, all, D).ok, false, 'không nhận bonus hai lần');
  const r2 = finish('2026-11-11'); assert.equal(r2.streak, 2); assert.equal(r2.paid, Quests.bonusPay(2));
  const r3 = finish('2026-11-13'); assert.equal(r3.streak, 1, 'nghỉ một ngày thì chuỗi về 1');
  assert.ok(Quests.bonusPay(2) > Quests.bonusPay(1));
});
test('streak bonus is capped; month/year rollover handled', () => {
  assert.equal(Quests.bonusPay(99), Quests.bonusPay(EcoData.quests.streakCap + 1));
  assert.equal(Quests.prev('2027-01-01'), '2026-12-31'); assert.equal(Quests.prev('2026-03-01'), '2026-02-28');
});
test('normalize repairs a corrupted save without throwing', () => {
  for (const bad of [null, 5, 'x', { streak: -3, claimed: 'zzz', last: 7 }, { date: D, claimed: null }]) {
    const s = { coins: 0, dq: bad }; const st = Quests.status(s, {}, D); assert.equal(st.items.length, 4);
  }
});
test('economy: max daily quest income is bounded relative to a day of play', () => {
  assert.ok(Quests.maxDaily() <= 8 * EcoData.reward.pay + 60, 'quest không được vượt xa thu nhập chơi thường');
  assert.ok(Quests.maxDaily() >= 100);
});

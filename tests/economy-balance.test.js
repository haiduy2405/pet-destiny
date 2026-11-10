'use strict';
/* Ràng buộc chéo giữa các nguồn xu, đọc thẳng từ economy-data.js. Chỉnh giá mà vi phạm thì test báo ngay. */
const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./helpers');
const { EcoData: E, Balance: B, Farm: F, Fishing: X, LuckyBox: L } = load(['balance-core.js', 'farm-core.js', 'fishing-core.js', 'lucky-core.js'], ['EcoData', 'Balance', 'Farm', 'Fishing', 'LuckyBox']);

test('mini games: base pay in a sane band, repeat decay strictly falls, variety bonuses are modest', () => {
  const v = Object.values(E.balance.base);
  assert.ok(Math.min(...v) >= 9 && Math.max(...v) <= 30, 'thưởng nền 9–30 xu');
  assert.equal(E.balance.decay[0], 1);
  for (let i = 1; i < E.balance.decay.length; i++) assert.ok(E.balance.decay[i] < E.balance.decay[i - 1]);
  assert.ok(E.balance.decay.at(-1) * Math.min(...v) <= 3 + 1e-9 || E.balance.minPay >= 3, 'lặp nhiều vẫn còn xu tối thiểu');
  const top10 = Object.values(E.balance.base).sort((a, b) => b - a).slice(0, 10).reduce((a, b) => a + b, 0);
  const daily = top10 + E.balance.milestones.reduce((a, [, c]) => a + c, 0) + 10 * E.reward.dailyFirst;
  assert.ok(daily <= 480, 'trần mini game/ngày (người chơi chăm, mức Dễ) ' + daily);
});
test('passive/slow sources never out-earn active play: farm per plot-hour and fishing per ticket stay under the mini-game rate', () => {
  const perHour = c => (c.sell - c.seed) / (c.grow / F.HOUR);
  assert.ok(Math.max(...F.crops.map(perHour)) <= 40, 'nông trại ≤ 40 xu/giờ/thửa');
  assert.ok(F.MAX_PLOTS * 40 <= 280, 'tối đa 6 thửa không vượt 280 xu/giờ ngay cả khi chăm liên tục');
  const net = (id, bait) => { const l = X.lake(id); return l.casts * X.expectedValue(id, bait) * 1.08 - l.ticket - l.casts * X.bait(bait).cost; };
  assert.ok(net('pond', 'worm') <= 50, 'vé ao làng lãi tối đa 50 xu: ' + net('pond', 'worm'));
  assert.ok(net('forest', 'corn') <= 115, 'vé hồ rừng lãi tối đa 115 xu: ' + net('forest', 'corn'));
  assert.ok(net('deep', 'corn') <= 230, 'vé vịnh sâu, bắt trọn 6/6 (thực tế cao thủ ~70–85%) lãi tối đa 230 xu: ' + net('deep', 'corn'));
});
test('sinks and gambles: lucky box is a mild loss, fishing tickets/rods cost more than one decent session earns at the bottom tier', () => {
  assert.ok(L.expected() < E.lucky.price, 'hộp quà kỳ vọng dưới giá vé');
  assert.ok(E.fishing.rods[0].cost <= 50, 'cần đầu tiên rẻ để ai cũng thử được');
  for (let i = 1; i < E.fishing.rods.length; i++) assert.ok(E.fishing.rods[i].cost >= E.fishing.rods[i - 1].cost * 2.5, 'cần sau đắt hơn rõ rệt');
  assert.ok(E.farm.plotCosts.every((c, i, a) => !i || c > a[i - 1]));
});
test('one source of truth: data tables live in EcoData and the cores expose the same objects', () => {
  assert.equal(F.crops, E.farm.crops); assert.equal(X.rods, E.fishing.rods); assert.equal(X.lakes, E.fishing.lakes); assert.equal(B.base, E.balance.base);
  assert.equal(E.reward.pay, 15);
});

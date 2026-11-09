'use strict';
/* Khóa các "phụ thuộc ngầm" của kiến trúc bọc chồng (xem HANDOFF.md): thứ tự nạp script và danh sách file được phép
   ghi đè các hàm toàn cục. Test này fail khi thêm file mới mà chưa nghĩ tới thứ tự — lúc đó hãy cập nhật danh sách dưới đây
   CÓ CHỦ ĐÍCH, đừng chỉ sửa cho xanh. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const html = read('index.html');
const order = [...html.matchAll(/<script src="([^"?]+)/g)].map(m => m[1]);
const at = f => { const i = order.indexOf(f); assert.ok(i >= 0, f + ' chưa được nạp trong index.html'); return i; };
const before = (a, b, why) => assert.ok(at(a) < at(b), `${a} phải nạp trước ${b}: ${why}`);
const uiFiles = fs.readdirSync(root).filter(f => f.endsWith('.js') && !f.endsWith('-core.js') && f !== 'sw.js');

test('load order: economy-data.js is the very first script (cores read EcoData at load time)', () => { assert.equal(order[0], 'economy-data.js'); });
test('load order: every logic core loads before the UI file that uses it', () => {
  for (const core of fs.readdirSync(root).filter(f => f.endsWith('-core.js'))) {
    const ui = core.replace('-core.js', '.js');
    if (fs.existsSync(path.join(root, ui)) && order.includes(ui)) before(core, ui, 'UI dùng global của core');
  }
  before('balance-core.js', 'levels.js', 'levels.js gọi Balance.*');
  before('levels-core.js', 'levels.js', 'levels.js gọi Levels.*');
  before('fishing-core.js', 'fishing.js', 'fishing.js gọi Fishing.*');
});
test('load order: tab router and shared helpers come before every tab that registers', () => {
  for (const f of uiFiles.filter(f => /Tabs\.register\(/.test(read(f)) && f !== 'app-kit.js')) before('app-kit.js', f, 'tab dùng Tabs/txn');
  /* thứ tự đăng ký = thứ tự nút trên thanh tab */
  before('dollhouse.js', 'farm.js', 'Ngôi nhà đứng trước Nông trại'); before('farm.js', 'fishing.js', 'Nông trại đứng trước Câu cá');
});
test('load order: reward/level pipeline sees every game that records events', () => {
  for (const f of ['home-games.js', 'farm.js', 'fishing.js', 'practice-games.js', 'english-games.js', 'vietnamese-games.js', 'english-speaking.js'])
    before(f, 'rewards.js', 'rewards.js đè bảng thưởng của các game đã đăng ký');
  before('rewards.js', 'levels.js', 'levels.js bọc recordEvent ngoài rewards.js');
  before('sfx.js', 'rewards.js', 'sfx.js đè sound() trước khi game dùng');
});
test('load order: save/backup/PWA come last and in order', () => {
  const tail = order.slice(-4);
  assert.deepEqual(tail, ['evolution-fx.js', 'backup.js', 'slots.js', 'pwa.js'], 'slots.js mở hộp thoại ô lưu khi nạp nên phải gần cuối');
  before('lucky.js', 'evolution-fx.js', 'hiệu ứng tiến hóa nằm sau các game');
});
test('global hooks: only the known files wrap render/startMini/recordEvent/petArt/notice/sound', () => {
  const wrappers = name => uiFiles.filter(f => new RegExp('(^|[^\\w.$])' + name + '\\s*=\\s*function', 'm').test(read(f))).sort();
  assert.deepEqual(wrappers('render'), ['adventure.js', 'app-kit.js', 'atelier.js', 'egg-journey.js', 'game-packs.js', 'garden-options.js', 'garden.js', 'homes.js', 'learning.js', 'lucky.js', 'mobile.js', 'music.js', 'pet-bond.js', 'pet-loop.js', 'practice-games.js', 'prosperity.js', 'shop.js', 'visual-polish.js'],
    'tab mới hãy dùng Tabs.register (app-kit.js), đừng bọc render nữa');
  assert.deepEqual(wrappers('startMini'), ['arcade-levels.js', 'arcade.js', 'english-games.js', 'english-speaking.js', 'learning.js', 'levels.js', 'music.js', 'pet-loop.js', 'practice-games.js', 'prosperity.js', 'vietnamese-games.js', 'visual-polish.js']);
  assert.deepEqual(wrappers('recordEvent'), ['levels.js', 'rewards.js']);
  assert.deepEqual(wrappers('petArt'), ['evolution-fx.js']);
  assert.deepEqual(wrappers('notice'), ['mobile.js']);
  assert.deepEqual(wrappers('sound'), ['sfx.js']);
});
test('shared helpers: the safe-transaction pattern lives in txn(), tabs are not re-implemented', () => {
  for (const f of uiFiles.filter(f => f !== 'app-kit.js')) {
    const s = read(f);
    assert.ok(!/function\s+(fmDo|fsDo)\b/.test(s), f + ' tự định nghĩa lại giao dịch, hãy dùng txn()');
    assert.ok(!/\.dataset\.tab\s*=\s*['"](dollhouse|farm|fish)['"]/.test(s), f + ' tự chèn nút tab, hãy dùng Tabs.register');
  }
  const ids = []; for (const f of uiFiles) for (const m of read(f).matchAll(/Tabs\.register\(\{id:'([^']+)'/g)) ids.push(m[1]);
  assert.deepEqual(ids, ['dollhouse', 'farm', 'fish']);
});

// Báo cáo kinh tế: gom thu nhập tối đa/ngày của từng nguồn xu để so sánh khi chỉnh giá.
// usage: node tools/economy-report.js
// Mọi con số lấy thẳng từ *-core.js (không có bản sao), người chơi giả định "chăm" và chơi tốt.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const load = (files, names) => new Function(files.map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n;\n') + '\n;return {' + names.join(',') + '};')();
const { Balance: B } = load(['balance-core.js'], ['Balance']);
const { Farm: F } = load(['farm-core.js'], ['Farm']);
const { Fishing: X } = load(['fishing-core.js'], ['Fishing']);
const pad = (s, n) => String(s).padEnd(n), num = (v, d = 0) => (+v).toFixed(d);

console.log('== 1. Mini game (Balance): xu cho lượt 1..5+ của cùng 1 game/ngày ==');
const bases = Object.entries(B.base).sort((a, b) => b[1] - a[1]);
const run = id => B.DECAY.reduce((a, f, i) => a + Math.max(3, Math.round(B.baseOf(id) * f)), 0);
console.log(`  ${bases.length} game, thưởng nền ${bases.at(-1)[1]}–${bases[0][1]} xu; chơi 5 lượt 1 game ≈ ${run('math')} xu (nền 15) so với ${5 * 15} nếu không giảm dần`);
const top10 = bases.slice(0, 10).reduce((a, [id]) => a + B.baseOf(id), 0);
console.log(`  10 game khác nhau (1 lượt mỗi game, mức Dễ) ≈ ${top10} + thưởng đa dạng ${B.MILESTONES.reduce((a, [, c]) => a + c, 0)} + 10×10 "trò mới" ≈ ${top10 + 105 + 100} xu/ngày`);

console.log('\n== 2. Nông trại: lãi/giờ trồng 1 thửa (giá chợ trung bình, đã trừ hạt) ==');
for (const c of F.crops) { const h = c.grow / F.HOUR; console.log(`  ${pad(c.name, 10)} lãi ${pad(c.sell - c.seed, 4)} / ${pad(num(h, 2) + 'h', 7)} → ${num((c.sell - c.seed) / h, 1)} xu/giờ/thửa (cần quay lại đúng lúc)`); }
console.log(`  ${F.MAX_PLOTS} thửa: loại 10 giờ chỉ ≈ ${F.MAX_PLOTS * (F.crops.at(-1).sell - F.crops.at(-1).seed)} xu/ngày; cải xanh 3 phút lãi/giờ cao nhất nhưng đòi người chơi quay lại liên tục (kiểm tra có đáng không).`);

console.log('\n== 3. Câu cá: lãi 1 vé (6 lượt) theo tay nghề giả lập & cần ==');
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function bot(skill, rnd) { const delay = .45 - .35 * skill, noise = (1 - skill) * .16, buf = []; let nz = 0, nt = 0; return (r, dt) => { buf.push(r.f); const n = Math.max(0, Math.round(delay / dt)); const seen = buf[Math.max(0, buf.length - 1 - n)]; nt -= dt; if (nt <= 0) { nz = (rnd() + rnd() + rnd() - 1.5) * noise * 2; nt = .25; } return r.z + r.p.h / 2 + r.zv * .3 < seen + nz; }; }
function rate(lake, rod, skill, n = 150) { let ok = 0; for (let i = 0; i < n; i++) { const fish = X.pickFish(lake, 'worm', rng(i * 7 + 1)), rnd = rng(i + 1), r = X.reelStart(X.reelParams(lake, fish.id, rod), rnd), h = bot(skill, rnd); while (!r.over) X.reelStep(r, 1 / 60, h(r, 1 / 60), rnd); if (r.over === 'caught') ok++; } return ok / n; }
for (const l of X.lakes) for (const rod of X.rods) for (const skill of [.4, .8]) {
  const p = rate(l.id, rod.id, skill), bait = X.bait('corn'), net = l.casts * p * X.expectedValue(l.id, 'corn') * 1.08 - l.ticket - l.casts * bait.cost;
  console.log(`  ${pad(l.name, 9)} ${pad(rod.name, 18)} tay ${skill}: bắt ${pad(num(p * 100) + '%', 5)} lãi vé đầu trong ngày ≈ ${pad(num(net), 4)} xu (vé thứ 2 ×${X.decayFor(1)}, thứ 4 ×${X.decayFor(3)} giá cá)`);
}
console.log('\nLưu ý: số "xu/ngày" chỉ để so sánh tương đối giữa các nguồn; thang giá thật cần dữ liệu chơi thật (xem HANDOFF → rủi ro).');

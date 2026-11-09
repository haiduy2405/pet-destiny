# Pet Destiny — Handoff (cập nhật 2026-11-09, bản v42)

## Prompt dán vào session mới
> Đọc `HANDOFF.md` trong repo haiduy2405/pet-destiny (đừng đọc cả codebase). Sau đó trình bày cho tôi 7 hướng phát triển ở mục "Gợi ý" (có chỉnh theo thực tế hiện tại, kèm công sức/tác động), rồi chờ tôi chọn trước khi làm. Trả lời tiếng Việt, ngắn gọn, TL;DR trước.

## Nguyên tắc sản phẩm (chủ dự án đã chốt — áp dụng cho mọi thay đổi)
- **Đối tượng: từ 6 tuổi trở lên đến người lớn, không giới hạn tuổi.** Không phải game chỉ dành cho bé. Khi cân bằng nội dung, độ khó, giọng văn, hình thức và thưởng, phải nghĩ cho cả khoảng tuổi này: có mức dễ cho người mới/6 tuổi nhưng không "trẻ con hóa" quá đà, và có thử thách đủ cho người lớn (độ khó tăng dần, nội dung đa dạng). Giao diện và lời thoại nên thân thiện nhưng không áp đặt "bé ơi".
- **Giữ miễn phí**: không dùng dịch vụ có chi phí (không backend/đăng nhập email trả phí). Lưu cục bộ + file sao lưu + PWA là giải pháp đã chọn.

## Dự án
Web game nuôi thú + học tập (Toán, Âm nhạc, Tiếng Anh, Tiếng Việt). Tĩnh, không build, không framework. Chạy tại https://haiduy2405.github.io/pet-destiny/ (push `main` là tự deploy, ~1–2 phút). Lưu game trong localStorage (`pet-destiny-slots-v1`, 4 ô). Cài được như app (PWA, chạy offline).
Nhãn phiên bản `vNN` nằm ở tiêu đề trang (index.html). **Mỗi lần phát hành: tăng `?v=` của file đã sửa, nhãn vNN, và `VERSION` trong `sw.js`** (test `tests/pwa.test.js` bắt nếu lệch nhãn, thiếu file trong `ASSETS` của sw.js, hoặc script thiếu `?v=`). File mới (js/css/ảnh) phải thêm vào `ASSETS` trong sw.js.

## Kiến trúc (quan trọng)
- `*-core.js`: logic thuần (IIFE: SaveStore, Economy, PetHomes, IdleIncome, EggJourney, GamePacks, Adventure, Atelier, MusicCore, Visuals, ShapeCamera, DollHouse). Có test.
- Các file còn lại là UI, **bọc chồng lên nhau** (mỗi file ghi đè `render`, `startMini`, `petArt`, `recordEvent`... theo thứ tự nạp trong index.html). Thứ tự hiện tại kết thúc: `... pet-bond, english-games, vietnamese-games, english-speaking, dollhouse-core, dollhouse-photo-core, home-games-core, dollhouse, dollhouse-photo, home-games, rewards, evolution-fx, backup, slots, pwa`. File mới thêm **trước `backup.js`**; `rewards.js` và `evolution-fx.js` nên ở sau các file game, `slots.js` gần cuối (nó mở hộp thoại ô lưu khi nạp).
- Thêm game mini: đăng ký vào `arcadeGames` (`[id,icon,tên,mô tả,15]`), thêm id vào `gameSubjects` (pet-loop.js) để hiện đúng môn, gọi `recordEvent('mini')` + `recordEvent('mini_<id>')` khi xong (nhiệm vụ tiến hóa tự đếm mọi `mini_*`). Game trắc nghiệm đơn giản: thêm vào `practiceGames` (xem `english-games.js`, `vietnamese-games.js`).
- Mẫu giao dịch an toàn: `backup=SaveStore.copy(state)` → sửa → `if(!save()){state=backup;return}`.
- Tab thứ 4 "Ngôi nhà" được chèn bằng cách bọc `render` (dollhouse.js) vì `render()` gốc dùng bảng tab cố định.
- **Sao lưu/khôi phục**: logic thuần ở `save-store.js` (`exportData`, `parseBackup`, `importInto`, có test); giao diện ở `backup.js` (`bkPanel()`/`bkBind()` do `slots.js` gọi trong hộp thoại ô lưu; `bkSaveBlob` dùng chung để tải file). File sao lưu = JSON `{app:'pet-destiny',format:1,slots:[4]}`. Khôi phục không bao giờ ghi đè ô có dữ liệu nếu chưa bấm xác nhận lần 2; kể cả khi localStorage hỏng vẫn khôi phục được.
- **PWA**: `manifest.webmanifest`, `sw.js` (network-first, rơi về cache khi offline; cache đặt tên theo VERSION nên bản cũ tự bị xóa), `pwa.js` (đăng ký SW + xin `storage.persist()`), icon `icon-*.png`.
- **Thú ghé thăm đồ** (`dollhouse-core.js`: `reaction`, `petSpot`, `pickTarget`; `dollhouse.js`: `dhVisit`, `dhStartWander`): thú tự đi đến món đồ mỗi 14 giây (không khi đang chọn/kéo đồ, tắt khi bật giảm chuyển động), hoặc bấm "🐾 Gọi thú đi chơi" / nút 🐾 trên đồ đang chọn. Tư thế + hiệu ứng theo món (`bed`→ngủ, `sofa`→ngồi, `cake`→ăn...); món mới tự rơi về mặc định theo nhóm, test bắt thiếu.
- **Đồ/tường theo mùa** (`dollhouse-core.js`: `seasons`, `activeSeasons`, `inSeason`; mục `cat:'season'` + `season:<id>` trên món và tường): mua được **chỉ trong cửa sổ ngày dương lịch** của dịp đó (Tết 10/1–28/2, Thiếu nhi 25/5–5/6, Hè 1/6–31/8, Trung thu 25/8–5/10, Nhà giáo 1–25/11, Giáng sinh 1–31/12; Tết và Trung thu là âm lịch nên cửa sổ rộng — **chỉnh lại hằng năm nếu cần**). Mua rồi giữ mãi. `buy`/`setStyle` nhận tham số ngày để test. Tường mùa mới cũng cần spec canvas.
- **Tặng đồ giữa ô lưu** (`DollHouse.gift`, UI `dhGiftOpen`): chuyển chứ không nhân bản (người tặng mất món và bản đặt trong phòng), xu không chuyển, ghi cả hai ô trong một lần `persistSlots`.
- **Game trong nhà** (`home-games-core.js` sinh câu hỏi thuần, có test tính lại đáp án; `home-games.js` đăng ký `cook` 🍳 và `garden` 🌱 như `practiceGames`, môn Toán): nút xuất hiện trong phòng Nhà bếp / Sân vườn; thưởng đi qua đường ống chuẩn (15 + tối đa 5, +10 lần đầu mỗi ngày) nên **không tạo nguồn xu mới**. `home-games.js` phải nạp trước `rewards.js`.
- **Ảnh phòng** (`dollhouse-photo-core.js` thuần + `dollhouse-photo.js` vẽ canvas, không chụp DOM): thêm tường/sàn mới trong `DollHouse.walls/floors` thì **phải thêm spec vẽ canvas tương ứng** trong `DollPhotoCore.walls/floors` (test bắt thiếu/dư).

## Kinh tế (v39 — thay thế bảng v31)
- **Thưởng nền theo công sức** từng game: `balance-core.js` (`Balance.base`, mặc định 15; bấm nhanh ≈ 9–12, suy luận ≈ 20–30, Dãy số bí mật 30). Mọi chỗ trả xu gọi `Balance.pay(state,day(),id,first)` (= nền + tối đa 5 xu đúng ngay, nhân hệ số giảm khi lặp).
- **Giảm dần khi lặp 1 game/ngày**: lượt 1→5+ nhận 100% / 70% / 45% / 25% / 12% (tối thiểu 3 xu). Chặn exploit 1 trò dễ.
- **Thưởng đa dạng**: +10 xu lần đầu mỗi game mỗi ngày (rewards.js); chơi đủ 3 / 6 / 10 game khác nhau trong ngày: +15 / +30 / +60 một lần (`Balance.record`, state.plays).
- **Mức khó** (levels-core.js): Dễ ×1, Vừa ×1.5, Khó ×2.2 trên thưởng nền; mở khóa mức kế khi đúng ≥60% ngay lần đầu. Có mức: mọi `practiceGames` + 6 game arcade (arcade-levels.js: memory, count, pairs, snacks, colors, order). Chưa có mức: music/melody, speak*, hangman, math/odd/path, fractions/change/earmemory, rhythm, buildsen, camera → bước tiếp theo.
- Đếm đom đóm: phải đếm đúng 5 lần mới nhận xu; sai mất 1 lần đúng và đổi đàn mới.
- **Hộp quà may mắn** (lucky-core.js + lucky.js, thẻ đầu tab Kiếm xu): vé 60 xu, 1 lượt miễn phí/ngày, tối đa 8 vé mua/ngày, pity 7 hộp, kỳ vọng ~88% giá vé (mô phỏng trong test). Chỉ xu trong game.
- **Nông trại (v40)**: `farm-core.js` + `farm.js`, tab thứ 5 🌾. 6 loại cây (cải 3 phút → bí ngô 10 giờ, lãi ~+40–90%), 3 thửa đất đầu + mở thêm 3 (150/300/600), tưới −20% thời gian, 15% thu hoạch gấp đôi, kho tối đa 40/loại, giá chợ đổi mỗi ngày 0.85–1.25 (xác định theo ngày). Thời gian dùng đồng hồ thiết bị (state.farm). Phối giống: 80 xu, 20 phút, thú ≥25 XP và chỉ số chăm sóc TB ≥40, nghỉ 3 giờ; trứng loài/màu của bố hoặc mẹ, 10% đột biến loài, 12% màu lạ, vào `state.eggs` với `bred:true`.
- **Âm thanh (v41)**: `sfx-core.js` (công thức tiếng, tần số nốt, phân loại phản hồi, giới hạn tần suất) + `sfx.js` (engine WebAudio tổng hợp, không file). Thay `sound()`/`musicPlay()`; mặc định BẬT (khóa `pet-destiny-sound`=`off` thì tắt). Phím tên nốt (`data-note-answer`, `data-ear-note`) kêu như đàn; đáp án đúng/sai tự có tiếng nhờ đọc `[role=status]`/`*Feedback`; xu tăng/giảm → ding/spend; chuyển tab, lật thẻ, nhịp trống. Muốn thêm tiếng mới: thêm vào `Sfx.recipes` + `Sfx.gaps` rồi gọi `sfxPlay(tên)`. **v42**: dùng mẫu âm thật khi đã tải (mp3, tải nền sau lần chạm đầu): `audio/ui/` (bộ "organic" của UI SFX, CC0) cho tap/đúng/sai/thắng/xu...; `audio/piano/` (Salamander Grand Piano, CC BY 3.0, 9 mẫu cắt 3,2s, dịch cao độ ≤3 nửa cung) cho phím đàn và nốt nghe mẫu. Chưa tải xong hoặc lỗi thì tự dùng tiếng tổng hợp. Ghi công: `audio/CREDITS.md` + footer. Trống/lắc hộp/tưới nước vẫn là tiếng tổng hợp.
- Khi thêm game mới: thêm id vào `Balance.base` theo công sức, gọi `Balance.pay` TRƯỚC `recordEvent`.

## Đã làm trong session trước
dọn code chết + 82→93 test · cân bằng thưởng · giai đoạn lớn (🥚🌱🌿⭐👑) + animation tiến hóa · 4 game Tiếng Anh (Giải cứu từ, Xếp chữ, Nghe, Điền từ) · 5 game nói/nghe (Web Speech API, có chế độ tự đánh giá) · 8 game Tiếng Việt · Ngôi nhà của em (6 phòng, ~60 đồ, sao, tiệc tân gia, thú khen).

## Đã làm trong session v38
Đồ/tường theo mùa (6 dịp, 24 món + 3 tường), tặng đồ giữa các ô lưu, 2 game Toán trong nhà (nấu ăn, làm vườn). 119 test; kiểm bằng Chrome headless.

## Đã làm trong session v37
Xuất/nhập file lưu (+ nhắc sao lưu), PWA cài app + offline, thú ghé thăm đồ trong nhà (ngồi/ngủ/ăn/chơi...), chụp ảnh phòng để lưu/chia sẻ. 111 test. Đã kiểm bằng Chrome headless (khung 390px): sao lưu → xóa → khôi phục, offline, thú đi các tư thế, xuất PNG.

## Quy ước / công cụ
- Repo trộn CRLF/LF: **sửa byte-preserving** (Python `open(...,newline='')`), đừng chuẩn hóa dòng. Nhiều file là dòng rất dài (minified-ish): dùng `grep -o` có context thay vì đọc cả file.
- `npm test` (node:test, `tests/*.test.js`, helper `tests/helpers.js` nạp các `*-core.js`).
- `tools/harness.js`: mô phỏng game trong jsdom (`npm i jsdom --no-save`; `node tools/harness.js <repo> out.json`). `tools/screenshot.example.js`: mẫu chụp màn hình bằng Playwright (khung 390px) để kiểm tra giao diện.
- Cam kết git: kết thúc commit bằng 2 dòng `Co-Authored-By: Claude ...` và `Claude-Session: ...` theo system reminder của session.
- Môi trường cloud: `gh api` bị chặn, push tag bị 403 (push nhánh/main ổn). Muốn quay lại bản trước tính năng cân bằng/tiến hóa: commit `0becbf0`.

## Rủi ro / nợ kỹ thuật
- localStorage là nơi duy nhất lưu game: **chưa có xuất/nhập file lưu** → mất dữ liệu nếu xóa dữ liệu trình duyệt.
- Kiến trúc bọc chồng khó đoán; CSS còn dư (shared-enclosure, pen-board...); thưởng nằm rải rác (rewards.js chỉ đè bảng).
- Nội dung học (từ vựng, chính tả, tục ngữ) do AI soạn, cần người lớn rà soát. Nhận diện giọng nói chỉ tốt trên Chrome Android.
- Đồ theo mùa chưa có dữ liệu chơi thật về giá; các dịp ngoài mùa hiện bị khóa nên người chơi chỉ thấy món khóa trong tab "Theo mùa".
- Chưa test trên điện thoại thật: kéo thả đồ trong nhà, micro, animation tiến hóa, **tải/chia sẻ file sao lưu, cài PWA, lưu ảnh phòng** (Safari có thể không áp màu thú trong ảnh vì thiếu `ctx.filter`); thang thưởng/giá chưa có dữ liệu chơi thật.
- Thu nhập thụ động dựa đồng hồ thiết bị (có thể bị chỉnh giờ).

## Gợi ý phát triển tiếp (xếp theo giá trị / công sức)
1. ~~Xuất/nhập file lưu + PWA~~ — **xong ở v37**. Còn lại (nhỏ): nút "Cài app" riêng (`beforeinstallprompt`), nhắc sao lưu khi mở game nếu quá lâu, tự lưu bản sao thứ hai trong IndexedDB.
2. **Báo cáo cho phụ huynh**: thống kê theo môn (số lượt, tỷ lệ đúng lần đầu, từ/âm hay sai), thời gian chơi, nút giới hạn thời gian. Dữ liệu đã có sẵn trong `state.stats`.
3. **Học thích ứng**: lặp lại từ/câu bé hay sai (spaced repetition), tự tăng độ khó; mở rộng kho nội dung theo chủ đề (gia đình, số đếm, nghề nghiệp, cảm xúc, hỏi đường...). Cho phép nạp bộ từ từ file JSON.
4. **Tiến hóa đỉnh hơn**: dạng tiến hóa có hình riêng theo loài, nhiều cấp (tiến hóa 2, 3), nhánh lựa chọn, thú tiến hóa mở khóa đồ/phòng đặc biệt, bộ sưu tập "ảnh lớn lên".
5. ~~Ngôi nhà~~ — **xong ở v37–v38** (ảnh phòng, thú tương tác, đồ theo mùa, tặng đồ, game nấu ăn/làm vườn). Còn ý tưởng nhỏ: thêm sàn theo mùa, đổi đồ hai chiều giữa các ô, thêm game thứ ba trong phòng tắm/phòng ngủ.
6. **Giữ chân**: chuỗi ngày chơi (streak), nhiệm vụ ngày/tuần, sổ sticker và huy hiệu, quà đăng nhập, sự kiện theo mùa.
7. **Nền tảng kỹ thuật**: gom bảng thưởng/giá vào một file dữ liệu; mô phỏng kinh tế bằng script; dần thay chuỗi bọc `render` bằng một bộ định tuyến tab; dọn CSS; trợ năng (phím tắt, độ tương phản, cỡ chữ); âm thanh/nhạc nền và giọng đọc tốt hơn.

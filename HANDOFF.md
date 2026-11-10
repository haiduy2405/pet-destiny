# Pet Destiny — Handoff (cập nhật 2026-11-09, bản v52)

## Prompt dán vào session mới
> Đọc `HANDOFF.md` trong repo haiduy2405/pet-destiny (đừng đọc cả codebase). Trả lời tiếng Việt, ngắn gọn, TL;DR trước. Tiếp tục tái cấu trúc theo mục "Tái cấu trúc: việc còn lại" (làm từng bước, `npm test` xanh sau mỗi bước, không làm hỏng file lưu cũ), hoặc theo ưu tiên tôi nói. Trước khi làm, kiểm tra trên điện thoại thật những gì bản v43–v44 chưa kiểm được (mục Rủi ro).

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
- **Tab phụ (v44)**: `app-kit.js` có `Tabs.register({id,icon,label,open,leave,canDraw,draw})` (Ngôi nhà, Nông trại, Câu cá). Một wrapper `render` duy nhất lo việc đổi `current` tạm, chèn nút nav, `data-page`, gọi `leave()` mỗi lần vẽ lại. **Tab mới: dùng `Tabs.register`, đừng bọc `render` nữa** (test `architecture.test.js` bắt). Cũng ở đó: `txn(fn)` = sao lưu → sửa → lưu, hỏng thì hoàn lại (fn trả `{ok,message}`); dùng cho mọi giao dịch mới.
- **Test kiến trúc** (`tests/architecture.test.js`): khóa thứ tự nạp script (core trước UI, rewards/levels, backup/slots/pwa ở cuối) và danh sách file được ghi đè `render/startMini/recordEvent/petArt/notice/sound`. Thêm file bọc mới thì phải cập nhật danh sách đó CÓ CHỦ ĐÍCH.
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
- **Câu cá (v43)**: `fishing-core.js` + `fishing.js`, tab 🎣. Cần tre/sợi/carbon (40/160/480, vùng giữ cá 24/30/36%), 3 phụ kiện (phao nhạy, kính râm, lưới vợt), mồi giun/ngô/tôm (2/3/6 xu mỗi con, mua gói 5), 3 hồ: Ao làng/Hồ rừng/Vịnh sâu (vé 10/32/85 = 6 lượt thả; càng sâu cá càng nhanh, vùng giữ càng hẹp, thời gian giật càng ngắn). Mini game: thả câu → chờ phao chìm → giật cần trong cửa sổ thời gian (giật sớm/trễ mất lượt + mồi) → giữ cá trong vùng xanh (giữ = vùng đi lên, thả = hạ; điều khiển cảm ứng/Space). Cá to/đắt hơn khi kéo giỏi. Thu nhập chỉ qua bán cá (giá chốt lúc bắt, nhân hệ số giảm khi thuê lại cùng hồ trong ngày: ×1/.8/.6/.4/.25) + thưởng một lần khi gặp loài mới. Hết vé thì `recordEvent('mini_fishing')` (nhiệm vụ, +10 xu trò mới/ngày, thưởng đa dạng). Chỉnh giá: dùng `tools/economy-report.js` và các test mô phỏng trong `tests/fishing-core.test.js` (người chơi giả theo tay nghề).
- **Báo cáo kinh tế**: `node tools/economy-report.js` gom thu nhập mini game / nông trại / câu cá để so sánh khi chỉnh giá.
- Khi thêm game mới: thêm id vào `Balance.base` theo công sức, gọi `Balance.pay` TRƯỚC `recordEvent`.

## Đã làm trong session trước
dọn code chết + 82→93 test · cân bằng thưởng · giai đoạn lớn (🥚🌱🌿⭐👑) + animation tiến hóa · 4 game Tiếng Anh (Giải cứu từ, Xếp chữ, Nghe, Điền từ) · 5 game nói/nghe (Web Speech API, có chế độ tự đánh giá) · 8 game Tiếng Việt · Ngôi nhà của em (6 phòng, ~60 đồ, sao, tiệc tân gia, thú khen).

## Đã làm trong session v39–v42
v39: mức khó Dễ/Vừa/Khó (levels-core/levels/arcade-levels), cân bằng thưởng theo công sức + giảm khi lặp + thưởng đa dạng (balance-core), hộp quà may mắn (lucky-core/lucky), sửa đếm đom đóm (đếm đúng 5 lần). v40: nông trại + phối giống (farm-core/farm). v41–v42: engine âm thanh (sfx-core/sfx) + mẫu âm thật CC0/CC BY (`audio/`). 167 test. Chi tiết từng hệ thống nằm ở mục Kinh tế.

## Tái cấu trúc: đã làm (v44) và việc còn lại
Đã làm (kiểm bằng ảnh chụp trước/sau 7 màn hình — giống từng điểm ảnh): bộ định tuyến tab + `txn` (app-kit.js, thay 3 bản copy), test kiến trúc, xóa 36 lớp CSS không dùng (-5 KB), báo cáo kinh tế.
Rà soát cho thấy: `render` bị bọc ở 18 file, `startMini` 12 file, `recordEvent` 2 file; mẫu "sao lưu → sửa → lưu" lặp ở ~15 file; thưởng/giá rải ở 10 core.
Việc còn lại (theo thứ tự rủi ro tăng dần):
1. Thay `dhTx`/các đoạn `SaveStore.copy(state)` lặp ở ~12 file bằng `txn()` (từng file một, test xanh mỗi lần).
2. ~~Sổ đăng ký game~~ XONG (v46): `games-registry.js` (sau adventure.js). Game mới: `Games.on('loai' | ['a','b'] | t=>bool, type=>{...})`; đăng ký sau được hỏi trước; không khớp thì rơi về game gốc memory/count. Chỉ `arcade-levels.js` và `levels.js` (chọn mức khó) còn bọc `startMini` ngang. Nếu hỏng: quay về commit `859b450`.
3. ~~Gom giá/thưởng~~ XONG (v47): `economy-data.js` giữ cả shop cũ và giá Ngôi nhà (phòng, tường, sàn, 92 món); core tra giá bằng id và ném lỗi nếu thiếu. Cây ngắn nông trại đã siết; `tests/economy-balance.test.js` kiểm cân bằng chéo.
3. Gom bảng giá/thưởng vào 1 module dữ liệu + mô phỏng kinh tế/ngày có ngưỡng trần (hiện chỉ có báo cáo).
4. Tách `render` của các tab gốc (garden/quests/collection) vào `Tabs` như tab phụ, rồi bỏ `current='collection'` giả.
5. Dọn CSS tiếp (còn các quy tắc chồng nhau theo `data-page`).
Ghi chú thứ tự nạp hiện tại: `... dollhouse(app-kit trước nó), home-games, farm, fishing, sfx, rewards, arcade-levels, levels, lucky, evolution-fx, backup, slots, pwa`. Thứ tự phụ thuộc ngầm; test kiến trúc đang canh.
- Dữ liệu mới của người chơi lưu trong `state.<tên>` (farm, fishing, lucky, plays, levels, dollhouse); `SaveStore` giữ field lạ nên không cần migrate, mỗi core có `normalize` tự sửa dữ liệu hỏng. File lưu cũ (không có `state.fishing`) chạy bình thường (có test).

## Đã làm trong session v43–v44
v43: tab Câu cá (fishing-core/fishing, 15 test mô phỏng), âm thanh cast/ripple/bite/reel/catch/escape. v44: app-kit (Tabs + txn), test kiến trúc, dọn CSS, tools/economy-report.js. 188 test. Kiểm bằng Chrome headless (khung 390px): chơi trọn một vé câu cá, chuyển 6 tab, mua/trồng qua `txn`, tải lại giữ dữ liệu.

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
- Chưa test trên điện thoại thật: **mini game câu cá (giữ để kéo bằng ngón tay, rung, độ khó thật của từng hồ)**, kéo thả đồ trong nhà, micro, animation tiến hóa, **tải/chia sẻ file sao lưu, cài PWA, lưu ảnh phòng** (Safari có thể không áp màu thú trong ảnh vì thiếu `ctx.filter`); thang thưởng/giá chưa có dữ liệu chơi thật.
- Thu nhập thụ động dựa đồng hồ thiết bị (có thể bị chỉnh giờ).

## Gợi ý phát triển tiếp (xếp theo giá trị / công sức)
1. ~~Xuất/nhập file lưu + PWA~~ — **xong ở v37**. Còn lại (nhỏ): nút "Cài app" riêng (`beforeinstallprompt`), nhắc sao lưu khi mở game nếu quá lâu, tự lưu bản sao thứ hai trong IndexedDB.
2. **Báo cáo cho phụ huynh**: thống kê theo môn (số lượt, tỷ lệ đúng lần đầu, từ/âm hay sai), thời gian chơi, nút giới hạn thời gian. Dữ liệu đã có sẵn trong `state.stats`.
3. **Học thích ứng**: lặp lại từ/câu bé hay sai (spaced repetition), tự tăng độ khó; mở rộng kho nội dung theo chủ đề (gia đình, số đếm, nghề nghiệp, cảm xúc, hỏi đường...). Cho phép nạp bộ từ từ file JSON.
4. **Tiến hóa đỉnh hơn**: dạng tiến hóa có hình riêng theo loài, nhiều cấp (tiến hóa 2, 3), nhánh lựa chọn, thú tiến hóa mở khóa đồ/phòng đặc biệt, bộ sưu tập "ảnh lớn lên".
5. ~~Ngôi nhà~~ — **xong ở v37–v38** (ảnh phòng, thú tương tác, đồ theo mùa, tặng đồ, game nấu ăn/làm vườn). Còn ý tưởng nhỏ: thêm sàn theo mùa, đổi đồ hai chiều giữa các ô, thêm game thứ ba trong phòng tắm/phòng ngủ.
6. **Giữ chân**: chuỗi ngày chơi (streak), nhiệm vụ ngày/tuần, sổ sticker và huy hiệu, quà đăng nhập, sự kiện theo mùa.
7. **Nền tảng kỹ thuật**: gom bảng thưởng/giá vào một file dữ liệu; mô phỏng kinh tế bằng script; dần thay chuỗi bọc `render` bằng một bộ định tuyến tab; dọn CSS; trợ năng (phím tắt, độ tương phản, cỡ chữ); âm thanh/nhạc nền và giọng đọc tốt hơn.


## v45–v46
v45: EcoData (bảng kinh tế một nguồn), siết cải bắp. v46: Games registry thay chuỗi bọc startMini (10 file chuyển sang Games.on). 195 test; smoke Chrome 19 loại game không lỗi console.

## v48: nhiệm vụ ngày + giao diện kiểu game
- **Nhiệm vụ ngày**: `quests-core.js` (logic thuần, test `tests/quests-core.test.js`), `daily.js` (tab 📜 qua `Tabs.register`, đứng đầu các tab phụ), số liệu ở `EcoData.quests` (4 khe/ngày, mẫu chọn theo hash của ngày, thưởng/bonus/chuỗi). Tiến độ đọc từ `Adventure.daily(...).counts` nên không bọc thêm `recordEvent`. Trạng thái lưu ở `state.dq={date,claimed,bonus,streak,last}`; nghỉ một ngày thì chuỗi về 1. Thêm nhiệm vụ: thêm mẫu vào `EcoData.quests.slots` (metric: mini, care, variety, fish, hunt, hoặc tên sự kiện bất kỳ trong counts); test kiểm trần thu nhập ngày.
- `Tabs` có hook mới `badge()` (chấm đỏ trên nút tab, dùng cho nhiệm vụ có thể nhận).
- **Giao diện**: `game-theme.css` là lớp phủ nạp sau `mobile.css` (HUD đầu trang, nút nổi khối, thẻ có độ sâu, dock tab nổi, chế độ tối). Màu ở biến `:root`. Quay về cũ: bỏ thẻ link trong index.html. Chưa làm lại: các màn mini-game riêng lẻ (vẫn dùng style cũ, chỉ thừa hưởng nút/thẻ mới).
- 202 test.

## v49: câu cá dễ hơn, thưởng cao hơn
Người chơi báo quá khó và thưởng ít. Chỉnh toàn bộ ở `EcoData.fishing`: cần kéo chậm/rộng hơn, cửa sổ giật cần dài hơn, vé rẻ hơn (6/22/60), giá cá tăng. Lãi 1 vé đầu ngày (tay trung bình, cần gợi ý): Ao ≈ 45, Hồ rừng ≈ 85–100, Vịnh sâu ≈ 130–180 (trước đó 17–23 / 14–52 / −46–80). Bắt được: Ao làng người mới ≥94%; Hồ rừng cần sợi tay 0.4 ≈ 89%; Vịnh sâu cần carbon tay 0.4 ≈ 71%. Vẫn chống cày: vé thứ 4 trong ngày lãi rất ít, vé 5 không lời. Trần mới trong `tests/economy-balance.test.js`: ao ≤ 50, hồ rừng ≤ 115, vịnh ≤ 230 (bắt trọn 6/6). Chưa có dữ liệu chơi thật trên điện thoại: nếu vẫn khó/dễ, chỉnh `reel.speed/zone/gain/loss` rồi chạy `node tools/economy-report.js`.

## v50: tiếng piano không còn bị chồng chuông lạ
Lỗi: bấm đáp án nốt nhạc thì nốt piano và chuông "đúng/sai", xu, thưởng phát cùng lúc (khác cao độ) nên nghe có âm lạ kêu theo. Sửa trong `sfx.js` (`sfxPianoUntil`): lúc nốt đang ngân, tiếng chạm/lật/chuyển tab bị bỏ, các chuông kết quả dời sang sau khi nốt dứt. Chưa nghe thử trên máy thật; nếu vẫn lạ tai, nghi tiếp: mẫu piano chỉ có 9 file (mỗi 6 bán cung) nên nốt xa mẫu bị đổi tốc độ tối đa ±3 bán cung (`Sfx.nearestPiano`), có thể thêm mẫu hoặc giảm biên độ đổi.

## v51: nâng cấp âm thanh toàn app + câu cá dễ hơn, nhiều xu hơn
**Âm thanh** (`sfx-core.js` + `sfx.js`, mobile.js chỉ đổi 3 chỗ gọi hàm):
- **Bộ điều phối** (`Sfx.decide`, test `sfx-core.test.js`): mỗi lúc chỉ nghe một ý chính. Ưu tiên 1 giao diện < 2 hành động < 3 kết quả (đúng/sai/xu) < 4 ăn mừng < 5 piano. Đang có nốt piano thì bỏ tiếng nút/hành động, chuông kết quả dời sang sau nốt và nối đuôi nhau; sau fanfare thì bỏ tiếng nhẹ hơn; tiếng nút chờ 40ms để bị hủy nếu có tiếng kết quả ngay sau.
- **Thông báo (toast)**: `noticeKind()` phân loại (ăn mừng chỉ khi chuyện vui, `+xu` → tiếng xu, `−xu` → tiếng chi, còn lại tiếng "info" rất nhẹ). Trước đây MỌI toast đều phát tiếng thưởng/thú cưng.
- **Mixer**: hồ âm tự tạo (convolver), lọc cắt dải chói 9 kHz, nén. Nút loa chuyển 4 mức Tắt/Nhẹ/Vừa/To (nhớ lại, `pet-destiny-volume`). Rung nhẹ trên điện thoại (`Sfx.HAPTIC`), tôn trọng giảm chuyển động. Tiếng chạm đổi cao độ ngẫu nhiên ±4%.
- **Piano**: 17 mẫu Salamander cách 3 bán cung (C2–C6, chuẩn hóa âm lượng, 245 KB), dịch cao độ tối đa ±1,5 bán cung (trước ±3) nên âm sắc tự nhiên hơn.
**Câu cá**: ba chỉnh lớn.
- Cá bơi quanh tầng giữa (không còn "ôm đáy/ôm mặt là thắng"), tiến độ sắp cạn thì tuột chậm lại (đỡ người mới), tiến độ khởi đầu 40%, vùng giữ cá rộng hơn, cá chậm hơn, cửa sổ giật cần dài hơn (2,2/1,9/1,6 s), thưởng lần đầu bắt loài mới ×0,8 giá cá.
- Lãi vé đầu ngày khi bắt trọn 6/6: Ao ≈ 59, Hồ rừng ≈ 123, Vịnh ≈ 190–200 (trước 45/100/180). Hệ số vé lặp trong ngày [1, .75, .5, .3, .2].
- "Người chơi lười" (`lazy()` trong test: bấm giữ 0,3s/thả 0,3s, không nhìn cá) là mốc người mới thật: Ao + cần tre bắt ≥ 50%, Hồ rừng + cần sợi ≥ 70%, Vịnh + cần carbon ≥ 50%. Trần kinh tế trong `economy-balance.test.js`: ao ≤ 65, rừng ≤ 135, vịnh ≤ 215 mỗi vé.
Chưa thử trên điện thoại thật: nếu vẫn khó, giảm `reel.speed`/tăng `reel.zone` ở `EcoData.fishing.lakes`, chạy `node tools/economy-report.js`.

## v52: không còn bôi đen/chọn chữ khi bấm giữ hoặc bấm đúp
`game-theme.css` (user-select/touch-callout/touch-action: manipulation) + 3 listener cuối `app-kit.js` (contextmenu, selectstart, dragstart). Ô nhập chữ, `select`, `footer` (hướng dẫn sao lưu) và class `.selectable` vẫn chọn/sao chép được: muốn một đoạn chữ mới sao chép được thì thêm class `selectable`. Pinch-zoom bằng 2 ngón vẫn giữ để dễ nhìn.

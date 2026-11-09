# Pet Destiny — Handoff (cập nhật 2026-11-09, bản v36)

## Prompt dán vào session mới
> Đọc `HANDOFF.md` trong repo haiduy2405/pet-destiny (đừng đọc cả codebase). Sau đó trình bày cho tôi 7 hướng phát triển ở mục "Gợi ý" (có chỉnh theo thực tế hiện tại, kèm công sức/tác động), rồi chờ tôi chọn trước khi làm. Trả lời tiếng Việt, ngắn gọn, TL;DR trước.

## Dự án
Web game nuôi thú + học tập cho trẻ (Toán, Âm nhạc, Tiếng Anh, Tiếng Việt). Tĩnh, không build, không framework. Chạy tại https://haiduy2405.github.io/pet-destiny/ (push `main` là tự deploy, ~1–2 phút). Lưu game trong localStorage (`pet-destiny-slots-v1`, 4 ô).
Nhãn phiên bản `vNN` nằm ở tiêu đề trang (index.html). **Mỗi lần phát hành: tăng `?v=` của file đã sửa và nhãn vNN** (điện thoại hay giữ cache index.html cũ).

## Kiến trúc (quan trọng)
- `*-core.js`: logic thuần (IIFE: SaveStore, Economy, PetHomes, IdleIncome, EggJourney, GamePacks, Adventure, Atelier, MusicCore, Visuals, ShapeCamera, DollHouse). Có test.
- Các file còn lại là UI, **bọc chồng lên nhau** (mỗi file ghi đè `render`, `startMini`, `petArt`, `recordEvent`... theo thứ tự nạp trong index.html). Thứ tự hiện tại kết thúc: `... pet-bond, english-games, vietnamese-games, english-speaking, dollhouse-core, dollhouse, rewards, evolution-fx, slots`. File mới thêm **trước `slots.js`**; `rewards.js` và `evolution-fx.js` nên ở cuối.
- Thêm game mini: đăng ký vào `arcadeGames` (`[id,icon,tên,mô tả,15]`), thêm id vào `gameSubjects` (pet-loop.js) để hiện đúng môn, gọi `recordEvent('mini')` + `recordEvent('mini_<id>')` khi xong (nhiệm vụ tiến hóa tự đếm mọi `mini_*`). Game trắc nghiệm đơn giản: thêm vào `practiceGames` (xem `english-games.js`, `vietnamese-games.js`).
- Mẫu giao dịch an toàn: `backup=SaveStore.copy(state)` → sửa → `if(!save()){state=backup;return}`.
- Tab thứ 4 "Ngôi nhà" được chèn bằng cách bọc `render` (dollhouse.js) vì `render()` gốc dùng bảng tab cố định.

## Kinh tế (đã cân bằng, v31)
Mọi game: **15 xu + tối đa 5 xu** nếu đúng ngay lần đầu; **+10 xu lần đầu mỗi game mỗi ngày** (`rewards.js`, bọc `recordEvent`). Camera 15 xu. XP chăm sóc: ăn +30, tắm/chơi +15, huấn luyện +25 (8 xu), bánh +40. Tiến hóa +60 xu. Ngôi nhà: xây phòng 100–250, đồ 10–150, thưởng sao 10/25/50 một lần/phòng, tiệc 100 xu một lần.

## Đã làm trong session trước
dọn code chết + 82→93 test · cân bằng thưởng · giai đoạn lớn (🥚🌱🌿⭐👑) + animation tiến hóa · 4 game Tiếng Anh (Giải cứu từ, Xếp chữ, Nghe, Điền từ) · 5 game nói/nghe (Web Speech API, có chế độ tự đánh giá) · 8 game Tiếng Việt · Ngôi nhà của em (6 phòng, ~60 đồ, sao, tiệc tân gia, thú khen).

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
- Chưa test trên điện thoại thật: kéo thả đồ trong nhà, micro, animation tiến hóa; thang thưởng/giá chưa có dữ liệu chơi thật.
- Thu nhập thụ động dựa đồng hồ thiết bị (có thể bị chỉnh giờ).

## Gợi ý phát triển tiếp (xếp theo giá trị / công sức)
1. **Xuất/nhập + sao lưu file lưu** (nhỏ, bảo vệ công sức của bé) và **PWA** (cài như app, chạy offline, service worker có version để hết lỗi cache cũ).
2. **Báo cáo cho phụ huynh**: thống kê theo môn (số lượt, tỷ lệ đúng lần đầu, từ/âm hay sai), thời gian chơi, nút giới hạn thời gian. Dữ liệu đã có sẵn trong `state.stats`.
3. **Học thích ứng**: lặp lại từ/câu bé hay sai (spaced repetition), tự tăng độ khó; mở rộng kho nội dung theo chủ đề (gia đình, số đếm, nghề nghiệp, cảm xúc, hỏi đường...). Cho phép nạp bộ từ từ file JSON.
4. **Tiến hóa đỉnh hơn**: dạng tiến hóa có hình riêng theo loài, nhiều cấp (tiến hóa 2, 3), nhánh lựa chọn, thú tiến hóa mở khóa đồ/phòng đặc biệt, bộ sưu tập "ảnh lớn lên".
5. **Ngôi nhà**: lưu ảnh căn phòng để khoe, thú tương tác với đồ (ngồi sofa, ngủ giường), chủ đề theo mùa/sự kiện, tặng/đổi đồ với ô lưu khác, mini-game trong nhà (nấu ăn đồ hàng, làm vườn).
6. **Giữ chân**: chuỗi ngày chơi (streak), nhiệm vụ ngày/tuần, sổ sticker và huy hiệu, quà đăng nhập, sự kiện theo mùa.
7. **Nền tảng kỹ thuật**: gom bảng thưởng/giá vào một file dữ liệu; mô phỏng kinh tế bằng script; dần thay chuỗi bọc `render` bằng một bộ định tuyến tab; dọn CSS; trợ năng (phím tắt, độ tương phản, cỡ chữ); âm thanh/nhạc nền và giọng đọc tốt hơn.

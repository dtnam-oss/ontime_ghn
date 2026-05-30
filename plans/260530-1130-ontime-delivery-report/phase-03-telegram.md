# Phase 3 — Telegram (today/week) trong sync job + manual dispatch

**Priority:** P3 · **Status:** pending · **Depends:** P1 (đã có agg_*)

## Overview
Gửi báo cáo tổng quan Telegram group: "hôm nay" + "tuần này". Chạy ngay trong
Node sync job (đã có sẵn dữ liệu đã tính) → cron tự động + `workflow_dispatch` thủ công.

## Key insights
- Node gửi qua `fetch` Bot API `sendMessage` (`parse_mode:'HTML'`) — không cần server riêng.
- Báo cáo build từ kết quả `metrics` trong cùng lần chạy (không đọc lại sheet).
- **Manual trigger** = chạy workflow `workflow_dispatch` (input `scope=today|week`).
  In-app button (FE) cần Cloudflare Worker gọi `repository_dispatch` → **optional**.
- Token/chat_id từ GitHub Secrets (không hardcode).

## Files
- `/sync/src/telegram.js` — `sendTelegram(text)`, `buildReport(scope, data)`
- (cập nhật `index.js` gọi sau khi metrics xong; đọc input scope từ env)
- (cập nhật `sync.yml` thêm input `scope` cho workflow_dispatch)

## Implementation steps
1. **`sendTelegram(text)`**: POST Bot API, `chat_id` + `text` + `parse_mode`;
   `muteHttpExceptions` ~ kiểm tra `ok`; log lỗi. Nếu token/chat trống → bỏ qua + warn.
2. **`buildReport(scope, data)`** (`scope ∈ {today,week}`) lọc theo phạm vi ngày:
   - **Ontime theo tuyến (Loại)** + số chuyến mỗi loại
   - **Ontime theo xe (BKS)** tổng hợp + số lượng
   - **Tình trạng check-in** + số lượng (đúng giờ / trễ / chưa check-in)
   - Format HTML: tiêu đề + ngày, `<b>`, bullet `•`, %.
3. **Phạm vi**: today = ngày hôm nay; week = 7 ngày gần nhất (theo ngày bắt đầu chuyến).
4. **`index.js`**: sau metrics → đọc `process.env.REPORT_SCOPE` (mặc định today
   cho cron sáng) → `sendTelegram(buildReport(scope, data))`.
5. **`sync.yml`**:
   - schedule daily (sáng) → scope `today`
   - schedule weekly (cuối tuần) → scope `week`
   - `workflow_dispatch` input `scope` (today/week) cho gửi thủ công
   - (giờ cron cụ thể: confirm với user)
6. **(Optional)** Cloudflare Worker free: nhận request từ nút FE → gọi GitHub
   `repository_dispatch` (giữ PAT ở Worker, không lộ ra FE). Chỉ làm nếu cần nút in-app.

## Todo
- [x] `sendTelegram` (fetch Bot API) + guard token/chat trống
- [x] `buildReport(scope)` — Loại + tổng (chuyến/xe) + check-in/số lượng, HTML
- [x] `dateRange` today/week theo ngày mới nhất trong dữ liệu
- [x] Nối `index.js` gửi theo `REPORT_SCOPE` (refactor groupTrips/aggregatesFromTrips)
- [x] `sync.yml`: cron(today) + workflow_dispatch(scope) — đã có từ P1
- [x] Test offline trên CSV (5/5) — số khớp nguồn (29/05: 78.6/95.5/83.3, overall 88.4%)
- [x] README hướng dẫn tạo bot + chat_id + cách gửi
- [ ] **Gửi thật vào group** (cần bot token + chat_id)
- [ ] (Optional) Worker cho nút in-app — chưa cần (dùng workflow_dispatch)

## Success criteria
- Cron sáng gửi báo cáo today; cuối tuần gửi week — đúng định dạng vào group
- `workflow_dispatch` chọn scope gửi đúng theo yêu cầu
- Số liệu trong tin khớp dashboard cùng phạm vi

## Risks
- Sai chat_id / bot chưa join group → log lỗi API, test trước.
- Vượt 4096 ký tự/tin → cắt gọn hoặc chia nhiều tin.
- Nếu user thực sự cần nút in-app mà không muốn Worker → phải xét lại serving qua API server.

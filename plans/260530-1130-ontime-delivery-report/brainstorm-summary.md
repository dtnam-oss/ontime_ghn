# Brainstorm Summary — Báo cáo hiệu quả giao hàng NAK (Ontime)

**Date:** 2026-05-30 · **Type:** Greenfield · **Status:** Design approved → planning

> **⚠️ REVISION 2026-05-30:** Bỏ Google Apps Script (giới hạn nhiều). Pivot sang
> **webapp tĩnh React + Node sync job chạy GitHub Actions cron**; FE đọc backend
> sheet trực tiếp (API key); Telegram chạy trong sync job (cron + workflow_dispatch).
> Các quyết định nghiệp vụ bên dưới (công thức ontime, heatmap lưới, nội dung báo
> cáo) VẪN GIỮ NGUYÊN. Kiến trúc mới: xem [plan.md](./plan.md).

## Problem statement
Xây hệ thống báo cáo hiệu quả giao hàng (ontime điểm dừng) trên nền Google Sheet, có dashboard trực quan mở trong sheet và tự động gửi báo cáo qua Telegram group.

## Data understanding
- **Sheet nguồn** `1a4ECGE9QDSTU9CpUL04rtnMja0OvezdrvV6_JU5A2Xk`, tab `Chi tiết`: 5360+ dòng, **1 dòng = 1 điểm dừng** của 1 chuyến.
- 20 cột: `STT, Ngày bắt đầu chuyến, Mã chuyến, Trạng thái, BKS, Tải trọng, Tài xế, Mã lộ trình, Loại, Điểm dừng, Điểm đã check in, Điểm checkin trễ, Ontime điểm dừng, Lộ trình, Thời gian check in dự kiến/thực tế, Thời gian check out dự kiến/thực tế, Thời gian đóng seal, Tình trạng check in`.
- `Mã chuyến` gom nhiều dòng (1 hành trình). `Loại` ∈ {Nội thành, Nội tỉnh/Nội vùng, Tuyến trục}. `Tình trạng check in` ∈ {đúng giờ, trễ (nhiều loại), trống=chưa check-in}.
- **Không có toạ độ GPS** — chỉ tên điểm.

## Key decisions (chốt với user)
| # | Quyết định | Lựa chọn |
|---|---|---|
| 1 | Kiến trúc | **Google Apps Script** bound vào backend sheet `1XmTPr…`; `openById` đọc sheet nguồn |
| 2 | Aggregation | **Backend tự tính** từ raw `Chi tiết` |
| 3 | Heatmap | **Lưới route × ngày** tô màu ontime% (không cần geocoding) |
| 4 | Telegram | **Cả tự động (cron) + nút thủ công** |
| 5 | Công thức ontime/chuyến | `đúng giờ / số điểm ĐÃ check-in` (khớp 100% hiển thị ở sheet nguồn) |
| 6 | Dashboard UX | **Modal lớn** (`showModalDialog` ~1200px) trong sheet |

## Architecture
- Apps Script project **bound** vào BACKEND sheet `1XmTPr04gF0v50dV3QLxYJrVrHch68-3n5A4s0RESB_k`.
- ETL: đọc sheet nguồn → mirror `_raw` → precompute các sheet cache `agg_*` (chạy cron đêm + nút bấm).
- Modal HtmlService + Chart.js (CDN) đọc `agg_*` qua `google.script.run`.
- Telegram qua `UrlFetchApp` + time-driven triggers + menu thủ công.

### Modules (.gs)
- `sync.gs` — ETL source → `_raw` → gọi metrics.
- `metrics.gs` — gom theo `Mã chuyến`, ghi `agg_*`.
- `dashboard.gs` + HTML — menu, modal, render chart.
- `telegram.gs` — định dạng + gửi (cron + thủ công).
- `_config` sheet — `telegram_bot_token`, `telegram_chat_id`, `source_spreadsheet_id`, `top_n=10` (không hardcode).

### Sheet cache (`agg_*`)
- `agg_trip` — ontime% mỗi chuyến (+loại/ngày/BKS/tài xế/lộ trình).
- `agg_daily` — ontime TB theo ngày + đường xu hướng.
- `agg_type` — ontime theo Loại.
- `agg_heatmap` — ma trận Mã lộ trình × Ngày → ontime%.
- `agg_top` — Top N thấp nhất theo tuyến / tài xế / BKS.
- `agg_vehicle_checkin` — đếm trạng thái check-in mỗi BKS theo giai đoạn.

## Dashboard sections (modal)
1. KPI cards (ontime TB, tổng chuyến, % theo Loại).
2. Đường xu hướng ontime theo ngày + trend line.
3. Bar ontime theo Loại.
4. Heatmap lưới route×ngày.
5. 3 bảng Top thấp nhất (tuyến/tài xế/BKS).
6. Stacked bar check-in theo BKS/giai đoạn.

## Telegram report
Tổng quan **hôm nay** + **tuần này**: ontime theo tuyến + xe / số lượng · tình trạng check-in / số lượng. Tự động sáng (hôm nay) + cuối tuần (tuần này) + nút thủ công.

## Phases
- **P0** Setup: Apps Script bound + `_config` + quyền đọc sheet nguồn.
- **P1** `sync.gs` + `metrics.gs` + trigger ETL.
- **P2** Dashboard modal + 6 sections.
- **P3** Telegram (định dạng + cron + nút thủ công).

## Risks / constraints
- Modal HtmlService giới hạn kích thước → chia tab; cân nhắc web-app full-screen sau nếu chật.
- Apps Script 6 phút/execution & quota UrlFetchApp — đủ cho quy mô hiện tại, theo dõi khi dữ liệu tăng mạnh.
- Heatmap địa lý thật bị hoãn (cần geocoding) — dùng lưới trước.
- Quyền: script owner phải có quyền đọc sheet nguồn `1a4ECGE9…`.

## Success criteria
- Đồng bộ raw + tính đúng 6 nhóm chỉ số, khớp logic ontime đã chốt.
- Modal mở từ menu sheet, render đủ 6 section.
- Telegram gửi đúng nội dung tổng quan hôm nay/tuần, cả tự động lẫn thủ công.

## Unresolved questions
- Bot token & group chat_id Telegram (cần user cung cấp khi cấu hình `_config`).
- "Giai đoạn" trong báo cáo check-in theo xe = theo ngày hay tuần? (mặc định: chọn được ngày/tuần).
- Lịch cron cụ thể (giờ gửi sáng / thời điểm cuối tuần) — cần xác nhận khi triển khai P3.

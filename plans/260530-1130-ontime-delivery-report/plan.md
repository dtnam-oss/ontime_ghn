---
title: Báo cáo hiệu quả giao hàng NAK (Ontime)
status: pending
created: 2026-05-30
revised: 2026-05-30
type: greenfield
stack: Node.js (sync) + React/Vite (FE) + Google Sheets API + GitHub Actions
blockedBy: []
blocks: []
---

# Plan — Báo cáo hiệu quả giao hàng NAK (Ontime)

> **Revision 2026-05-30:** Bỏ Google Apps Script (giới hạn nhiều). Chuyển sang
> **webapp tĩnh + sync job Node chạy GitHub Actions cron**. Google Sheet vẫn là
> backend store. Thiết kế gốc: [brainstorm-summary.md](./brainstorm-summary.md).

## Kiến trúc
```
SOURCE SHEET (1a4ECGE9) ──Sheets API(service account)──► Node sync (GitHub Actions cron)
                                                              │ tính agg_* + Telegram
                                                              ▼
                            BACKEND SHEET (1XmTPr, agg_*) ── publish read-only
                                                              ▲ Sheets API (API key)
                                                              │
                                          FE React/Vite (static) ── dashboard 6 section
```

## Bối cảnh chốt
- **Backend store:** sheet `1XmTPr04gF0v50dV3QLxYJrVrHch68-3n5A4s0RESB_k` (tab `agg_*`, publish read-only)
- **Source:** sheet `1a4ECGE9QDSTU9CpUL04rtnMja0OvezdrvV6_JU5A2Xk` tab `Chi tiết` (5360+ dòng, 1 dòng=1 điểm dừng)
- **Ontime/chuyến** = (#điểm "đúng giờ") / (#điểm ĐÃ check-in)
- **Loại:** Nội thành · Nội tỉnh/Nội vùng · Tuyến trục · **Heatmap:** lưới route×ngày
- **Telegram:** cron tự động + thủ công qua `workflow_dispatch`
- **Auth:** sync dùng **service account** (đọc source + ghi backend); FE đọc backend bằng **API key** (sheet public read-only)

## Phases
| # | Phase | Status | File |
|---|-------|--------|------|
| 0 | Setup repo + service account + GitHub Secrets + publish sheet | code done · manual pending | [phase-00-setup.md](./phase-00-setup.md) |
| 1 | Node sync + metrics → ghi backend sheet + GH Actions cron | code done · e2e pending creds | [phase-01-etl-metrics.md](./phase-01-etl-metrics.md) |
| 2 | FE React/Vite (6 tab) — **thay bởi P5 redesign** | superseded by P5 | [phase-02-dashboard.md](./phase-02-dashboard.md) |
| 3 | Telegram (today/week) trong sync job + manual dispatch | code done · send pending creds | [phase-03-telegram.md](./phase-03-telegram.md) |
| 4 | Sync: agg_trip +2 cột count, bỏ 5 bảng agg thừa | code done (test 6/6) | [phase-04-sync-agg-trip-columns.md](./phase-04-sync-agg-trip-columns.md) |
| 5 | FE redesign: 1 trang cuộn + bộ lọc toàn cục (5 chiều) | code done · visual verified | [phase-05-frontend-redesign-filters.md](./phase-05-frontend-redesign-filters.md) |
| 6 | Sync: thêm bảng agg_stops (per-điểm + độ trễ) | code done (test 8/8) | [phase-06-sync-agg-stops.md](./phase-06-sync-agg-stops.md) |
| 7 | FE: chi tiết hành trình (drill + timeline + bar trễ) | code done · visual verified | [phase-07-frontend-trip-detail.md](./phase-07-frontend-trip-detail.md) |
| 8 | Tinh chỉnh chi tiết: bảng 5 mốc giờ + heatmap row-click + reorder | code done · visual verified | [phase-08-trip-detail-enhancements.md](./phase-08-trip-detail-enhancements.md) |
| 9 | TripDetail: fix tràn (gọn list, bỏ bar) + highlight CI/CO thực tế trễ | code done · visual verified | [phase-09-trip-detail-fit-highlight.md](./phase-09-trip-detail-fit-highlight.md) |
| 10 | Tích lũy lịch sử: raw private + window-replace + retention | code done · e2e pending RAW sheet | [phase-10-history-accumulation.md](./phase-10-history-accumulation.md) |

> **Feature 2026-05-30:** drill-down chi tiết chuyến. Xem [brainstorm-trip-detail.md](./brainstorm-trip-detail.md). Thứ tự: P6 (sync agg_stops) → P7 (FE TripDetail).

> **Redesign 2026-05-30:** bỏ layout 6 tab → 1 trang cuộn + filter toàn cục. FE chỉ đọc `agg_trip`. Xem [brainstorm-redesign-layout.md](./brainstorm-redesign-layout.md). Thứ tự: P4 (sync) → P5 (FE).

## Cấu trúc repo (monorepo)
```
/sync                 # Node script chạy GitHub Actions
  src/sheets.js       # googleapis client (SA) read/write
  src/metrics.js      # gom Mã chuyến → tính agg_*
  src/telegram.js     # build + send report
  src/index.js        # orchestrate: sync → metrics → write → telegram
  package.json
/web                  # React + Vite static FE
  src/lib/sheets.js   # đọc backend sheet qua API key
  src/components/*    # 6 section + charts
/.github/workflows/sync.yml   # cron + workflow_dispatch
```

## Backend sheet cache (`agg_*`)
`agg_trip` · `agg_daily`(+trend) · `agg_type` · `agg_heatmap`(route×ngày) ·
`agg_top`(tuyến/tài xế/BKS) · `agg_vehicle_checkin`

## Thứ tự / dependency
P0 → P1 → (P2 FE, P3 Telegram song song; cả hai cần schema `agg_*` từ P1).

## Phụ thuộc bên ngoài (cần user)
- Service account JSON → share đọc source + ghi backend sheet
- API key (Sheets API, restrict referrer) + publish backend sheet read-only
- Telegram `bot_token` + group `chat_id` → GitHub Secrets
- Repo GitHub + nơi host FE tĩnh (GitHub Pages / Cloudflare Pages)

## Success criteria
- GH Actions cron đổ `agg_*` đúng vào backend sheet (khớp logic ontime)
- FE load đọc thẳng backend sheet, render 6 section, không tính lại
- Telegram gửi tổng quan today/week (cron + dispatch thủ công)

## Risks (xem chi tiết trong phase)
- **Lộ dữ liệu**: backend sheet public → tên tài xế/BKS đọc được. Giảm: chỉ publish `agg_*`, restrict API key.
- **Nút Telegram thủ công**: không server → dùng `workflow_dispatch`; in-app button cần Worker (optional).
- Secret leak nếu commit SA JSON → chỉ qua GitHub Secrets, .gitignore.

## Unresolved
- "Giai đoạn" check-in theo xe = ngày hay tuần (mặc định: chọn được ở FE)
- Giờ cron (sáng today / cuối tuần week)
- Host FE tĩnh ở đâu + có cần chặn truy cập công khai không

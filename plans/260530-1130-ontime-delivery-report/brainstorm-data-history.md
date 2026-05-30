# Brainstorm — Tích lũy lịch sử dữ liệu (source 7 ngày → lưu toàn bộ)

**Date:** 2026-05-30 · **Type:** ETL/architecture · **Status:** Approved → plan

## Problem
Source (1a4ECGE9, view-only) chỉ giữ **7 ngày gần nhất** (cửa sổ trượt). Sync hiện
**ghi đè** → mất lịch sử cũ. Cần tích lũy để giữ **toàn bộ ngày** (cap theo thời gian).

## Quyết định chốt
| # | Vấn đề | Chốt |
|---|---|---|
| 1 | Retention | **Cap thời gian** — `RETENTION_DAYS` mặc định 540 (~18th); khuyến nghị 365–450 (trần 10M ô) |
| 2 | Nơi lưu `raw` | **Sheet private MỚI** (chỉ service account); backend public chỉ agg |
| 3 | Merge | **Window-replace**: `raw = raw_cũ(ngày ∉ source & ≥ cutoff) + source(7d)` |
| 4 | agg_trip (FE charts) | **Toàn bộ** lịch sử (trong retention) |
| 5 | agg_stops (FE drill) | **Cửa sổ gần** `STOPS_WINDOW_DAYS` mặc định 90 (tránh FE tải 400k điểm) |

## Kiến trúc
```
SOURCE (7d, view) → merge(window-replace+retention) → RAW SHEET private (full history)
                                                          → agg_trip (full) + agg_stops (90d) → BACKEND public
                                                          → Telegram (raw trips)
FE: đọc agg (API key); drill chuyến ngoài cửa sổ → báo "chi tiết chỉ có N ngày gần nhất".
```

## Cơ chế sync (mỗi ngày — an toàn vì < 7 ngày)
1. Đọc source `Chi tiết` (A1:T, có header) + đọc RAW `raw`.
2. `today` (UTC runner); `cutoff = today − RETENTION_DAYS`.
3. `merged = hist.filter(d≥cutoff && d∉srcDates) + src.filter(d≥cutoff)`.
4. Ghi RAW `raw` (full, có header). Tính agg_trip(merged), agg_stops(merged, ≥ today−STOPS_WINDOW).
5. Ghi backend agg_trip/agg_stops/_meta. Telegram today/week từ merged trips.

## Config
`RAW_SHEET_ID` (secret) · `RETENTION_DAYS=540` · `STOPS_WINDOW_DAYS=90` (env, có default).

## Cloud setup (user)
Tạo spreadsheet private mới → share **Editor** cho service account → đặt `RAW_SHEET_ID`.

## Risks / trần
- RAW 18th ≈ 8.3M ô (gần trần 10M) → hạ retention nếu cần.
- agg_trip full to dần → FE chậm sau nhiều tháng → tương lai windowing/DB (YAGNI giờ).
- "today" UTC lệch ngày sát nửa đêm (nhỏ; có thể set TZ Asia/Ho_Chi_Minh trong workflow).
- Full-rewrite RAW mỗi ngày nặng dần (chấp nhận; theo dõi).

## Success criteria
- Sau nhiều lần sync (qua mốc 7 ngày), RAW + agg_trip giữ ngày cũ (không mất).
- Chuyến đang chạy được cập nhật đúng khi hoàn tất (window-replace).
- agg_stops chỉ chứa ~90 ngày; FE drift cũ báo rõ. Telegram/charts không hồi quy.

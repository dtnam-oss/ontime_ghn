# Brainstorm — Redesign layout dashboard + bộ lọc toàn cục

**Date:** 2026-05-30 · **Type:** FE refactor (dashboard hiện có) · **Status:** Design approved → plan

## Problem
Dashboard hiện dùng 6 tab + đọc các bảng đã tổng hợp (không lọc lại được). Yêu cầu:
- 1 trang cuộn liền mạch (bỏ tab/phân trang)
- Bộ lọc toàn cục: Loại, Xe (BKS), Tài xế, Tuyến, Khoảng ngày — **multi-select**
- Sticky top bar; lưới responsive 2 cột

## Quyết định chốt
| # | Vấn đề | Chốt |
|---|---|---|
| 1 | Nguồn dữ liệu FE | **Chỉ `agg_trip`** (chi tiết/chuyến) → FE tự gom + lọc client-side |
| 2 | Cột thêm vào agg_trip | **`Đúng giờ` (ontimeCount) + `Trễ` (lateCount)** → pool chính xác, dựng stacked bar |
| 3 | Các bảng agg_* khác | **BỎ** (chỉ ghi agg_trip + _meta). Telegram vẫn build từ trips in-memory |
| 4 | Bộ lọc | 5 chiều, multi-select, sticky top bar, rỗng=tất cả, có Reset + đếm "N chuyến khớp" |
| 5 | Layout | Lưới responsive: KPI full · Trend full · (Bar Loại ½ + Donut check-in ½) · Heatmap full · Top full(3 sub) · Vehicle full |
| 6 | Donut check-in tổng | **Có** (lấp nửa cột cạnh bar Loại) |

## Kiến trúc sau redesign
```
agg_trip (sheet/fixture) ──> data.js fetch ──> parseTrips ──> filterTrips(filters)
                                                                   │
   ┌───────────────────────────────────────────────────────────────┘
   ▼ (useMemo, ~1396 dòng, tức thì)
 kpi · daily(+trend) · byType · checkinDonut · heatmap · top · vehicle  ──> charts
```

## Thay đổi code
**Sync (backend):**
- `metrics.js`: `buildTrip` thêm 2 cột (ontimeCount, lateCount); **bỏ** buildDaily/Type/Heatmap/Top/Vehicle; `aggregatesFromTrips` chỉ trả `agg_trip`.
- `index.js`: chỉ ghi `agg_trip` + `_meta`.
- `telegram.js`: KHÔNG đổi (đã build từ trips).
- `metrics.test.js`: rút gọn theo agg_trip; `dump-fixture.js`: fixture = `{ agg_trip }`.

**FE:**
- `data.js`: chỉ fetch `agg_trip`.
- `transform.js`: rewrite — `parseTrips`, `filterTrips(trips, filters)`, builders nhận filtered trips (kpi/daily/type/checkin/heatmap/top/vehicle).
- `App.jsx`: bỏ tabs → lưới CSS + `<FilterBar>` sticky + state filters.
- Thêm `FilterBar.jsx` (chip Loại + combobox search Xe/Tài xế/Tuyến + date range), `useFilters` hook, `CheckinDonut.jsx`.
- Chart components giữ nguyên (đổi nguồn props).
- `transform test` cập nhật; regenerate fixture.

## Risks
- Combobox hàng trăm BKS/tài xế → cần search + render-khi-mở (tránh lib nặng, tự code đơn giản / `<datalist>`).
- Filter rỗng-kết-quả → hiện "không có dữ liệu khớp" thay vì chart trắng.
- Rounding: dùng count thật (ontimeCount/lateCount) → pool chính xác, không lệch.
- Bundle: không thêm lib filter nặng.

## Success criteria
- 1 trang cuộn, không tab; 5 bộ lọc multi-select hoạt động đồng thời lên mọi chart.
- Số liệu (không lọc) vẫn khớp nguồn như trước.
- agg_trip có 2 cột count; sync chỉ ghi agg_trip + _meta; Telegram vẫn chạy.

## Unresolved
- Quick presets ngày cụ thể (Hôm nay / 7 ngày / 30 ngày / Tất cả) — chốt khi làm.
- Có cần nhớ bộ lọc qua URL query (share link) không? (mặc định: không — YAGNI).

# Phase 5 — FE redesign: 1 trang cuộn + bộ lọc toàn cục

**Priority:** P5 · **Status:** pending · **Depends:** P4 (agg_trip 2 cột count)
**Thay thế:** layout tab ở [phase-02-dashboard.md](./phase-02-dashboard.md)

## Overview
Bỏ 6 tab → 1 trang cuộn liền mạch, lưới responsive, sticky filter bar 5 chiều
(multi-select). FE đọc 1 bảng `agg_trip`, tự gom + lọc client-side.

## Context
- Thiết kế: [brainstorm-redesign-layout.md](./brainstorm-redesign-layout.md)
- Component chart hiện có (giữ): KpiCards, TrendChart, TypeBar, Heatmap, TopTables, VehicleCheckin.

## Key insights
- 1 nguồn `agg_trip` → `parseTrips` → `filterTrips(filters)` → builders (useMemo). ~1396 dòng → tức thì.
- Bộ lọc rỗng = không ràng buộc. Mọi chart phản ứng đồng thời.
- Count thật từ agg_trip → pool chính xác; `notChecked = stops − checkedIn`.
- Combobox hàng trăm BKS/tài xế: tự code đơn giản (input search + list lọc theo từ khoá, render khi mở) — KHÔNG thêm lib nặng.

## Files
- `web/src/lib/data.js` — chỉ fetch `agg_trip` (live) / fixture.
- `web/src/lib/transform.js` — **rewrite**: `parseTrips(values)`, `filterTrips(trips,f)`, `options(trips)` (distinct cho dropdown), builders: `kpi/daily/typeBar/checkin/heatmap/top/vehicle` nhận filtered trips.
- `web/src/hooks/useFilters.js` — state {loai[],xe[],taixe[],tuyen[],from,to} + setters + reset.
- `web/src/components/FilterBar.jsx` — sticky bar: chip Loại + 3 MultiCombo (Xe/Tài xế/Tuyến) + date range/preset + Reset + đếm khớp.
- `web/src/components/MultiCombo.jsx` — combobox search multi-select tái dùng (DRY).
- `web/src/components/CheckinDonut.jsx` — donut đúng giờ/trễ/chưa (recharts PieChart).
- `web/src/App.jsx` — bỏ tabs → lưới CSS; FilterBar + state; render mọi section.
- `web/src/styles.css` — grid responsive (span full / half), sticky filter bar.
- `web/test/transform.test.js` — cập nhật: parse/filter + builders trên fixture mới.
- Chart components cũ: giữ nguyên, chỉ nhận props từ builders (đã có dạng tương thích).

## Implementation steps
1. `parseTrips(values)`: 2D agg_trip → `[{trip,date,type,bks,driver,route,stops,checkedIn,ontimeCount,lateCount}]` (theo thứ tự cột Phase 4).
2. `filterTrips(trips,f)`: AND các điều kiện; mảng rỗng/null = bỏ qua chiều đó; ngày `from<=date<=to` (rỗng=bỏ).
3. `options(trips)`: distinct sorted cho loai/xe/taixe/tuyen + min/max ngày.
4. Builders (pure) tính từ filtered trips — port logic pooled từ metrics cũ:
   - `kpi`: overall pooled + tổng chuyến + theo loại.
   - `daily`: group ngày → pooled + trend (linreg).
   - `typeBar`: group loại.
   - `checkin`: tổng đúng giờ/trễ/notChecked → donut.
   - `heatmap`: route×ngày pooled.
   - `top`: group route/driver/bks → pooled, sort tăng, topN (giữ tiebreak).
   - `vehicle`: group bks → tổng counts (dùng cho stacked bar, đã có period? giờ period = bộ lọc ngày toàn cục → bỏ dropdown nội bộ).
5. `useFilters` + `FilterBar` + `MultiCombo` (input + dropdown lọc theo search, chip giá trị đã chọn, clear).
6. `App.jsx`: `const f = useFilters(); const ft = filterTrips(trips,f)` (useMemo); truyền vào builders; render grid. Hiện "N chuyến khớp"; nếu ft rỗng → mỗi card báo "Không có dữ liệu khớp".
7. CSS grid: card `.full`(span 2) / `.half`(span 1); mobile 1 cột. Sticky `.filterbar`.
8. `npm test` (transform) + `npm run build` + visual check 1 trang + thử lọc.

## Layout
KPI(full) · Trend(full) · [TypeBar(half) + CheckinDonut(half)] · Heatmap(full) · Top(full,3 sub) · Vehicle(full).

## Todo — DONE
- [x] data.js fetch agg_trip
- [x] transform.js: parseTrips/filterTrips/options + builders (kpi/daily/type/checkin/heatmap/top/vehicle)
- [x] useFilters hook
- [x] MultiCombo (details, search, multi, chip)
- [x] FilterBar sticky (5 chiều + presets ngày + Reset + đếm)
- [x] CheckinDonut
- [x] App.jsx bỏ tabs → grid + filter wiring + empty state
- [x] styles.css grid responsive + sticky + combobox
- [x] transform test 6/6 + build OK + visual verified (filter Nội thành → 520 chuyến, mọi chart cập nhật)
- [ ] Deploy tĩnh (chờ API key)

## Success criteria
- 1 trang cuộn, không tab; 5 bộ lọc multi-select áp đồng thời lên mọi chart.
- Không lọc → số khớp nguồn như trước (overall ~87.6%...).
- Lọc 1 loại/1 xe → mọi chart cập nhật đúng; rỗng-kết-quả không vỡ.
- `npm run build` OK; bundle không phình thêm lib.

## Risks
- Đồng bộ index cột với Phase 4 (parseTrips).
- Combobox nhiều mục → render khi mở + giới hạn list hiển thị (vd 50 + search).
- VehicleCheckin: bỏ dropdown period nội bộ (đã thay bằng filter ngày toàn cục) — tránh 2 nơi điều khiển.

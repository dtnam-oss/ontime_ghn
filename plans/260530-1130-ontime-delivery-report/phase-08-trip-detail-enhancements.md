# Phase 8 — Tinh chỉnh chi tiết hành trình (mốc giờ + reorder + heatmap row-click)

**Priority:** P8 · **Status:** pending · **Depends:** P6, P7

## Overview
3 tinh chỉnh: (a) `agg_stops` thêm 3 cột mốc giờ → bảng mốc giờ trong TripDetail;
(b) heatmap click tên tuyến (cả dòng) drill cả tuyến; (c) reorder TripDetail lên trước VehicleCheckin.

## Quyết định (chốt)
- Hiển thị 5 mốc giờ = **bảng điểm** (thay timeline), tô màu dòng theo trạng thái; **giữ** mini-bar độ trễ.
- Heatmap: **cả hai** — tên tuyến → drill route (mọi ngày); ô số → route+ngày (giữ).
- Thứ tự: Heatmap → Top → **Chi tiết** → Check-in theo xe.

## Files
**Sync:**
- `sync/src/constants.js` — `COL.CHECKOUT_PLAN=16, CHECKOUT_ACTUAL=17, SEAL=18`.
- `sync/src/metrics.js` — `buildStops` thêm 3 cột (CO dự kiến, CO thực tế, Đóng seal) — đặt trước cột `Trễ (phút)`.
- `sync/test/metrics.test.js` — header agg_stops = 14 cột.
- `sync/scripts/dump-fixture.js` — (không đổi logic) regenerate fixture.

**FE:**
- `web/src/lib/transform.js` — `parseStops`: thêm `checkoutPlan/checkoutActual/seal`; `delay` lùi về index cuối (13).
- `web/src/components/TripDetail.jsx` — thay `<ol.timeline>` bằng `<table.stop-table>`:
  cột `Tên điểm | Trạng thái | CI dự kiến | CI thực tế | CO dự kiến | CO thực tế | Seal | Trễ`,
  tô nền dòng theo trạng thái (xanh/cam/xám nhạt). Giữ delay BarChart bên dưới.
- `web/src/components/Heatmap.jsx` — sticky-col tên tuyến: `onClick → onDrill({kind:'route', value:r.route})` (không date), cursor pointer.
- `web/src/App.jsx` — di chuyển `<TripDetail>` lên trước `<VehicleCheckin>`.
- `web/src/styles.css` — `.stop-table` (font nhỏ, scroll-x nếu hẹp); hàng tô màu trạng thái.

## Implementation steps
1. constants: +3 COL.
2. `buildStops`: header `[…,'CI dự kiến','CI thực tế','CO dự kiến','CO thực tế','Đóng seal','Trễ (phút)']`;
   mỗi dòng thêm `r[COL.CHECKOUT_PLAN], r[COL.CHECKOUT_ACTUAL], r[COL.SEAL]` trước `delay`.
3. metrics.test: sửa assert 11→14 cột + tên cột mới; `npm test`.
4. dump-fixture: `node scripts/dump-fixture.js` regenerate.
5. `parseStops`: map cột mới (CI 8/9, CO 10/11, seal 12, delay 13).
6. `TripDetail`: bảng điểm + helper `fmt(t)` rút năm ("MM-DD HH:MM" / trống → "—"/"(chưa)"); màu dòng theo `statusColor`. Giữ BarData/delay chart.
7. `Heatmap`: thêm onClick sticky-col.
8. `App`: reorder.
9. `styles.css`: `.stop-table`.
10. transform test (parseStops field mới) + build + visual.

## Todo — DONE
- [x] constants +3 COL (CHECKOUT_PLAN/ACTUAL, SEAL)
- [x] buildStops +3 cột → agg_stops 14 cột; test 8/8; regenerate fixture
- [x] parseStops field mới (ciPlan/ciActual/coPlan/coActual/seal)
- [x] TripDetail bảng 5 mốc giờ tô màu trạng thái (giữ delay bar)
- [x] Heatmap row-label (tên tuyến) drill cả tuyến; ô giữ route+ngày
- [x] App reorder TripDetail trước VehicleCheckin
- [x] styles .stop-table + transform test 7/7 + build OK + visual verified (BL_03 7 chuyến)

## Success criteria
- agg_stops 14 cột; FE bảng hiện đủ 5 mốc giờ/điểm, tô màu trạng thái.
- Click tên tuyến heatmap → drill cả tuyến; click ô → tuyến+ngày (vẫn chạy).
- TripDetail nằm giữa Top và Check-in theo xe.
- Test/charts cũ không hồi quy.

## Risks
- Bảng 8 cột datetime rộng → rút năm + font nhỏ + overflow-x scroll.
- Đổi thứ tự cột agg_stops → parseStops phải khớp index mới.

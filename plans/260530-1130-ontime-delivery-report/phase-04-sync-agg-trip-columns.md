# Phase 4 — Sync: agg_trip thêm cột count + bỏ bảng agg thừa

**Priority:** P4 · **Status:** pending · **Depends:** P1 (đã xong)

## Overview
FE redesign chỉ cần `agg_trip`. Sửa sync: thêm 2 cột count vào agg_trip, bỏ 5
bảng agg còn lại, đơn giản hoá metrics. Telegram KHÔNG đổi (build từ trips).

## Context
- Thiết kế: [brainstorm-redesign-layout.md](./brainstorm-redesign-layout.md)
- Hiện trạng: [phase-01-etl-metrics.md](./phase-01-etl-metrics.md)
- `agg_trip` hiện: `Mã chuyến, Ngày, Loại, BKS, Tài xế, Mã lộ trình, Điểm dừng, Đã check-in, Ontime%`

## Key insights
- FE pool chính xác cần count thật → thêm `Đúng giờ`(ontimeCount) + `Trễ`(lateCount).
- `notChecked = Điểm dừng − Đã check-in` (FE tự tính, không cần cột).
- Bỏ buildDaily/Type/Heatmap/Top/Vehicle → ít code, ít ghi sheet. Logic gom chuyển sang FE `transform.js`.
- `telegram.js` dùng trips trực tiếp → không ảnh hưởng.

## Files to modify
- `sync/src/metrics.js` — `buildTrip` +2 cột; xoá 5 builder + helper chỉ phục vụ chúng (`pooled` giữ nếu telegram… không, telegram tự có; kiểm tra dùng chung). `aggregatesFromTrips` chỉ trả `{ [TABS.TRIP]: buildTrip(trips) }`.
- `sync/src/index.js` — vòng lặp ghi chỉ còn `agg_trip` (+ `_meta`). (writeTab giữ nguyên.)
- `sync/test/metrics.test.js` — bỏ assert agg_daily/type/heatmap/top/vehicle; thêm assert 2 cột count + `ontimeCount+lateCount ≤ checkedIn`.
- `sync/scripts/dump-fixture.js` — fixture chỉ `{ agg_trip }`.
- `sync/src/constants.js` — có thể gọn TABS (giữ TRIP, META; bỏ tên thừa hoặc để lại vô hại).

## Implementation steps
1. `buildTrip`: header thêm `'Đúng giờ', 'Trễ'`; mỗi dòng thêm `t.ontimeCount, t.lateCount` (đã có sẵn trong groupTrips).
   Thứ tự cột mới: `… Điểm dừng, Đã check-in, Đúng giờ, Trễ, Ontime%` (count cạnh nhau).
2. `aggregatesFromTrips(trips)` → chỉ trả agg_trip.
3. Xoá buildDaily/buildType/buildHeatmap/topLowest/buildTop/buildVehicle + import không dùng. Giữ `groupTrips`, `round2`, `pct`. (`pooled`,`trendLine`,`groupBy` → xoá nếu không còn dùng.)
4. `index.js`: loop `Object.entries(aggs)` giờ chỉ 1 tab — vẫn chạy đúng.
5. Cập nhật test + chạy `npm test`.
6. `node scripts/dump-fixture.js` → regenerate `web/src/fixtures/sample.json` (chỉ agg_trip, có 2 cột mới).

## Todo — DONE
- [x] buildTrip +2 cột (Đúng giờ, Trễ) → agg_trip 11 cột
- [x] aggregatesFromTrips chỉ agg_trip
- [x] Xoá 5 builder + helper thừa (metrics.js gọn còn groupTrips/buildTrip)
- [x] Cập nhật metrics.test.js (6/6 pass: count, ≤ checkedIn, % đúng)
- [x] dump-fixture → fixture {agg_trip:1396}
- [x] telegram test vẫn 5/5 (không ảnh hưởng)

## Success criteria
- `agg_trip` có 11 cột (thêm Đúng giờ, Trễ); test pass.
- Sync chỉ ghi `agg_trip` + `_meta`.
- `npm run sync` (có cred) chạy không lỗi; Telegram vẫn build báo cáo đúng.

## Risks
- Đổi thứ tự cột agg_trip → FE phải dùng đúng index mới (đồng bộ với Phase 5 `parseTrips`). Ghi rõ thứ tự cột ở 1 nơi.
- Quên regenerate fixture → FE dev lệch. Bắt buộc chạy dump-fixture sau khi đổi.

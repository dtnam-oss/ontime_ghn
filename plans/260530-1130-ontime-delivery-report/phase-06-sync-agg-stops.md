# Phase 6 — Sync: thêm bảng agg_stops (per-điểm + độ trễ)

**Priority:** P6 · **Status:** pending · **Depends:** P4

## Overview
Sync xuất thêm tab `agg_stops` (chi tiết từng điểm dừng) để FE dựng timeline + độ trễ.
Telegram & agg_trip KHÔNG đổi.

## Context
- Thiết kế: [brainstorm-trip-detail.md](./brainstorm-trip-detail.md)
- Source `Chi tiết`: cột 14=Lộ trình(tên điểm), 15=check-in dự kiến, 16=check-in thực tế, 20=Tình trạng check in (0-based: 13,14,15,19).

## Key insights
- 1 dòng source = 1 điểm → `agg_stops` ~ pass-through cột cần thiết (~5360 dòng).
- `Trễ(phút)` = thực tế − dự kiến (parse "YYYY-MM-DD H:MM" bằng UTC để triệt tz); >0 mới tính, trống/âm/lỗi → '' hoặc 0.
- Giữ tên điểm nguyên (có tiền tố "(1)…" = thứ tự).

## Files
- `sync/src/constants.js` — thêm `COL.CHECKIN_PLAN=14`, `COL.CHECKIN_ACTUAL=15`; `TABS.STOPS='agg_stops'`.
- `sync/src/metrics.js` — `parseDateTime(s)`→ms|null; `buildStops(rows)`.
- `sync/src/index.js` — ghi thêm `agg_stops` (writeTab).
- `sync/scripts/dump-fixture.js` — fixture thêm `agg_stops`.
- `sync/test/metrics.test.js` — test buildStops.

## Implementation steps
1. `constants`: thêm 2 COL giờ + `TABS.STOPS`.
2. `parseDateTime(s)`: regex `(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2}):(\d{2})` → `Date.UTC(...)` ms; không khớp → null.
3. `buildStops(rows)`:
   - header: `['Mã chuyến','Ngày','BKS','Tài xế','Loại','Mã lộ trình','Tên điểm','Trạng thái','Giờ dự kiến','Giờ thực tế','Trễ (phút)']`
   - mỗi row source có Mã chuyến → 1 dòng:
     `delay = (a=parseDateTime(actual), p=parseDateTime(plan)); a&&p&&a>p ? round((a-p)/60000) : (actual? 0 : '')`
     (actual trống = chưa check-in → delay '').
   - giữ thứ tự gốc (source đã theo trình tự điểm trong chuyến).
4. `index.js`: `const aggs = aggregatesFromTrips(trips); aggs[TABS.STOPS] = buildStops(rows);` → vòng writeTab ghi cả 2.
5. `dump-fixture.js`: dùng `buildAggregates` + `buildStops` → fixture `{ agg_trip, agg_stops }`.
6. Test: cột header đúng 11; số dòng agg_stops = số dòng source có Mã chuyến; delay ≥ 0 hoặc ''; điểm "đúng giờ" → delay 0/nhỏ; điểm trễ → delay > 0 (spot-check vài dòng).

## Todo — DONE
- [x] constants: COL.CHECKIN_PLAN/ACTUAL + TABS.STOPS (gọn TABS)
- [x] parseDateTime (UTC) + buildStops (delay phút)
- [x] index.js ghi agg_stops (writeTab tự nới grid)
- [x] dump-fixture thêm agg_stops
- [x] metrics.test buildStops (8/8 pass) — telegram vẫn 5/5
- [x] regenerate fixture {agg_trip:1396, agg_stops:5360}

## Success criteria
- `agg_stops` 11 cột, ~5360 dòng, delay khớp hiệu giờ.
- agg_trip + telegram không đổi; `npm run sync` ghi 2 bảng (+_meta).

## Risks
- Định dạng giờ khác lạ → parse trả null → delay ''; không vỡ.
- Source đổi vị trí cột giờ → sửa COL 1 nơi.

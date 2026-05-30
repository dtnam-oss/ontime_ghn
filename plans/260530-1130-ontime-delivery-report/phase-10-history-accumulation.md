# Phase 10 — Tích lũy lịch sử (raw private + window-replace + retention)

**Priority:** P10 · **Status:** pending · **Depends:** P6 (agg_stops), P8 (cột mốc giờ)

## Overview
Chuyển sync từ ghi đè 7 ngày → tích lũy toàn bộ lịch sử vào sheet `raw` private, tính
agg từ lịch sử. Giữ source = chân lý cho cửa sổ 7 ngày của nó.

## Context
- Thiết kế: [brainstorm-data-history.md](./brainstorm-data-history.md)
- Hiện trạng sync: [phase-01](./phase-01-etl-metrics.md) (overwrite), buildStops [phase-06](./phase-06-sync-agg-stops.md)/[phase-08](./phase-08-trip-detail-enhancements.md).

## Quyết định
- `raw` (sheet private mới, layout 20 cột source) = lịch sử đầy đủ, cap `RETENTION_DAYS`(540).
- Merge **window-replace**. agg_trip = full; agg_stops = cửa sổ `STOPS_WINDOW_DAYS`(90).

## Files
**Sync:**
- `sync/src/constants.js` — `TABS.RAW='raw'`; (config qua env).
- `sync/src/history.js` (mới) — `mergeHistory(hist, src, {today, retentionDays})`, `isoMinusDays`.
- `sync/src/metrics.js` — `buildStops(rows, { since })` thêm filter ngày ≥ since.
- `sync/src/sheets.js` — `writeTab` nhận `spreadsheetId` (generalize cho raw + backend).
- `sync/src/index.js` — pipeline mới (đọc source+raw → merge → ghi raw → agg → backend → telegram).
- `sync/.env.example` — thêm `RAW_SHEET_ID`, `RETENTION_DAYS`, `STOPS_WINDOW_DAYS`.
- `.github/workflows/sync.yml` — env + secret `RAW_SHEET_ID`; cân nhắc `TZ: Asia/Ho_Chi_Minh`.
- `sync/test/history.test.js` (mới) — window-replace + retention + cập nhật chuyến.

**FE:**
- `web/src/components/TripDetail.jsx` — nếu `selected && stops.length===0` → báo "Chi tiết điểm chỉ có cho ~90 ngày gần nhất".

**Docs:** `README.md` — mục tạo RAW sheet private + share Editor SA + secret.

## Implementation steps
1. `history.js`:
   - `isoMinusDays(iso, n)` → "YYYY-MM-DD" (dùng Date — sync là node thường, Date OK).
   - `mergeHistory(hist, src, {today, retentionDays})`: cutoff; srcDates=set(parseDate); 
     `kept = hist.filter(d≥cutoff && !srcDates.has(d))`; `fresh = src.filter(d≥cutoff)`; trả `[...kept,...fresh]`.
2. `metrics.buildStops(rows,{since})`: bỏ qua dòng `parseDate < since`.
3. `sheets.writeTab(spreadsheetId, meta, tab, values)` (refactor; getTabsMeta theo từng sheet).
4. `index.js`:
   - đọc `'Chi tiết'!A1:T` (gồm header) → header + srcRows.
   - `ensureTab(RAW,'raw')`; đọc `'raw'!A2:T` → histRows.
   - `merged = mergeHistory(...)`; `writeTab(RAW, rawMeta, 'raw', [header, ...merged])`.
   - `trips = groupTrips(merged)`; backend: agg_trip=buildTrip(trips), agg_stops=buildStops(merged,{since: today−STOPS_WINDOW}).
   - `_meta`; telegram(merged trips, scope).
5. workflow/env + README.
6. Tests: history.test (giữ ngày cũ, thay cửa sổ, cap retention); metrics buildStops since; chạy `npm test`.
7. FE empty-stops notice; build.

## Todo — DONE
- [x] history.js (mergeHistory window-replace + retention + isoMinusDays)
- [x] buildStops since-filter (cửa sổ agg_stops)
- [x] writeTab nhận spreadsheetId (dùng cho raw + backend)
- [x] index.js pipeline tích lũy: source+raw → merge → ghi raw private → agg_trip(full)+agg_stops(window) → backend → telegram
- [x] env/workflow (TZ Asia/Ho_Chi_Minh + RAW_SHEET_ID/RETENTION/STOPS_WINDOW) + README mục RAW sheet
- [x] history.test 5/5 + metrics 9/9 (+since) + telegram 5/5 + FE 7/7 + build OK
- [x] FE TripDetail báo chuyến ngoài cửa sổ ~90 ngày
- [ ] **E2E thật** (cần tạo RAW sheet private + secret — bước cloud của user)

## Success criteria
- Mô phỏng 2 lần sync (2 tập ngày khác nhau) → raw giữ cả 2 (test).
- Chuyến đang chạy cập nhật khi source đổi (window-replace) — test.
- Cap retention loại ngày quá cũ — test. agg_stops chỉ ~90 ngày.
- Backend agg_trip/agg_stops đúng; telegram/charts không hồi quy.

## Risks
- Full-rewrite raw nặng dần → theo dõi; hạ retention nếu chậm/gần trần.
- "today" UTC lệch ngày → set TZ workflow.
- Lần đầu raw rỗng → merged = source (OK).

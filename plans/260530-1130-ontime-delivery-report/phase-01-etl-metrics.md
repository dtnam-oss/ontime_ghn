# Phase 1 — Node sync + metrics → backend sheet + GH Actions cron

**Priority:** P1 · **Status:** pending · **Depends:** P0

## Overview
Node script: đọc source `Chi tiết` → gom theo `Mã chuyến` → tính 6 nhóm `agg_*`
→ ghi backend sheet. Chạy định kỳ bằng GitHub Actions (cron + dispatch).

## Key insights
- 1 dòng source = 1 điểm dừng; gom theo `Mã chuyến` = 1 hành trình.
- **Ontime/chuyến = ontimeStops / checkedInStops** (mẫu số = #điểm đã check-in).
  Chưa check-in điểm nào → loại khỏi mẫu số (tránh /0).
- Ngày = phần đầu `"2026-05-29 - Thứ 6"` (split `' - '`).
- googleapis: `spreadsheets.values.get` (đọc source) + `values.update/clear`
  (ghi backend, batch — KHÔNG ghi từng ô).
- Precompute → ghi backend → FE chỉ đọc kết quả (đúng yêu cầu "khỏi tính mỗi lần load").

## Files
- `/sync/src/sheets.js` — auth SA (JWT từ `GOOGLE_SA_JSON`), `readSheet`, `writeSheet`
- `/sync/src/metrics.js` — `groupTrips`, build các `agg_*` (tách file nếu >200 dòng)
- `/sync/src/index.js` — orchestrate
- `/.github/workflows/sync.yml` — cron + workflow_dispatch

## Implementation steps
1. **`sheets.js`**: tạo `google.auth.JWT` từ `GOOGLE_SA_JSON` (scope spreadsheets).
   `readSheet(id, range)` → 2D array; `writeSheet(id, tab, rows)` = clear + update.
2. **`groupTrips(rows)`** → `Map<Mã chuyến,{date,type,bks,driver,route,stops:[]}>`;
   mỗi chuyến: `checkedIn = stops.filter(isCheckedIn).length`,
   `ontime = checkedIn ? ontimeCount/checkedIn : null`.
   Matchers (DRY): `isOntime=/đúng giờ/i`, `isLate=/trễ/i`, `isCheckedIn=non-empty`.
3. **agg_trip**: 1 dòng/chuyến (mã, ngày, loại, bks, tài xế, mã lộ trình, điểm dừng, đã check-in, ontime%).
4. **agg_daily**: gom theo ngày → ontime TB + tổng chuyến; cột `trend` = hồi quy tuyến tính theo index ngày.
5. **agg_type**: gom 3 Loại → ontime TB + số chuyến.
6. **agg_heatmap**: pivot Mã lộ trình × Ngày = ontime TB (hàng đầu = list ngày).
7. **agg_top**: gom theo Mã lộ trình / Tài xế / BKS → sort ontime tăng dần →
   `top_n` (mặc định 10) thấp nhất + số chuyến.
8. **agg_vehicle_checkin**: gom theo BKS → đếm stop theo nhóm trạng thái
   (đúng giờ / trễ / chưa check-in), giữ trường ngày để FE lọc giai đoạn.
9. **`index.js`**: read source → groupTrips → build tất cả agg → writeSheet từng tab
   → gọi telegram (P3). Log số dòng mỗi tab.
10. **`sync.yml`**: `on: schedule(cron) + workflow_dispatch`; setup-node; `npm ci`;
    `node src/index.js`; env từ Secrets. (Manual trigger = nút Run workflow.)

## Todo
- [x] `sheets.js` auth SA + read/write + getTabsMeta/addTab/resizeTab (grid sizing)
- [x] `groupTrips` + ontime/chuyến = đúng giờ / đã-check-in
- [x] **Gộp STOP-POOLED** (chốt với user) — khớp tab "Tổng quan" nguồn
- [x] build agg_trip / agg_daily(+trend) / agg_type
- [x] build agg_heatmap / agg_top(tiebreak) / agg_vehicle_checkin
- [x] `index.js` orchestrate + writeTab (auto-resize grid, quote tab name)
- [x] `sync.yml` cron(07:00 VN) + workflow_dispatch(scope) + secrets
- [x] Test offline trên CSV thật (9/9 pass) — số khớp "Tổng quan" nguồn chính xác
- [x] code-reviewer pass → fix grid-size (agg_trip 1396 dòng > 1000), quoting, tiebreak
- [ ] **CHƯA chạy end-to-end thật** (cần service account của Phase 0 setup)

## Validation đã khớp nguồn
22/05=89.46 · 24/05=92.53 · HN_LAY2KHO_61=26.09 · HN_GXT1_14=44.44 · LD_03=41.46 (đều khớp Tổng quan).

## Success criteria
- Chạy `node src/index.js` local (env) → backend sheet đủ 6 tab `agg_*` đúng số liệu
- GH Actions cron chạy tự động + dispatch tay đều ghi thành công
- Chuyến "Đang chạy" 1/5 đã check-in & đúng giờ → ontime 100% (khớp source)

## Risks
- Sai chỉ số cột nếu source đổi layout → tập trung map cột 1 nơi (DRY).
- metrics.js phình >200 dòng → tách `metrics-*.js` theo từng agg.
- Rate limit Sheets API khi ghi nhiều → batch `values.update`, ghi 1 lần/tab.

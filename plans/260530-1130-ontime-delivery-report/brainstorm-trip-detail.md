# Brainstorm — Chi tiết hành trình chuyến (drill-down)

**Date:** 2026-05-30 · **Type:** Feature (dashboard) · **Status:** Approved → plan

## Problem
User cần xem chi tiết 1 chuyến: đi qua những điểm nào, ontime rớt ở điểm nào.
Dashboard hiện chỉ có mức chuyến (`agg_trip`), KHÔNG có dữ liệu từng điểm dừng.

## Quyết định chốt
| # | Vấn đề | Chốt |
|---|---|---|
| 1 | Dữ liệu điểm dừng | Sync thêm tab **`agg_stops`** (per-điểm) + cột `Trễ (phút)` |
| 2 | Entry point | **Drill từ Heatmap (ô tuyến×ngày) & Top (dòng)** → danh sách chuyến → chọn |
| 3 | Thông tin/điểm | Tên điểm + trạng thái + giờ dự kiến/thực tế + **độ trễ (phút)** |
| 4 | Trình bày | **Timeline dọc + mini-bar độ trễ** |
| 5 | Vị trí | Section **inline cuối trang** |
| 6 | Tải dữ liệu | `agg_stops` ~5360 dòng → **lazy load** khi drill lần đầu |

## agg_stops (cột)
`Mã chuyến, Ngày, BKS, Tài xế, Loại, Mã lộ trình, Tên điểm(Lộ trình), Trạng thái(Tình trạng check in), Giờ dự kiến(check-in dự kiến), Giờ thực tế(check-in thực tế), Trễ(phút)`
- `Trễ(phút)` = sync tính = thực tế − dự kiến (>0 mới tính; trống/âm = 0/blank).

## Luồng
Click ô Heatmap (route,date) / dòng Top (route|driver|bks) → tập chuyến khớp (trong bộ
lọc hiện tại), xấu nhất lên đầu, tự chọn chuyến xấu nhất → TripDetail: timeline điểm +
mini-bar độ trễ. Màu: xanh=đúng giờ, cam=trễ, xám=chưa check-in.

## Thay đổi code
**Sync:** `metrics.js` thêm `buildStops(rows)` + `parseDateTime`/delay; `index.js`+`dump-fixture`
ghi thêm `agg_stops`; `constants` thêm COL giờ + TABS.STOPS; test thêm.
**FE:** `data.js` `loadStops()` lazy; `transform.js` `parseStops/tripsForDrill/stopsForTrip`;
`TripDetail.jsx`; `Heatmap`/`TopTables` thêm `onDrill`; `App.jsx` state drill + render.

## Risks
- Parse giờ "YYYY-MM-DD H:MM" → dùng UTC để tính hiệu (triệt tz); lỗi → blank.
- 1 ô heatmap nhiều chuyến (khác BKS) → danh sách xử lý.
- Điểm chưa check-in: giờ thực tế trống → trạng thái "chưa", delay blank.
- Payload agg_stops lớn → lazy.

## Success criteria
- Click heatmap/Top → ra danh sách chuyến → timeline + bar độ trễ đúng điểm rớt.
- agg_stops sinh đúng (delay khớp giờ thực-dự kiến); lazy load.
- Không ảnh hưởng charts/telegram hiện có.

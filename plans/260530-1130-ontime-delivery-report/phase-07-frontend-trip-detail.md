# Phase 7 — FE: chi tiết hành trình chuyến (drill + timeline)

**Priority:** P7 · **Status:** pending · **Depends:** P5, P6

## Overview
Drill từ Heatmap/Top → danh sách chuyến → TripDetail (timeline điểm + mini-bar độ trễ),
inline cuối trang. Lazy load `agg_stops`.

## Context
- Thiết kế: [brainstorm-trip-detail.md](./brainstorm-trip-detail.md)
- FE hiện: 1 trang cuộn + filter ([phase-05](./phase-05-frontend-redesign-filters.md)).

## Key insights
- `agg_stops` chỉ tải khi drill lần đầu (cache) → load đầu nhẹ.
- Drill object: `{ kind:'route'|'driver'|'bks', value, date? }` (date chỉ khi click heatmap cell).
- Danh sách chuyến = filteredTrips ∩ drill; tự chọn chuyến ontime thấp nhất.

## Files
- `web/src/lib/data.js` — `loadStops()` lazy (mock: `sample.agg_stops`).
- `web/src/lib/transform.js` — `parseStops(values)`; `tripsForDrill(trips, drill)`; `stopsForTrip(stops, tripId)`.
- `web/src/components/TripDetail.jsx` — list chuyến + timeline + delay bar (recharts BarChart layout="vertical").
- `web/src/components/Heatmap.jsx` — thêm `onDrill(route,date)` click ô có dữ liệu.
- `web/src/components/TopTables.jsx` — thêm `onDrill(kind,value)` click dòng.
- `web/src/App.jsx` — state `drill` + `selectedTrip` + stops (lazy) + render TripDetail.
- `web/test/transform.test.js` — test parseStops/tripsForDrill/stopsForTrip.

## Implementation steps
1. `parseStops(values)` → `[{trip,date,bks,driver,type,route,name,status,plan,actual,delay}]` (delay: number|'' ).
2. `tripsForDrill(trips, d)`: `trips.filter(t => t[d.kind]===d.value && (!d.date || t.date===d.date))`. (kind ∈ route/driver/bks.)
3. `stopsForTrip(stops, tripId)`: `stops.filter(s=>s.trip===tripId)` (giữ thứ tự).
4. `Heatmap`: ô có val → `onClick={()=>onDrill({kind:'route',value:route,date})}`; con trỏ pointer.
5. `TopTables`: map nhóm→kind (Tuyến→route, Tài xế→driver, BKS→bks); dòng `onClick={()=>onDrill({kind,value:name})}`.
6. `App`:
   - state `drill=null`, `selectedTrip=null`, `stops=null`.
   - `handleDrill(d)`: nếu chưa có stops → `loadStops().then(parseStops)`; set drill; chọn chuyến xấu nhất trong `tripsForDrill(ft,d)`.
   - render `<TripDetail drill matchedTrips stops selectedTrip onSelect/>` ở card full cuối grid (ẩn nếu chưa drill, hiện hint "Click heatmap/Top để xem chi tiết").
7. `TripDetail`:
   - Header chuyến: Mã·BKS·tài xế·tuyến·ngày·ontime%.
   - Trái: bảng danh sách chuyến khớp (click đổi chuyến), xấu nhất đầu.
   - Phải: timeline điểm (màu theo trạng thái) + mini BarChart ngang `delay` theo `name`.
8. Test + `npm run build` + visual (drill → timeline hiển thị điểm trễ).

## Todo — DONE
- [x] data.js loadStops lazy + fixture import động (tách main bundle: 734→583KB)
- [x] transform: parseStops/tripsForDrill(xấu lên đầu)/stopsForTrip
- [x] Heatmap onDrill (click ô) + TopTables onDrill (click dòng)
- [x] TripDetail (list chuyến + timeline màu + delay bar ngang)
- [x] App wiring (drill state + lazy stops + render cuối grid)
- [x] transform test 7/7 + build OK + visual verified (HN_LAYHN_123 → 2 điểm trễ +127/+117′)
- [ ] Deploy tĩnh (chờ API key)

## Success criteria
- Click ô heatmap/dòng Top → danh sách chuyến → timeline + bar độ trễ điểm rớt.
- Lazy load stops (không tải khi chưa drill).
- Charts/filter cũ không hồi quy.

## Risks
- recharts BarChart vertical cho nhãn điểm dài → cắt/tooltip.
- Nhiều chuyến khớp 1 drill → list cuộn, chọn rõ chuyến đang xem (highlight).

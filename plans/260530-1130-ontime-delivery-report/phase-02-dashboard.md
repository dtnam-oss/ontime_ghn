# Phase 2 — FE React/Vite đọc sheet trực tiếp, 6 section, deploy tĩnh

**Priority:** P2 · **Status:** pending · **Depends:** P1 (schema agg_*)

## Overview
Webapp tĩnh React/Vite đọc thẳng các tab `agg_*` của backend sheet qua Sheets API
(API key), render dashboard 6 section. Deploy static (GitHub Pages / Cloudflare Pages).

## Key insights
- Đọc dữ liệu đã precompute → FE nhẹ, không tính lại (đúng mục tiêu pivot).
- Sheets API REST: `GET .../values/{tab}?key={API_KEY}` trả values 2D → parse JSON.
- API key lộ trong bundle → đã restrict referrer ở P0 (mitigation chính).
- Chart: Recharts hoặc Chart.js. Heatmap = bảng tô màu (không cần lib).

## Files
- `/web/src/lib/sheets.js` — `fetchTab(tab)` gọi Sheets API + parse
- `/web/src/lib/transform.js` — values 2D → object dùng cho chart
- `/web/src/components/` — KpiCards, TrendChart, TypeBar, Heatmap, TopTables, VehicleCheckin
- `/web/src/App.jsx` — layout tab + load song song các tab

## Implementation steps
1. **`fetchTab(tab)`**: gọi `values/{tab}` với `VITE_SHEETS_API_KEY` +
   `VITE_BACKEND_SHEET_ID`; cache trong session (1 lần/load).
2. **App load**: `Promise.all` fetch agg_trip/daily/type/heatmap/top/vehicle →
   spinner → render. Hiển thị "cập nhật lúc" (lấy từ ô meta nếu có).
3. **Section 1 — KPI cards**: ontime TB toàn cục, tổng chuyến, 3 thẻ theo Loại.
4. **Section 2 — Xu hướng**: line ontime theo ngày + dataset `trend` (nét đứt).
5. **Section 3 — Theo Loại**: bar 3 loại.
6. **Section 4 — Heatmap**: bảng route×ngày, nền nội suy 0%=đỏ→100%=xanh.
7. **Section 5 — Top thấp nhất**: 3 bảng (tuyến/tài xế/BKS): mã, số chuyến, ontime%.
8. **Section 6 — Check-in theo xe**: stacked bar theo BKS (đúng giờ/trễ/chưa);
   dropdown chọn giai đoạn (ngày/tuần) lọc client-side.
9. **Deploy**: build Vite → static; GitHub Pages (Actions) hoặc Cloudflare Pages.
   Cập nhật referrer của API key = domain deploy.

## Todo
- [x] `fetchTab` (P0) + `data.js` (mock fixture / live sheet) + `transform.js`
- [x] App layout tab + load + spinner + badge "dữ liệu mẫu"
- [x] Section 1 KpiCards (overall pooled từ agg_trip + theo Loại)
- [x] Section 2 TrendChart (line ontime + trend, recharts)
- [x] Section 3 TypeBar
- [x] Section 4 Heatmap (bảng tô màu, sticky header/col)
- [x] Section 5 TopTables (3 bảng)
- [x] Section 6 VehicleCheckin (stacked bar top 15 + lọc giai đoạn)
- [x] Fixture thật từ CSV (`sync/scripts/dump-fixture.js`) → preview offline
- [x] transform test (5/5 pass) + `npm run build` OK
- [x] **Visual check** (puppeteer screenshot 6 tab → `visuals/`) — tất cả render OK
- [ ] **Deploy tĩnh + set referrer** (sau khi có API key Phase 0)

## Visual verified (visuals/)
6 tab đều render đúng số liệu thật: KPI (overall 87.6%, theo loại 81.58/92.58/79.15),
trend line+xu hướng, bar theo loại, heatmap 169 tuyến tô màu, top 3 bảng (khớp nguồn),
stacked bar check-in theo xe + tooltip. (Lưu ý: bar recharts animate ~1.5s.)

## Dùng thử ngay (offline, dữ liệu CSV thật)
`cd web && npm run dev` → mở localhost. Khi có API key: thêm `web/.env` → đọc sheet thật.
Chart: **recharts**. Bundle 733KB (186KB gzip) — code-split sau nếu cần.

## Success criteria
- Mở URL webapp → load đọc backend sheet, render đủ 6 section đúng số liệu
- Không có call tính toán nặng lúc load (chỉ đọc agg_*)
- Responsive ổn, load <2s với dữ liệu hiện tại

## Risks
- CORS / API key sai referrer → fetch fail. Test referrer khớp domain.
- Component phình → tách nhỏ, mỗi file <200 dòng (1 section/file).
- Dữ liệu lộ công khai (đã nêu ở plan) → cân nhắc chặn truy cập webapp nếu cần.

# Phase 9 — TripDetail: fix tràn + highlight điểm trễ

**Priority:** P9 · **Status:** pending · **Depends:** P8 · **Scope:** FE-only

## Overview
Bảng chi tiết đang tràn ngang. Thu gọn danh sách chuyến (bỏ Ngày/BKS), bỏ mini-bar,
highlight inline ô check-in/check-out thực tế khi trễ.

## Quyết định (chốt)
- Trip list trái: chỉ `Mã chuyến | Ontime%` (bỏ Ngày, BKS).
- **Bỏ** mini-bar độ trễ (BarChart).
- Bảng điểm: **bỏ cột "Trễ" riêng**; highlight inline ô **CI thực tế** (>CI dự kiến) và
  **CO thực tế** (>CO dự kiến) → đỏ đậm + `+X′`.
- Cột "Trạng thái" cho xuống dòng + cột trái hẹp → hết tràn (giữ overflow-x phòng hờ).

## Files (FE-only)
- `web/src/components/TripDetail.jsx`
- `web/src/styles.css` (`.stop-table`, `.trip-list`, `.late`)

## Implementation steps
1. **Trip list**: bỏ `<th>Ngày</th><th>BKS</th>` + 2 `<td>` tương ứng; chỉ giữ `Mã chuyến`, `Ontime%`. Thu hẹp `.detail-grid` cột trái (~150px).
2. **Bỏ BarChart**: xoá import recharts + block ResponsiveContainer/BarChart + `barData`.
3. **Helper** `lateMin(plan, actual)` (regex parse "YYYY-MM-DD H:MM" → ms; `a>p ? round((a-p)/60000) : 0`). Tránh DRY: dùng chung với `fmt`.
4. **Bảng điểm** bỏ cột "Trễ"; cell CI thực tế:
   `const dci = lateMin(s.ciPlan, s.ciActual)` → nếu >0: `<td class="late">{fmt(s.ciActual)} +{dci}′</td>` (đỏ đậm), else thường.
   Tương tự CO thực tế với `lateMin(s.coPlan, s.coActual)`.
5. **CSS**: `.late{ color:#c0392b; font-weight:700; }`; `.stop-table td.status{ white-space:normal; }` (cho xuống dòng); cột trái `.detail-grid{ grid-template-columns:150px 1fr }`.
6. Build + visual (drill HN_LAYHN_180 → bảng vừa khung, CO thực tế trễ tô đỏ).

## Todo — DONE
- [x] Trip list bỏ Ngày/BKS (giữ Mã chuyến + Ontime%); cột trái 210px (Ontime% hiện rõ)
- [x] Bỏ mini-bar (BarChart) + import recharts
- [x] lateMin helper (parse UTC, diff phút)
- [x] Bỏ cột Trễ + highlight inline CI/CO thực tế trễ (đỏ đậm + +X′)
- [x] CSS .late + status wrap + cột trái hẹp
- [x] build OK (584KB) + transform test 7/7 + visual verified (hết tràn, đỏ đúng ô)

## Success criteria
- Bảng chi tiết KHÔNG tràn ngang ở khung ~1200px.
- Ô CI/CO thực tế trễ tô đỏ + số phút; điểm đúng giờ bình thường.
- Trip list gọn (Mã chuyến + Ontime%); không còn mini-bar.

## Risks
- Vẫn hẹp trên màn nhỏ → overflow-x scroll dự phòng.
- Parse giờ lỗi → lateMin trả 0 (không highlight nhầm).

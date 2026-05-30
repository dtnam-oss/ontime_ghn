# Phase 0 — Setup repo + service account + secrets + publish sheet

**Priority:** P0 (blocker) · **Status:** pending

## Overview
Dựng monorepo (`/sync` Node, `/web` React), tạo service account + API key,
cấu hình GitHub Secrets, publish backend sheet read-only. Nền cho mọi phase.

## Key insights
- **Sync job** dùng **service account** (đọc source + ghi backend) — không OAuth user.
- **FE tĩnh** đọc backend bằng **API key**; Sheets API key CHỈ đọc được sheet
  "anyone with link → Viewer". Vì vậy backend sheet phải publish read-only.
- Secrets (SA JSON, telegram token) **chỉ ở GitHub Secrets**, không commit.

## Files / tasks to create
- Repo skeleton: `/sync`, `/web`, `/.github/workflows/`
- `/sync/package.json` (googleapis, dotenv), `/web` Vite scaffold
- `.gitignore` (node_modules, .env, *sa*.json, dist)
- `.env.example` (liệt kê biến, không giá trị thật)

## Implementation steps
1. **Google Cloud:** tạo project → bật **Google Sheets API** → tạo
   **service account** → tạo key JSON. Lấy email SA dạng `xxx@xxx.iam.gserviceaccount.com`.
2. **Share quyền:**
   - Source sheet `1a4ECGE9…` → share **Viewer** cho email SA.
   - Backend sheet `1XmTPr…` → share **Editor** cho email SA.
3. **API key:** tạo API key (cùng project), restrict theo **HTTP referrer**
   (domain FE) + restrict API = Sheets API. Dùng cho FE.
4. **Publish backend sheet read-only:** chia sẻ "Anyone with link → Viewer"
   (chỉ backend sheet, chứa `agg_*`; KHÔNG để `_raw` ở đây hoặc ẩn tab nhạy cảm).
5. **GitHub repo + Secrets:**
   - `GOOGLE_SA_JSON` (nội dung key JSON)
   - `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
   - `SOURCE_SHEET_ID`, `BACKEND_SHEET_ID`
6. **`/web` env:** `VITE_SHEETS_API_KEY`, `VITE_BACKEND_SHEET_ID` (build-time;
   lưu ý API key sẽ lộ trong bundle → bắt buộc restrict referrer).
7. Scaffold `/sync` (Node ESM) + `/web` (Vite React) chạy được rỗng.

## Todo
**Code (DONE — đã scaffold & build pass):**
- [x] Scaffold `/sync` (package.json, src/sheets.js, scripts/verify-setup.js) + npm install
- [x] Scaffold `/web` (Vite React, lib/sheets.js, App test kết nối) + build OK
- [x] `.gitignore` + `.env.example` (sync & web) + `README.md` (checklist setup)
- [x] `verify-setup.js` (SA đọc source + ghi backend) — chạy được, lỗi rõ ràng khi thiếu cred

**Manual (USER — cần tài khoản Google/GitHub, xem README mục Phase 0):**
- [ ] Tạo GCP project + bật Sheets API
- [ ] Service account + key JSON
- [ ] Share source(Viewer) + backend(Editor) cho SA
- [ ] API key restrict referrer + Sheets API
- [ ] Publish backend sheet read-only
- [ ] GitHub repo + 5 Secrets
- [ ] Chạy `cd sync && npm run verify` → "✅ Phase 0 OK"

## Success criteria
- Script test Node dùng SA đọc 1 dòng source + ghi 1 ô backend OK
- FE dev đọc thử backend sheet bằng API key OK (CORS pass)
- Không file secret nào bị commit

## Risks
- API key lộ trong FE bundle → BẮT BUỘC restrict referrer (mitigation chính).
- Quên ẩn `_raw`/tab nhạy cảm khi publish → lộ PII. Chỉ để `agg_*` ở backend public.
- Sai scope share (SA chỉ Viewer backend) → ghi thất bại. Backend = Editor.

# NAK — Báo cáo hiệu quả giao hàng (Ontime)

Webapp tĩnh báo cáo ontime giao hàng. Google Sheet làm backend store; sync job
Node chạy GitHub Actions cron đổ dữ liệu đã tính (`agg_*`) vào backend sheet;
FE React đọc thẳng backend sheet; báo cáo gửi Telegram.

> Kế hoạch chi tiết: `plans/260530-1130-ontime-delivery-report/`

## Kiến trúc
```
SOURCE SHEET (1a4ECGE9) ──SA──► Node sync (GitHub Actions cron) ──► BACKEND SHEET (agg_*, public read)
                                     │ + Telegram                         ▲ API key
                                     ▼                                     │
                                group Telegram                  FE React/Vite (static)
```

## Cấu trúc
```
sync/   # Node job: đọc source -> tính agg_* -> ghi backend sheet + Telegram
web/    # React/Vite static FE: đọc backend sheet (API key) -> dashboard
plans/  # tài liệu kế hoạch
```

---

## ✅ Phase 0 — Setup (việc THỦ CÔNG bạn cần làm)

Code đã scaffold sẵn. Các bước dưới đây cần tài khoản Google/GitHub của bạn:

### 1. Google Cloud + Service Account
1. Tạo project tại https://console.cloud.google.com → bật **Google Sheets API**.
2. **IAM → Service Accounts** → tạo SA → **Keys → Add key → JSON** → tải về.
3. Ghi nhớ email SA: `...@...iam.gserviceaccount.com`.

### 2. Share quyền 2 sheet cho email SA
- Source `1a4ECGE9QDSTU9CpUL04rtnMja0OvezdrvV6_JU5A2Xk` → **Viewer**.
- Backend `1XmTPr04gF0v50dV3QLxYJrVrHch68-3n5A4s0RESB_k` → **Editor**.

### 3. API key cho FE
- **APIs & Services → Credentials → Create API key**.
- Restrict: **HTTP referrer** = domain webapp; **API restriction** = Google Sheets API.

### 4. Publish backend sheet read-only
- Backend sheet → **Share → Anyone with the link → Viewer**.
- ⚠️ Chỉ để các tab `agg_*` ở đây (KHÔNG để `_raw`/PII công khai).

### 5. Verify (local)
```bash
cd sync
cp .env.example .env      # điền GOOGLE_SA_JSON (nội dung JSON 1 dòng)
npm install
npm run verify            # phải in "✅ Phase 0 OK"
```
FE test:
```bash
cd web
cp .env.example .env      # điền VITE_SHEETS_API_KEY
npm install && npm run dev   # mở app, bấm "Test kết nối"
```

### 6. GitHub Secrets (cho Phase 1/3)
Repo → Settings → Secrets and variables → Actions:
`GOOGLE_SA_JSON`, `SOURCE_SHEET_ID`, `BACKEND_SHEET_ID`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`.

> ⚠️ KHÔNG commit file JSON service account / `.env` (đã có trong `.gitignore`).

---

## 📨 Phase 3 — Telegram

Báo cáo tổng quan (today/week) gửi vào group: ontime theo Loại + xe/số lượng + tình trạng check-in/số lượng.

### Tạo bot + lấy chat_id
1. Chat với **@BotFather** → `/newbot` → lấy **bot token**.
2. Thêm bot vào group, gửi 1 tin bất kỳ trong group.
3. Lấy **chat_id**: mở `https://api.telegram.org/bot<TOKEN>/getUpdates` → tìm `chat.id`
   (group thường âm, vd `-1001234567890`).
4. Điền vào GitHub Secrets `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
   (và `sync/.env` nếu muốn test local).

### Cơ chế gửi
- **Tự động (cron):** workflow `Ontime Sync` chạy hằng ngày 07:00 VN → gửi báo cáo `today`.
- **Thủ công:** GitHub → Actions → **Ontime Sync** → **Run workflow** → chọn `scope` = today/week.
- **Local test:** `cd sync && REPORT_SCOPE=today npm run sync` (cần SA + token trong `.env`).
- Bỏ trống `REPORT_SCOPE` → chỉ sync, không gửi Telegram.

// Google Sheets client dùng service account (JWT).
// Đọc source + đọc/ghi backend. Tái dùng ở Phase 1 (metrics) & Phase 3 (telegram).
import { google } from 'googleapis';
import { readFileSync } from 'node:fs';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

function loadCredentials() {
  if (process.env.GOOGLE_SA_JSON) {
    return JSON.parse(process.env.GOOGLE_SA_JSON);
  }
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'));
  }
  throw new Error('Thiếu credential: set GOOGLE_SA_JSON hoặc GOOGLE_APPLICATION_CREDENTIALS');
}

let _client;
function client() {
  if (!_client) {
    const creds = loadCredentials();
    const auth = new google.auth.JWT({
      email: creds.client_email,
      key: creds.private_key,
      scopes: SCOPES,
    });
    _client = google.sheets({ version: 'v4', auth });
  }
  return _client;
}

// Đọc 1 range -> mảng 2D (rỗng nếu không có dữ liệu).
export async function readSheet(spreadsheetId, range) {
  const res = await client().spreadsheets.values.get({ spreadsheetId, range });
  return res.data.values || [];
}

// Ghi đè 1 range bằng values (2D). RAW = giữ nguyên chuỗi.
export async function writeSheet(spreadsheetId, range, values) {
  await client().spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'RAW',
    requestBody: { values },
  });
}

export async function clearSheet(spreadsheetId, range) {
  await client().spreadsheets.values.clear({ spreadsheetId, range });
}

// Tạo tab nếu chưa tồn tại (idempotent, cỡ mặc định). Dùng cho _meta.
export async function ensureTab(spreadsheetId, title) {
  const meta = await getTabsMeta(spreadsheetId);
  if (!meta[title]) await addTab(spreadsheetId, title);
}

// Lấy metadata các tab 1 lần: title -> { sheetId, rows, cols }.
export async function getTabsMeta(spreadsheetId) {
  const res = await client().spreadsheets.get({
    spreadsheetId,
    fields: 'sheets(properties(sheetId,title,gridProperties(rowCount,columnCount)))',
  });
  const out = {};
  for (const s of res.data.sheets || []) {
    const p = s.properties;
    out[p.title] = { sheetId: p.sheetId, rows: p.gridProperties.rowCount, cols: p.gridProperties.columnCount };
  }
  return out;
}

// Tạo tab mới với grid đủ lớn -> trả sheetId.
export async function addTab(spreadsheetId, title, rows = 1000, cols = 26) {
  const res = await client().spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests: [{ addSheet: { properties: { title, gridProperties: { rowCount: rows, columnCount: cols } } } }] },
  });
  return res.data.replies[0].addSheet.properties.sheetId;
}

// Phóng to grid (chỉ tăng) để chứa đủ dữ liệu trước khi ghi.
export async function resizeTab(spreadsheetId, sheetId, rows, cols) {
  await client().spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests: [{ updateSheetProperties: {
      properties: { sheetId, gridProperties: { rowCount: rows, columnCount: cols } },
      fields: 'gridProperties.rowCount,gridProperties.columnCount',
    } }] },
  });
}

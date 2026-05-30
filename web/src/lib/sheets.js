// Đọc backend sheet trực tiếp từ trình duyệt qua Sheets API (API key).
// Backend sheet phải publish read-only. Tái dùng ở Phase 2 cho các tab agg_*.
const KEY = import.meta.env.VITE_SHEETS_API_KEY;
const ID = import.meta.env.VITE_BACKEND_SHEET_ID;

// Trả mảng 2D (values) của 1 tab.
export async function fetchTab(tab) {
  if (!KEY || !ID) throw new Error('Thiếu VITE_SHEETS_API_KEY / VITE_BACKEND_SHEET_ID');
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${ID}/values/${encodeURIComponent(tab)}?key=${KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Sheets API ${res.status}: ${body.slice(0, 120)}`);
  }
  const data = await res.json();
  return data.values || [];
}

// Nạp dữ liệu từ backend sheet (đã publish read-only) qua API key.
// Dev & prod đều dùng API key (VITE_SHEETS_API_KEY trong .env / Vercel env).
import { fetchTab } from './sheets.js';

export async function loadTrips() {
  return fetchTab('agg_trip');
}

let _stops;
export async function loadStops() {
  return (_stops ||= await fetchTab('agg_stops')); // lazy + cache (chỉ khi drill chi tiết)
}

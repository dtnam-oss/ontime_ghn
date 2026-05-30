// Nạp dữ liệu. Có API key -> đọc backend sheet; không -> fixture thật (import động
// để fixture lớn không vào main bundle). agg_stops tải lazy (chỉ khi drill chi tiết).
import { fetchTab } from './sheets.js';

export const USE_MOCK = !import.meta.env.VITE_SHEETS_API_KEY;

let _fixture;
const fixture = async () => (_fixture ||= (await import('../fixtures/sample.json')).default);

export async function loadTrips() {
  return USE_MOCK ? (await fixture()).agg_trip : fetchTab('agg_trip');
}

let _stops;
export async function loadStops() {
  if (_stops) return _stops;
  _stops = USE_MOCK ? (await fixture()).agg_stops : await fetchTab('agg_stops');
  return _stops;
}

// Nạp dữ liệu: có API key -> đọc backend sheet; không có -> dùng fixture thật (dev/preview).
import { fetchTab } from './sheets.js';
import sample from '../fixtures/sample.json';

const TABS = ['agg_trip', 'agg_daily', 'agg_type', 'agg_heatmap', 'agg_top', 'agg_vehicle_checkin'];
export const USE_MOCK = !import.meta.env.VITE_SHEETS_API_KEY;

export async function loadData() {
  if (USE_MOCK) return sample;
  const arrs = await Promise.all(TABS.map((t) => fetchTab(t)));
  return Object.fromEntries(TABS.map((t, i) => [t, arrs[i]]));
}

// Map cột source + matcher trạng thái + tên tab. Đổi layout source => sửa 1 nơi (DRY).
export const SOURCE_TAB = 'Chi tiết';

// 0-based index theo header source (20 cột).
export const COL = {
  STT: 0, DATE: 1, TRIP: 2, TRIP_STATUS: 3, BKS: 4, LOAD: 5, DRIVER: 6,
  ROUTE: 7, TYPE: 8, STOPS: 9, CHECKED: 10, LATE: 11, ONTIME: 12,
  STOP_NAME: 13, CHECKIN_STATUS: 19,
};

export const TYPES = ['Nội thành', 'Nội tỉnh/Nội vùng', 'Tuyến trục'];

export const isOntime = (s) => /đúng giờ/i.test(s || '');
export const isLate = (s) => /trễ/i.test(s || '');
export const isCheckedIn = (s) => !!(s && String(s).trim());

// "2026-05-29 - Thứ 6" -> "2026-05-29"
export const parseDate = (s) => {
  const m = String(s || '').match(/\d{4}-\d{2}-\d{2}/);
  return m ? m[0] : '';
};

export const TABS = {
  TRIP: 'agg_trip', DAILY: 'agg_daily', TYPE: 'agg_type',
  HEATMAP: 'agg_heatmap', TOP: 'agg_top', VEHICLE: 'agg_vehicle_checkin',
  META: '_meta',
};

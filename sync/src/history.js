// Tích lũy lịch sử: source giữ 7 ngày → merge window-replace vào raw (toàn bộ).
// Pure (test offline). Source = chân lý cho các ngày nó chứa; phần cũ giữ nguyên; cap retention.
import { COL, parseDate } from './constants.js';

// "YYYY-MM-DD" trừ n ngày -> "YYYY-MM-DD" (UTC).
export function isoMinusDays(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d) - n * 86400000).toISOString().slice(0, 10);
}

// raw_mới = hist(ngày ≥ cutoff & ∉ ngày-source) + source(ngày ≥ cutoff).
export function mergeHistory(hist, src, { today, retentionDays }) {
  const cutoff = isoMinusDays(today, retentionDays);
  const srcDates = new Set(src.map((r) => parseDate(r[COL.DATE])).filter(Boolean));
  const kept = hist.filter((r) => { const d = parseDate(r[COL.DATE]); return d && d >= cutoff && !srcDates.has(d); });
  const fresh = src.filter((r) => { const d = parseDate(r[COL.DATE]); return d && d >= cutoff; });
  return [...kept, ...fresh];
}

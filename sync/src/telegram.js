// Báo cáo Telegram: tổng quan today/week (ontime theo Loại + xe/số lượng + check-in/số lượng).
// buildReport thuần (test offline); sendTelegram gọi Bot API qua fetch.
import { TYPES } from './constants.js';

const round1 = (x) => Math.round(x * 10) / 10;

function pooledPct(trips) {
  let on = 0, ch = 0;
  for (const t of trips) { on += t.ontimeCount; ch += t.checkedIn; }
  return ch ? round1((on / ch) * 100) : null;
}

// Phạm vi ngày theo scope, lấy ngày mới nhất trong dữ liệu làm mốc.
export function dateRange(trips, scope) {
  const dates = [...new Set(trips.map((t) => t.date).filter(Boolean))].sort();
  const max = dates[dates.length - 1] || '';
  if (scope === 'week') {
    const from = dates[Math.max(0, dates.length - 7)] || max;
    return { from, to: max, label: `Tuần này (${from} → ${max})` };
  }
  return { from: max, to: max, label: `Hôm nay (${max})` };
}

export function buildReport(trips, scope) {
  const { from, to, label } = dateRange(trips, scope);
  const inRange = trips.filter((t) => t.date >= from && t.date <= to);
  const overall = pooledPct(inRange);
  const vehicles = new Set(inRange.map((t) => t.bks).filter(Boolean)).size;

  let on = 0, late = 0, notc = 0;
  for (const t of inRange) { on += t.ontimeCount; late += t.lateCount; notc += t.stops - t.checkedIn; }
  const total = on + late + notc;
  const p = (x) => (total ? round1((x / total) * 100) : 0);

  const L = [];
  L.push(`📊 <b>Báo cáo Ontime — ${label}</b>`);
  L.push(`Tổng: <b>${overall ?? '—'}%</b> ontime · ${inRange.length} chuyến · ${vehicles} xe`);
  L.push('');
  L.push('<b>Ontime theo Loại:</b>');
  for (const type of TYPES) {
    const ts = inRange.filter((t) => t.type === type);
    if (ts.length) L.push(`• ${type}: <b>${pooledPct(ts) ?? '—'}%</b> (${ts.length} chuyến)`);
  }
  L.push('');
  L.push('<b>Tình trạng check-in (điểm dừng):</b>');
  L.push(`• Đúng giờ: ${on} (${p(on)}%)`);
  L.push(`• Trễ: ${late} (${p(late)}%)`);
  L.push(`• Chưa check-in: ${notc} (${p(notc)}%)`);
  return L.join('\n');
}

export async function sendTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) { console.warn('⚠️ Bỏ qua Telegram: thiếu TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID'); return false; }
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
  });
  const data = await res.json().catch(() => ({}));
  if (!data.ok) { console.error('❌ Telegram lỗi:', data.description || res.status); return false; }
  console.log('✅ Đã gửi Telegram.');
  return true;
}

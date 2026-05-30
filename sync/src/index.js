// Orchestrate: đọc source -> tính agg_* -> ghi backend sheet -> (Telegram: Phase 3).
import 'dotenv/config';
import { readSheet, writeSheet, clearSheet, ensureTab, getTabsMeta, addTab, resizeTab } from './sheets.js';
import { SOURCE_TAB, TABS } from './constants.js';
import { groupTrips, aggregatesFromTrips } from './metrics.js';
import { buildReport, sendTelegram } from './telegram.js';

// Ghi 1 tab: đảm bảo grid đủ lớn (agg_trip ~1400 dòng > mặc định 1000) -> clear -> ghi.
async function writeTab(backend, meta, tab, values) {
  const width = values.reduce((m, r) => Math.max(m, r.length), 1);
  const needRows = values.length + 10;
  const needCols = width + 2;
  if (!meta[tab]) {
    await addTab(backend, tab, Math.max(needRows, 1000), Math.max(needCols, 26));
  } else if (meta[tab].rows < needRows || meta[tab].cols < needCols) {
    await resizeTab(backend, meta[tab].sheetId, Math.max(needRows, meta[tab].rows), Math.max(needCols, meta[tab].cols));
  }
  await clearSheet(backend, `'${tab}'`);
  await writeSheet(backend, `'${tab}'!A1`, values);
}

async function main() {
  const SOURCE = process.env.SOURCE_SHEET_ID;
  const BACKEND = process.env.BACKEND_SHEET_ID;
  if (!SOURCE || !BACKEND) throw new Error('Thiếu SOURCE_SHEET_ID / BACKEND_SHEET_ID');

  console.log('Đọc source...');
  const rows = await readSheet(SOURCE, `'${SOURCE_TAB}'!A2:T`); // tên tab có dấu cách; bỏ header
  console.log(`  ${rows.length} dòng stop-level`);

  const trips = groupTrips(rows);
  const aggs = aggregatesFromTrips(trips, { topN: Number(process.env.TOP_N) || 10 });

  const meta = await getTabsMeta(BACKEND); // lấy metadata 1 lần
  for (const [tab, values] of Object.entries(aggs)) {
    await writeTab(BACKEND, meta, tab, values);
    console.log(`  ${tab}: ${values.length - 1} dòng`);
  }

  await ensureTab(BACKEND, TABS.META);
  await writeSheet(BACKEND, `'${TABS.META}'!A1`, [['last_sync', new Date().toISOString()]]);
  console.log('✅ Sync xong.');

  // Telegram: cron đặt REPORT_SCOPE=today|week; workflow_dispatch cho chọn. Local sync bỏ trống -> skip.
  const scope = process.env.REPORT_SCOPE;
  if (scope) await sendTelegram(buildReport(trips, scope));
}

main().catch((e) => { console.error('❌ Sync lỗi:', e); process.exit(1); });

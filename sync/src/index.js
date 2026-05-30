// Orchestrate tích lũy lịch sử:
//   source(7 ngày) + raw(lịch sử) --merge window-replace--> raw private
//   raw --> agg_trip(full) + agg_stops(cửa sổ) --> backend public --> Telegram.
import 'dotenv/config';
import { readSheet, writeSheet, clearSheet, ensureTab, getTabsMeta, addTab, resizeTab } from './sheets.js';
import { SOURCE_TAB, TABS, COL } from './constants.js';
import { groupTrips, aggregatesFromTrips, buildStops } from './metrics.js';
import { mergeHistory, isoMinusDays } from './history.js';
import { buildReport, sendTelegram } from './telegram.js';

// Ghi 1 tab vào spreadsheetId bất kỳ: đảm bảo grid đủ lớn -> clear -> ghi.
async function writeTab(spreadsheetId, meta, tab, values) {
  const width = values.reduce((m, r) => Math.max(m, r.length), 1);
  const needRows = values.length + 10, needCols = width + 2;
  if (!meta[tab]) {
    await addTab(spreadsheetId, tab, Math.max(needRows, 1000), Math.max(needCols, 26));
  } else if (meta[tab].rows < needRows || meta[tab].cols < needCols) {
    await resizeTab(spreadsheetId, meta[tab].sheetId, Math.max(needRows, meta[tab].rows), Math.max(needCols, meta[tab].cols));
  }
  await clearSheet(spreadsheetId, `'${tab}'`);
  await writeSheet(spreadsheetId, `'${tab}'!A1`, values);
}

async function main() {
  const SOURCE = process.env.SOURCE_SHEET_ID;
  const BACKEND = process.env.BACKEND_SHEET_ID;
  const RAW = process.env.RAW_SHEET_ID;
  if (!SOURCE || !BACKEND || !RAW) throw new Error('Thiếu SOURCE_SHEET_ID / BACKEND_SHEET_ID / RAW_SHEET_ID');
  const retentionDays = Number(process.env.RETENTION_DAYS) || 540;
  const stopsWindow = Number(process.env.STOPS_WINDOW_DAYS) || 90;
  const today = new Date().toISOString().slice(0, 10);

  console.log('Đọc source...');
  const srcAll = await readSheet(SOURCE, `'${SOURCE_TAB}'!A1:T`);
  const header = srcAll[0];
  const srcRows = srcAll.slice(1).filter((r) => r[COL.TRIP]);
  console.log(`  source: ${srcRows.length} dòng`);

  console.log('Đọc raw lịch sử...');
  await ensureTab(RAW, TABS.RAW);
  const histRows = (await readSheet(RAW, `'${TABS.RAW}'!A2:T`)).filter((r) => r[COL.TRIP]);
  console.log(`  raw cũ: ${histRows.length} dòng`);

  const merged = mergeHistory(histRows, srcRows, { today, retentionDays });
  console.log(`  raw mới: ${merged.length} dòng (retention ${retentionDays}d)`);
  const rawMeta = await getTabsMeta(RAW);
  await writeTab(RAW, rawMeta, TABS.RAW, [header, ...merged]);

  const trips = groupTrips(merged);
  const aggs = aggregatesFromTrips(trips); // agg_trip full
  aggs[TABS.STOPS] = buildStops(merged, { since: isoMinusDays(today, stopsWindow) });

  const meta = await getTabsMeta(BACKEND);
  for (const [tab, values] of Object.entries(aggs)) {
    await writeTab(BACKEND, meta, tab, values);
    console.log(`  ${tab}: ${values.length - 1} dòng`);
  }
  await ensureTab(BACKEND, TABS.META);
  await writeSheet(BACKEND, `'${TABS.META}'!A1`, [
    ['last_sync', new Date().toISOString()], ['rows_raw', merged.length],
    ['retention_days', retentionDays], ['stops_window_days', stopsWindow],
  ]);
  console.log('✅ Sync xong.');

  const scope = process.env.REPORT_SCOPE;
  if (scope) await sendTelegram(buildReport(trips, scope));
}

main().catch((e) => { console.error('❌ Sync lỗi:', e); process.exit(1); });

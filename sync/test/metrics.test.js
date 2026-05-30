// Test buildAggregates (agg_trip) trên CSV nguồn thật. cd sync && npm test
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseCsv } from './parse-csv.js';
import { groupTrips, buildAggregates, buildStops } from '../src/metrics.js';
import { COL } from '../src/constants.js';

const here = dirname(fileURLToPath(import.meta.url));
const CSV = join(here, '../../VẬN TẢI NAK VIỆT NAM - Chi tiết.csv');

let pass = 0;
const check = (name, fn) => { fn(); console.log(`  ✓ ${name}`); pass++; };

const all = parseCsv(readFileSync(CSV, 'utf8'));
const header = all[0];
const rows = all.slice(1).filter((r) => r[COL.TRIP]);
const trips = groupTrips(rows);
const aggs = buildAggregates(rows);
const trip = aggs.agg_trip;
const H = trip[0];

console.log(`CSV: ${header.length} cột, ${rows.length} dòng | trips=${trips.length}`);

check('source header 20 cột', () => assert.strictEqual(header.length, 20));
check('chỉ xuất agg_trip', () => assert.deepStrictEqual(Object.keys(aggs), ['agg_trip']));
check('agg_trip header có 11 cột (+Đúng giờ,Trễ)', () => {
  assert.strictEqual(H.length, 11);
  assert.ok(H.includes('Đúng giờ') && H.includes('Trễ') && H.includes('Ontime%'));
});
check('số dòng = số chuyến', () => assert.strictEqual(trip.length - 1, trips.length));

const iOn = H.indexOf('Đúng giờ'), iLate = H.indexOf('Trễ');
const iChk = H.indexOf('Đã check-in'), iStops = H.indexOf('Điểm dừng'), iPct = H.indexOf('Ontime%');

check('đúng giờ + trễ ≤ đã check-in ≤ điểm dừng', () => {
  for (const r of trip.slice(1)) {
    assert.ok(r[iOn] + r[iLate] <= r[iChk], `${r[0]}: ${r[iOn]}+${r[iLate]}>${r[iChk]}`);
    assert.ok(r[iChk] <= r[iStops]);
  }
});
check('Ontime% = đúng giờ / đã-check-in (khi có check-in)', () => {
  for (const r of trip.slice(1, 300)) {
    if (r[iChk] === 0) { assert.strictEqual(r[iPct], ''); continue; }
    assert.strictEqual(r[iPct], Math.round((r[iOn] / r[iChk]) * 10000) / 100);
  }
});

// --- agg_stops ---
const stops = buildStops(rows);
const SH = stops[0];
const sIdx = (k) => SH.indexOf(k);
check('agg_stops: 14 cột + đủ dòng điểm', () => {
  assert.strictEqual(SH.length, 14);
  assert.ok(SH.includes('Tên điểm') && SH.includes('Đóng seal') && SH.includes('Check-out thực tế') && SH.includes('Trễ (phút)'));
  assert.strictEqual(stops.length - 1, rows.length); // 1 dòng/điểm
});
check('agg_stops: delay ≥ 0 hoặc rỗng; chưa check-in -> rỗng', () => {
  const iAct = sIdx('Check-in thực tế'), iDelay = sIdx('Trễ (phút)');
  for (const r of stops.slice(1)) {
    if (!r[iAct]) { assert.strictEqual(r[iDelay], ''); continue; }
    assert.ok(typeof r[iDelay] === 'number' && r[iDelay] >= 0, `delay=${r[iDelay]}`);
  }
});

check('agg_stops since: lọc cửa sổ ngày', () => {
  const dates = [...new Set(rows.map((r) => r[COL.DATE].slice(0, 10)))].sort();
  const since = dates[dates.length - 1]; // chỉ ngày mới nhất
  const win = buildStops(rows, { since });
  assert.ok(win.length - 1 < stops.length - 1); // ít hơn full
  for (const r of win.slice(1)) assert.ok(r[1] >= since); // cột Ngày ≥ since
});

console.log(`\n✅ ${pass} checks pass | agg_trip=${trip.length - 1} (${H.length} cột) | agg_stops=${stops.length - 1}`);

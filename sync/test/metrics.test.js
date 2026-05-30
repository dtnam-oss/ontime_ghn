// Test buildAggregates trên CSV nguồn thật (không cần credential).
//   cd sync && npm test
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseCsv } from './parse-csv.js';
import { groupTrips, buildAggregates } from '../src/metrics.js';
import { COL } from '../src/constants.js';

const here = dirname(fileURLToPath(import.meta.url));
const CSV = join(here, '../../VẬN TẢI NAK VIỆT NAM - Chi tiết.csv');

let pass = 0;
const check = (name, fn) => { fn(); console.log(`  ✓ ${name}`); pass++; };

const all = parseCsv(readFileSync(CSV, 'utf8'));
const header = all[0];
const rows = all.slice(1).filter((r) => r[COL.TRIP]); // bỏ dòng rỗng cuối
console.log(`CSV: ${header.length} cột, ${rows.length} dòng stop-level`);

const trips = groupTrips(rows);
const aggs = buildAggregates(rows, { topN: 10 });

check('header đúng 20 cột', () => assert.strictEqual(header.length, 20));
check('có chuyến', () => assert.ok(trips.length > 0));

check('ontime/chuyến = đúng giờ / đã-check-in', () => {
  for (const t of trips.slice(0, 200)) {
    if (t.ontime == null) { assert.strictEqual(t.checkedIn, 0); continue; }
    assert.ok(t.ontime >= 0 && t.ontime <= 1, `ontime ngoài [0,1]: ${t.ontime}`);
    assert.strictEqual(t.ontime, t.ontimeCount / t.checkedIn);
  }
});

check('agg_trip: Ontime% trong [0,100]', () => {
  for (const r of aggs.agg_trip.slice(1)) {
    if (r[8] === '') continue;
    assert.ok(r[8] >= 0 && r[8] <= 100, `pct=${r[8]}`);
  }
});

check('agg_daily sắp xếp tăng theo ngày + có trend', () => {
  const d = aggs.agg_daily.slice(1).map((r) => r[0]);
  assert.deepStrictEqual(d, [...d].sort());
  assert.ok(aggs.agg_daily[0].includes('Trend'));
});

check('agg_type có ≥1 loại', () => assert.ok(aggs.agg_type.length > 1));

check('agg_top: tối đa 30 dòng (10×3) + sắp xếp tăng trong nhóm', () => {
  const body = aggs.agg_top.slice(1);
  assert.ok(body.length <= 30);
  for (const cat of ['Tuyến', 'Tài xế', 'BKS']) {
    const v = body.filter((r) => r[0] === cat).map((r) => r[3]);
    assert.deepStrictEqual(v, [...v].sort((a, b) => a - b));
  }
});

check('agg_heatmap: hàng đầu = Mã lộ trình + danh sách ngày', () =>
  assert.strictEqual(aggs.agg_heatmap[0][0], 'Mã lộ trình'));

check('agg_vehicle_checkin: đủ 5 cột', () =>
  assert.strictEqual(aggs.agg_vehicle_checkin[0].length, 5));

// In mẫu để mắt thường kiểm chứng
console.log('\n--- agg_type ---');
aggs.agg_type.forEach((r) => console.log('  ', r.join(' | ')));
console.log('--- agg_daily (5 dòng) ---');
aggs.agg_daily.slice(0, 6).forEach((r) => console.log('  ', r.join(' | ')));
console.log('--- agg_top Tuyến (top 5 thấp nhất) ---');
aggs.agg_top.slice(1).filter((r) => r[0] === 'Tuyến').slice(0, 5).forEach((r) => console.log('  ', r.join(' | ')));

console.log(`\n✅ ${pass} checks pass | trips=${trips.length} | agg_trip rows=${aggs.agg_trip.length - 1}`);

// Test buildReport trên CSV thật (không cần token). cd sync && node test/telegram.test.js
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseCsv } from './parse-csv.js';
import { groupTrips } from '../src/metrics.js';
import { buildReport, dateRange } from '../src/telegram.js';
import { COL } from '../src/constants.js';

const here = dirname(fileURLToPath(import.meta.url));
const csv = join(here, '../../VẬN TẢI NAK VIỆT NAM - Chi tiết.csv');
const trips = groupTrips(parseCsv(readFileSync(csv, 'utf8')).slice(1).filter((r) => r[COL.TRIP]));

let pass = 0;
const check = (name, fn) => { fn(); console.log(`  ✓ ${name}`); pass++; };

check('dateRange today = ngày mới nhất', () => {
  const r = dateRange(trips, 'today');
  assert.strictEqual(r.from, r.to);
  assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(r.to));
});
check('dateRange week: from < to', () => {
  const r = dateRange(trips, 'week');
  assert.ok(r.from <= r.to);
});

const today = buildReport(trips, 'today');
const week = buildReport(trips, 'week');

check('report có đủ các mục', () => {
  for (const s of ['Báo cáo Ontime', 'Ontime theo Loại', 'Tình trạng check-in', 'Đúng giờ', 'Trễ', 'Chưa check-in']) {
    assert.ok(today.includes(s), `thiếu: ${s}`);
  }
});
check('report có % hợp lệ', () => assert.ok(/\d+(\.\d+)?%/.test(today)));
check('today ⊆ week (week nhiều chuyến hơn hoặc bằng)', () => {
  const n = (s) => Number(s.match(/· (\d+) chuyến/)[1]);
  assert.ok(n(week) >= n(today));
});

console.log('\n--- BÁO CÁO HÔM NAY (preview) ---');
console.log(today.replace(/<\/?b>/g, ''));
console.log(`\n✅ ${pass} checks pass`);

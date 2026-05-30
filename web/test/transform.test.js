// Test transform trên fixture thật (web/src/fixtures/sample.json). cd web && npm test
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as T from '../src/lib/transform.js';

const here = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(readFileSync(join(here, '../src/fixtures/sample.json'), 'utf8'));

let pass = 0;
const check = (name, fn) => { fn(); console.log(`  ✓ ${name}`); pass++; };

check('kpi: overall trong [0,100], tổng chuyến > 0, 3 loại', () => {
  const k = T.kpi(data);
  assert.ok(k.overall > 0 && k.overall <= 100, `overall=${k.overall}`);
  assert.strictEqual(k.totalTrips, data.agg_trip.length - 1);
  assert.strictEqual(k.byType.length, 3);
});

check('daily: 8 ngày, có ontime & trend số', () => {
  const d = T.daily(data);
  assert.strictEqual(d.length, 8);
  assert.ok(typeof d[0].ontime === 'number' && typeof d[0].trend === 'number');
});

check('heatmap: có ngày + đúng số tuyến', () => {
  const h = T.heatmap(data);
  assert.ok(h.dates.length > 0);
  assert.strictEqual(h.rows.length, data.agg_heatmap.length - 1);
});

check('top: 3 nhóm, mỗi nhóm ≤ 10, sắp xếp tăng', () => {
  const t = T.top(data);
  for (const g of ['Tuyến', 'Tài xế', 'BKS']) {
    assert.ok(t[g].length > 0 && t[g].length <= 10);
    const v = t[g].map((x) => x.ontime);
    assert.deepStrictEqual(v, [...v].sort((a, b) => a - b));
  }
});

check('vehicle: gộp theo BKS, có số liệu; range lọc bớt', () => {
  const all = T.vehicle(data, null);
  assert.ok(all.length > 0);
  const total = all.reduce((s, v) => s + v.ontime + v.late + v.notChecked, 0);
  assert.ok(total > 0);
  const dates = T.allDates(data);
  const oneDay = T.vehicle(data, { from: dates[0], to: dates[0] });
  assert.ok(oneDay.length <= all.length);
});

console.log(`\n✅ ${pass} checks pass | overall=${T.kpi(data).overall}% | vehicles=${T.vehicle(data, null).length}`);

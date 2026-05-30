// Test transform (parse/filter/builders) trên fixture agg_trip thật. cd web && npm test
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as T from '../src/lib/transform.js';

const here = dirname(fileURLToPath(import.meta.url));
const fixture = JSON.parse(readFileSync(join(here, '../src/fixtures/sample.json'), 'utf8'));
const trips = T.parseTrips(fixture.agg_trip);

let pass = 0;
const check = (name, fn) => { fn(); console.log(`  ✓ ${name}`); pass++; };

check('parseTrips: số chuyến + field number', () => {
  assert.strictEqual(trips.length, fixture.agg_trip.length - 1);
  assert.ok(typeof trips[0].checkedIn === 'number' && typeof trips[0].ontimeCount === 'number');
});

check('options: 3 loại + danh sách xe/tài xế/tuyến/ngày', () => {
  const o = T.options(trips);
  assert.ok(o.loai.length >= 1 && o.xe.length > 0 && o.taixe.length > 0 && o.tuyen.length > 0);
  assert.ok(o.dates.length === [...new Set(trips.map((t) => t.date))].length);
});

check('filterTrips: rỗng = tất cả; lọc loại thu hẹp', () => {
  assert.strictEqual(T.filterTrips(trips, { loai: [], xe: [], taixe: [], tuyen: [], from: '', to: '' }).length, trips.length);
  const loai = T.options(trips).loai[0];
  const f = T.filterTrips(trips, { loai: [loai], xe: [], taixe: [], tuyen: [], from: '', to: '' });
  assert.ok(f.length < trips.length && f.every((t) => t.type === loai));
});

check('filterTrips: khoảng ngày', () => {
  const d = T.options(trips).dates;
  const f = T.filterTrips(trips, { loai: [], xe: [], taixe: [], tuyen: [], from: d[0], to: d[0] });
  assert.ok(f.every((t) => t.date === d[0]));
});

check('kpi: overall [0,100], byType 3, tổng đúng', () => {
  const k = T.kpi(trips);
  assert.ok(k.overall > 0 && k.overall <= 100);
  assert.strictEqual(k.totalTrips, trips.length);
  assert.strictEqual(k.byType.length, 3);
});

check('daily có trend; heatmap/top/vehicle/checkin hợp lệ', () => {
  assert.ok(T.daily(trips).every((r) => 'trend' in r));
  assert.strictEqual(T.heatmap(trips).rows.length, [...new Set(trips.map((t) => t.route))].filter(Boolean).length);
  for (const g of ['Tuyến', 'Tài xế', 'BKS']) assert.ok(T.top(trips)[g].length <= 10);
  assert.ok(T.vehicle(trips).length <= 15);
  assert.strictEqual(T.checkin(trips).length, 3);
});

check('parseStops + drill + stopsForTrip', () => {
  const stops = T.parseStops(fixture.agg_stops);
  assert.strictEqual(stops.length, fixture.agg_stops.length - 1);
  assert.ok(stops.every((s) => s.delay === null || typeof s.delay === 'number'));
  const route = trips[0].route;
  const m = T.tripsForDrill(trips, { kind: 'route', value: route });
  assert.ok(m.length > 0 && m.every((t) => t.route === route));
  const ot = (t) => (t.checkedIn ? t.ontimeCount / t.checkedIn : 1);
  for (let i = 1; i < m.length; i++) assert.ok(ot(m[i - 1]) <= ot(m[i])); // xấu lên đầu
  const st = T.stopsForTrip(stops, m[0].trip);
  assert.ok(st.length > 0 && st.every((s) => s.trip === m[0].trip));
});

console.log(`\n✅ ${pass} checks pass | overall=${T.kpi(trips).overall}% | trips=${trips.length} | stops=${fixture.agg_stops.length - 1}`);

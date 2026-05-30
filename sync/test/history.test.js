// Test merge tích lũy lịch sử (offline, dòng tổng hợp). cd sync && node test/history.test.js
import assert from 'node:assert';
import { mergeHistory, isoMinusDays } from '../src/history.js';
import { COL } from '../src/constants.js';

let pass = 0;
const check = (name, fn) => { fn(); console.log(`  ✓ ${name}`); pass++; };

// row 20 cột; col1=ngày, col2=mã chuyến, col10(CHECKED) làm marker phiên bản
const row = (date, trip, marker = '') => { const r = Array(20).fill(''); r[COL.DATE] = `${date} - x`; r[COL.TRIP] = trip; r[COL.CHECKED] = marker; return r; };
const dateOf = (r) => r[COL.DATE].slice(0, 10);
const today = '2026-05-30';

check('isoMinusDays', () => {
  assert.strictEqual(isoMinusDays('2026-05-30', 7), '2026-05-23');
  assert.strictEqual(isoMinusDays('2026-03-01', 1), '2026-02-28');
});

check('giữ ngày cũ ngoài cửa sổ source', () => {
  const hist = [row('2026-05-10', 'A'), row('2026-05-22', 'B')]; // cũ, không có trong source
  const src = [row('2026-05-29', 'C'), row('2026-05-30', 'D')];
  const m = mergeHistory(hist, src, { today, retentionDays: 540 });
  const dates = m.map(dateOf).sort();
  assert.deepStrictEqual(dates, ['2026-05-10', '2026-05-22', '2026-05-29', '2026-05-30']);
});

check('window-replace: source ghi đè ngày trùng (lấy bản source)', () => {
  const hist = [row('2026-05-29', 'X', 'OLD')]; // bản cũ ngày 29
  const src = [row('2026-05-29', 'X', 'NEW')]; // bản mới ngày 29
  const m = mergeHistory(hist, src, { today, retentionDays: 540 });
  assert.strictEqual(m.length, 1);
  assert.strictEqual(m[0][COL.CHECKED], 'NEW'); // lấy bản source
});

check('retention: loại ngày quá cũ', () => {
  const hist = [row('2024-01-01', 'OLD'), row('2026-05-20', 'KEEP')];
  const src = [row('2026-05-30', 'NEW')];
  const m = mergeHistory(hist, src, { today, retentionDays: 30 }); // cutoff = 2026-04-30
  const dates = m.map(dateOf).sort();
  assert.deepStrictEqual(dates, ['2026-05-20', '2026-05-30']); // 2024 bị loại
});

check('lần đầu raw rỗng -> = source', () => {
  const src = [row('2026-05-30', 'A'), row('2026-05-29', 'B')];
  assert.strictEqual(mergeHistory([], src, { today, retentionDays: 540 }).length, 2);
});

console.log(`\n✅ ${pass} checks pass`);

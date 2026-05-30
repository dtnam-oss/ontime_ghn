// Tạo fixture dữ liệu thật cho FE dev/preview (từ CSV nguồn -> web/src/fixtures/sample.json).
//   cd sync && node scripts/dump-fixture.js
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseCsv } from '../test/parse-csv.js';
import { buildAggregates } from '../src/metrics.js';
import { COL } from '../src/constants.js';

const here = dirname(fileURLToPath(import.meta.url));
const csv = join(here, '../../VẬN TẢI NAK VIỆT NAM - Chi tiết.csv');
const out = join(here, '../../web/src/fixtures/sample.json');

const rows = parseCsv(readFileSync(csv, 'utf8')).slice(1).filter((r) => r[COL.TRIP]);
const aggs = buildAggregates(rows, { topN: 10 });

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(aggs));
console.log('Đã ghi', out);
console.log(Object.fromEntries(Object.entries(aggs).map(([k, v]) => [k, v.length - 1])));

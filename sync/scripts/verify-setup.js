// Kiểm tra Phase 0: service account đọc được source + ghi được backend.
// Chạy SAU khi đã: tạo SA, share source(Viewer)+backend(Editor), điền sync/.env.
//   cd sync && npm install && npm run verify
import 'dotenv/config';
import { readSheet, writeSheet, ensureTab } from '../src/sheets.js';

const SOURCE = process.env.SOURCE_SHEET_ID;
const BACKEND = process.env.BACKEND_SHEET_ID;

async function main() {
  if (!SOURCE || !BACKEND) throw new Error('Thiếu SOURCE_SHEET_ID / BACKEND_SHEET_ID trong .env');

  console.log('1) Đọc source "Chi tiết"...');
  const rows = await readSheet(SOURCE, "'Chi tiết'!A1:T2");
  if (!rows.length) throw new Error('Không đọc được dữ liệu source (kiểm tra quyền Viewer + tên tab)');
  console.log('   Header :', (rows[0] || []).slice(0, 6).join(' | '));
  console.log('   Dòng 1 :', (rows[1] || []).slice(0, 6).join(' | '));

  console.log('2) Ghi thử vào backend (_meta)...');
  await ensureTab(BACKEND, '_meta');
  await writeSheet(BACKEND, '_meta!A1:B1', [['last_verify', new Date().toISOString()]]);
  console.log('   Đã ghi _meta!A1:B1');

  console.log('\n✅ Phase 0 OK — SA đọc source + ghi backend thành công.');
}

main().catch((e) => {
  console.error('\n❌ Verify thất bại:', e.message);
  console.error('   Gợi ý: kiểm tra quyền share sheet cho email service account, và GOOGLE_SA_JSON hợp lệ.');
  process.exit(1);
});

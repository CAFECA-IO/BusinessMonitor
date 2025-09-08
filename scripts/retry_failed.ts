import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const log = 'failed_files.log';
if (!fs.existsSync(log)) {
  console.log('找不到 failed_files.log');
  process.exit(0);
}
const content = fs.readFileSync(log, 'utf8');
const files = [...content.matchAll(/\[(\d{8}\.csv)\]/g)].map((m) => m[1]);
const unique = [...new Set(files)];
if (unique.length === 0) {
  console.log('failed_files.log 無可重試項目');
  process.exit(0);
}
console.log('重試清單：', unique.length, '個');
for (const name of unique) {
  const fp = path.join('./data/twse/daily', name);
  try {
    execSync(`npx tsx scripts/import_twse_daily.ts "${fp}"`, { stdio: 'inherit' });
  } catch (e) {
    console.error('[RETRY_FAIL]', name);
  }
}

import fs from 'node:fs';
import path from 'node:path';
import iconv from 'iconv-lite';

function parseYmd(s: string): Date {
  const y = Number(s.slice(0, 4)),
    m = Number(s.slice(4, 6)),
    d = Number(s.slice(6, 8));
  return new Date(Date.UTC(y, m - 1, d));
}
function fmtYmd(d: Date): string {
  const y = d.getUTCFullYear(),
    m = `${d.getUTCMonth() + 1}`.padStart(2, '0'),
    dd = `${d.getUTCDate()}`.padStart(2, '0');
  return `${y}${m}${dd}`;
}
function* rangeDays(start: Date, end: Date) {
  for (let t = new Date(start); t <= end; t.setUTCDate(t.getUTCDate() + 1)) yield new Date(t);
}

const dir = process.argv[2];
const startYmd = process.argv[3];
const endYmd = process.argv[4];
if (!dir || !startYmd || !endYmd) {
  console.error('用法：npx tsx scripts/audit_files.ts <資料夾> <起始YYYYMMDD> <結束YYYYMMDD>');
  process.exit(1);
}

const start = parseYmd(startYmd);
const end = parseYmd(endYmd);

// Info: (20250905 - Tzuhan) 遞迴收集所有 YYYYMMDD.csv
const all: Record<string, string> = {};
function walk(p: string) {
  for (const name of fs.readdirSync(p)) {
    const fp = path.join(p, name);
    const st = fs.statSync(fp);
    if (st.isDirectory()) walk(fp);
    else if (/^\d{8}\.csv$/i.test(name)) all[name.slice(0, 8)] = fp;
  }
}
walk(dir);

// Info: (20250905 - Tzuhan) 寫 CSV
fs.writeFileSync(
  'files_audit.csv',
  'date,weekday,exists,path,size,header_ok,has_section,notes\n',
  'utf8'
);

const missing: string[] = [];
for (const d of rangeDays(start, end)) {
  const ymd = fmtYmd(d);
  const wk = d.getUTCDay(); // Info: (20250905 - Tzuhan) 0 Sun ~ 6 Sat
  const fp = all[ymd];
  if (!fp) {
    const tag = wk === 0 || wk === 6 ? 'weekend' : 'weekday';
    missing.push(`${ymd},${tag}`);
    fs.appendFileSync('files_audit.csv', `${ymd},${wk},false,,,false,false,missing\n`);
    continue;
  }

  const raw = fs.readFileSync(fp);
  const txt = iconv.decode(raw, 'big5').replace(/\r\n?/g, '\n');
  const hasSection = txt.includes('每日收盤行情');
  const headerOk = txt.includes('證券代號') && txt.includes('成交金額') && txt.includes('收盤價');
  const size = fs.statSync(fp).size;

  fs.appendFileSync(
    'files_audit.csv',
    `${ymd},${wk},true,${JSON.stringify(fp)},${size},${headerOk},${hasSection},\n`
  );
}

fs.writeFileSync('missing_dates.csv', `date,tag\n${missing.join('\n')}\n`, 'utf8');
console.log('完成檢核：files_audit.csv、missing_dates.csv 已產生。');

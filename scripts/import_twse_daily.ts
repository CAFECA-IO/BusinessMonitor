import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse/sync';
import iconv from 'iconv-lite';
import { PrismaClient, Prisma } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

/** Info: (20250904 - Tzuhan) ===== Zod Schemas ===== */
const DailyPriceRow = z.object({
  market: z.literal('TWSE'),
  date: z.date(),
  symbol: z.string().min(1),
  name: z.string().optional(),
  tradeVolume: z.bigint().or(z.null()),
  tradeValue: z.string().or(z.null()).optional(),
  tradeCount: z.number().int().or(z.null()),
  openPrice: z.string().optional(),
  highPrice: z.string().optional(),
  lowPrice: z.string().optional(),
  closePrice: z.string().optional(),
  changeSign: z.string().optional(), // Info: (20250904 - Tzuhan) '+' | '-' | 'X'
  changeAmount: z.string().optional(),
  finalBidPrice: z.string().optional(),
  finalBidVolume: z.bigint().or(z.null()).optional(),
  finalAskPrice: z.string().optional(),
  finalAskVolume: z.bigint().or(z.null()).optional(),
  peRatio: z.string().optional(),
});

const SummaryRow = z.object({
  market: z.literal('TWSE'),
  date: z.date(),
  category: z.string().min(1),
  tradeValue: z.string().or(z.null()).optional(),
  tradeVolume: z.bigint().or(z.null()).optional(),
  tradeCount: z.number().int().or(z.null()).optional(),
});

/** Info: (20250904 - Tzuhan) ===== Helpers ===== */
function rocToDate(str: string): Date | null {
  const m = str.match(/(\d{2,3})年(\d{2})月(\d{2})日/);
  if (!m) return null;
  const rocYear = parseInt(m[1], 10);
  const y = 1911 + rocYear;
  const mo = parseInt(m[2], 10);
  const d = parseInt(m[3], 10);
  return new Date(Date.UTC(y, mo - 1, d, 0, 0, 0));
}

function cleanNumber(s?: string | null): string | null {
  if (!s) return null;
  const t = s.replace(/,/g, '').trim();
  if (t === '' || t === '--') return null;
  return t;
}
function toBigIntOrNull(s?: string | null): bigint | null {
  const t = cleanNumber(s);
  if (t == null) return null;
  try {
    return BigInt(t);
  } catch {
    return null;
  }
}
function toDecimalOrNull(s?: string | null): Prisma.Decimal | null {
  const t = cleanNumber(s);
  if (t == null) return null;
  return new Prisma.Decimal(t);
}
function normalizeSymbol(raw: string): string {
  return raw.replace(/^="?/, '').replace(/"?$/, '').trim();
}

type ParsedBlocks = {
  date: Date;
  summary: Array<z.infer<typeof SummaryRow>>;
  prices: Array<z.infer<typeof DailyPriceRow>>;
};

function must(idx: number, label: string): number {
  if (idx < 0) throw new Error(`表頭缺少欄位：「${label}」`);
  return idx;
}

/** Info: (20250904 - Tzuhan) ===== Core Parser ===== */
function parseTwseCsv(buffer: Buffer): ParsedBlocks {
  // Info: (20250904 - Tzuhan) 1) Big5 解碼
  let txt = iconv.decode(buffer, 'big5');

  // Info: (20250904 - Tzuhan) 2) 正規化換行
  txt = txt.replace(/\r\n?/g, '\n');

  // Info: (20250904 - Tzuhan) 3) 預清理："=XXXX" 或 ="XXXX" → "XXXX"
  // Info: (20250904 - Tzuhan)    僅處理以 ="..." 包裹的型態
  txt = txt.replace(/=\s*"(.*?)"/g, '"$1"');

  // Info: (20250904 - Tzuhan) 4) CSV 解析（放寬引號）
  const records: string[][] = parse(txt, {
    delimiter: ',',
    record_delimiter: ['\n'],
    relax_column_count: true,
    relax_quotes: true,
    skip_empty_lines: true,
    trim: true,
  });

  // Info: (20250904 - Tzuhan) 掃描區塊
  let date: Date | null = null;
  let priceHeaderIdx = -1;

  const summaryRows: Array<z.infer<typeof SummaryRow>> = [];
  const priceRows: Array<z.infer<typeof DailyPriceRow>> = [];

  for (let i = 0; i < records.length; i++) {
    const row = records[i];

    // Info: (20250904 - Tzuhan) 日期行（單欄）
    if (row.length === 1) {
      const d = rocToDate(row[0]);
      if (d) {
        date = d;
        if (row[0].includes('每日收盤行情')) {
          // Info: (20250904 - Tzuhan) 下一兩行：單位、表頭
          priceHeaderIdx = i + 2;
        }
      }
    }

    // Info: (20250904 - Tzuhan) 成交統計表頭
    if (row[0] === '成交統計' && row.some((c) => c.includes('成交金額'))) {
      let j = i + 1;
      while (j < records.length && records[j].length >= 4 && /^\d+\./.test(records[j][0])) {
        const [cat, val, vol, cnt] = records[j];
        if (!date) throw new Error('解析成交統計時缺少日期');
        summaryRows.push({
          market: 'TWSE',
          date,
          category: (cat ?? '').replace(/^\d+\.\s*/, '').trim(),
          tradeValue: cleanNumber(val as string),
          tradeVolume: toBigIntOrNull(vol as string) ?? undefined,
          tradeCount: Number(cleanNumber(cnt as string) ?? '0'),
        });
        j++;
      }
    }
  }

  // Info: (20250904 - Tzuhan) 每日收盤行情（逐檔）
  if (priceHeaderIdx > -1 && date) {
    const header = records[priceHeaderIdx];

    const getIdx = (name: string) => header.findIndex((h) => (h ?? '').includes(name));
    const idx = {
      symbol: must(getIdx('證券代號'), '證券代號'),
      name: must(getIdx('證券名稱'), '證券名稱'),
      vol: must(getIdx('成交股數'), '成交股數'),
      cnt: must(getIdx('成交筆數'), '成交筆數'),
      val: must(getIdx('成交金額'), '成交金額'),
      open: must(getIdx('開盤價'), '開盤價'),
      high: must(getIdx('最高價'), '最高價'),
      low: must(getIdx('最低價'), '最低價'),
      close: must(getIdx('收盤價'), '收盤價'),
      sign: must(getIdx('漲跌(+/-)'), '漲跌(+/-)'),
      chg: must(getIdx('漲跌價差'), '漲跌價差'),
      bidP: must(getIdx('最後揭示買價'), '最後揭示買價'),
      bidV: must(getIdx('最後揭示買量'), '最後揭示買量'),
      askP: must(getIdx('最後揭示賣價'), '最後揭示賣價'),
      askV: must(getIdx('最後揭示賣量'), '最後揭示賣量'),
      pe: must(getIdx('本益比'), '本益比'),
    };

    const badLines: string[] = [];

    for (let r = priceHeaderIdx + 1; r < records.length; r++) {
      const row = records[r];
      if (row.length === 1) break; // Info: (20250904 - Tzuhan) 下一段開始
      const symRaw = row[idx.symbol];
      if (!symRaw) {
        badLines.push(`row ${r}: ${JSON.stringify(row)}`);
        continue;
      }

      const data = {
        market: 'TWSE' as const,
        date,
        symbol: normalizeSymbol(symRaw),
        name: row[idx.name],
        tradeVolume: toBigIntOrNull(row[idx.vol]),
        tradeValue: cleanNumber(row[idx.val]) ?? undefined,
        tradeCount: Number(cleanNumber(row[idx.cnt]) ?? '0'),
        openPrice: cleanNumber(row[idx.open]) ?? undefined,
        highPrice: cleanNumber(row[idx.high]) ?? undefined,
        lowPrice: cleanNumber(row[idx.low]) ?? undefined,
        closePrice: cleanNumber(row[idx.close]) ?? undefined,
        changeSign: (row[idx.sign] ?? '').trim() || undefined,
        changeAmount: cleanNumber(row[idx.chg]) ?? undefined,
        finalBidPrice: cleanNumber(row[idx.bidP]) ?? undefined,
        finalBidVolume: toBigIntOrNull(row[idx.bidV]) ?? undefined,
        finalAskPrice: cleanNumber(row[idx.askP]) ?? undefined,
        finalAskVolume: toBigIntOrNull(row[idx.askV]) ?? undefined,
        peRatio: cleanNumber(row[idx.pe]) ?? undefined,
      };

      try {
        const parsed = DailyPriceRow.parse(data);
        priceRows.push(parsed);
      } catch (e) {
        badLines.push(`row ${r} (zod): ${JSON.stringify({ row, error: (e as Error).message })}`);
      }
    }

    if (badLines.length > 0) {
      fs.appendFileSync(
        'failed_lines.log',
        `[${date.toISOString().slice(0, 10)}]\n${badLines.join('\n')}\n`
      );
      console.warn(`WARN: ${badLines.length} bad lines → failed_lines.log`);
    }
  }

  if (!date) {
    throw new Error('無法從檔案解析出交易日期（民國年格式）。');
  }

  return { date, summary: summaryRows, prices: priceRows };
}

/** Info: (20250904 - Tzuhan) ===== Import One File ===== */
async function importOneFile(filePath: string, opts: { dryRun: boolean }) {
  const buf = fs.readFileSync(filePath);
  const { date, summary, prices } = parseTwseCsv(buf);

  if (opts.dryRun) {
    console.log(
      `[DRY] ${path.basename(filePath)} → prices=${prices.length}, summary=${summary.length}`
    );
    return;
  }

  // Info: (20250904 - Tzuhan) 逐檔
  if (prices.length > 0) {
    const data: Prisma.MarketDailyPriceCreateManyInput[] = prices.map((p) => ({
      market: p.market,
      date: p.date,
      symbol: p.symbol,
      name: p.name,
      tradeVolume: p.tradeVolume ?? undefined,
      tradeValue: toDecimalOrNull(p.tradeValue) ?? undefined,
      tradeCount: p.tradeCount ?? undefined,
      openPrice: toDecimalOrNull(p.openPrice) ?? undefined,
      highPrice: toDecimalOrNull(p.highPrice) ?? undefined,
      lowPrice: toDecimalOrNull(p.lowPrice) ?? undefined,
      closePrice: toDecimalOrNull(p.closePrice) ?? undefined,
      changeSign: p.changeSign,
      changeAmount: toDecimalOrNull(p.changeAmount) ?? undefined,
      finalBidPrice: toDecimalOrNull(p.finalBidPrice) ?? undefined,
      finalBidVolume: p.finalBidVolume ?? undefined,
      finalAskPrice: toDecimalOrNull(p.finalAskPrice) ?? undefined,
      finalAskVolume: p.finalAskVolume ?? undefined,
      peRatio: toDecimalOrNull(p.peRatio) ?? undefined,
    }));

    // Info: (20250904 - Tzuhan) 可視需要分批，這裡一次送
    await prisma.marketDailyPrice.createMany({ data, skipDuplicates: true });
  }

  // Info: (20250904 - Tzuhan) 彙總
  if (summary.length > 0) {
    const data: Prisma.MarketDailySummaryCreateManyInput[] = summary.map((s) => ({
      market: s.market,
      date: s.date,
      category: s.category,
      tradeValue: toDecimalOrNull(s.tradeValue) ?? undefined,
      tradeVolume: s.tradeVolume ?? undefined,
      tradeCount: s.tradeCount ?? undefined,
    }));
    await prisma.marketDailySummary.createMany({ data, skipDuplicates: true });
  }

  console.log(
    `[OK] ${path.basename(filePath)} → ${prices.length} rows (prices), ${summary.length} rows (summary)`
  );
}

async function dateHasData(date: Date): Promise<boolean> {
  const priceCount = await prisma.marketDailyPrice.count({ where: { date } });
  const summaryCount = await prisma.marketDailySummary.count({ where: { date } });
  return priceCount > 0 && summaryCount > 0;
}

function dateFromFileName(fp: string): Date | null {
  const m = path.basename(fp).match(/^(\d{8})\.csv$/i);
  if (!m) return null;
  const y = Number(m[1].slice(0, 4)),
    mo = Number(m[1].slice(4, 6)),
    d = Number(m[1].slice(6, 8));
  return new Date(Date.UTC(y, mo - 1, d));
}

/** Info: (20250904 - Tzuhan) ===== CLI Entrypoint ===== */
async function main() {
  const dirOrFile = process.argv[2];
  const dryRun = process.argv.includes('--dry-run');

  if (!dirOrFile) {
    console.error('用法：npx tsx scripts/import_twse_daily.ts <檔案或資料夾路徑> [--dry-run]');
    process.exit(1);
  }

  const stat = fs.statSync(dirOrFile);
  const files: string[] = [];
  if (stat.isDirectory()) {
    for (const name of fs.readdirSync(dirOrFile)) {
      if (/^\d{8}\.csv$/i.test(name)) {
        files.push(path.join(dirOrFile, name));
      }
    }
    files.sort(); // Info: (20250904 - Tzuhan) 由舊到新（可增量）
  } else {
    files.push(dirOrFile);
  }

  let ok = 0,
    fail = 0;
  for (const f of files) {
    try {
      const resume = process.argv.includes('--resume');
      const fileDate = dateFromFileName(f);
      if (resume && fileDate && (await dateHasData(fileDate))) {
        console.log(`[SKIP] ${path.basename(f)} 已有資料（--resume）`);
        continue;
      }
      await importOneFile(f, { dryRun });
      ok++;
    } catch (e) {
      fail++;
      const msg = (e as Error).stack ?? (e as Error).message;
      fs.appendFileSync('failed_files.log', `[${path.basename(f)}]\n${msg}\n`);
      console.error(`[FAIL] ${path.basename(f)} → 詳見 failed_files.log`);
    }
  }

  console.log(`\nDone. ok=${ok}, fail=${fail}${dryRun ? ' (dry-run)' : ''}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

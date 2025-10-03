import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient, Prisma } from '@prisma/client';
import { format, subDays, startOfDay } from 'date-fns';
import { parse } from 'csv-parse/sync';
import iconv from 'iconv-lite';
import { z } from 'zod';

const prisma = new PrismaClient();

/**
 * =================================================================
 * Info: (20251003 - Tzuhan) 1. 核心解析與匯入邏輯
 * =================================================================
 */

const DailyPriceRowSchema = z.object({
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
  changeSign: z.string().optional(),
  changeAmount: z.string().optional(),
  finalBidPrice: z.string().optional(),
  finalBidVolume: z.bigint().or(z.null()).optional(),
  finalAskPrice: z.string().optional(),
  finalAskVolume: z.bigint().or(z.null()).optional(),
  peRatio: z.string().optional(),
});

type SummaryRow = {
  market: 'TWSE';
  date: Date;
  category: string;
  tradeValue?: string | null;
  tradeVolume?: bigint | null;
  tradeCount?: number | null;
};

// Info: (20251003 - Tzuhan) --- Helper Functions ---
function rocToDate(str: string): Date | null {
  const m = str.match(/(\d{2,3})年(\d{2})月(\d{2})日/);
  if (!m) return null;
  const y = 1911 + parseInt(m[1], 10);
  return new Date(Date.UTC(y, parseInt(m[2], 10) - 1, parseInt(m[3], 10)));
}
function cleanNumber(s?: string | null): string | null {
  if (!s) return null;
  const t = s.replace(/,/g, '').trim();
  return t === '' || t === '--' ? null : t;
}
function toBigIntOrNull(s?: string | null): bigint | null {
  const t = cleanNumber(s);
  if (t === null) return null;
  try {
    return BigInt(t);
  } catch {
    return null;
  }
}
function toDecimalOrNull(s?: string | null): Prisma.Decimal | null {
  const t = cleanNumber(s);
  return t === null ? null : new Prisma.Decimal(t);
}
function normalizeSymbol(raw: string): string {
  return raw.replace(/^="?/, '').replace(/"?$/, '').trim();
}
function must(idx: number, label: string): number {
  if (idx < 0) throw new Error(`表頭缺少欄位：「${label}」`);
  return idx;
}

// Info: (20251003 - Tzuhan) --- Core CSV Parser ---
function parseTwseCsv(buffer: Buffer): {
  date: Date;
  summary: SummaryRow[];
  prices: Array<z.infer<typeof DailyPriceRowSchema>>;
} {
  const txt = iconv.decode(buffer, 'big5').replace(/\r\n?/g, '\n');
  const lines = txt.split('\n');

  // Info: (20251003 - Tzuhan) 1. 尋找並解析日期
  const dateLine = lines.find((line) => /(\d{2,3})年(\d{2})月(\d{2})日/.test(line));
  const date = dateLine ? rocToDate(dateLine) : null;
  if (!date) throw new Error('無法從檔案解析出交易日期。');

  // Info: (20251003 - Tzuhan) 2. 更有彈性地分割出 Summary 和 Price 的資料區塊
  const summaryBlock: string[] = [];
  const priceBlock: string[] = [];
  let currentBlock: 'summary' | 'price' | null = null;

  for (const line of lines) {
    if (line.includes('大盤統計資訊')) {
      currentBlock = 'summary';
      continue;
    }
    if (line.includes('證券代號') && line.includes('證券名稱')) {
      currentBlock = 'price';
    }
    if (line.includes('"說明:')) {
      currentBlock = null;
      continue;
    }

    if (currentBlock === 'summary' && line.trim()) summaryBlock.push(line);
    if (currentBlock === 'price' && line.trim()) priceBlock.push(line);
  }

  // Info: (20251003 - Tzuhan) 3. 解析 Summary 區塊
  const summaryRows: SummaryRow[] = [];
  const summaryHeaderIndex = summaryBlock.findIndex((l) => l.includes('成交金額'));
  if (summaryHeaderIndex !== -1) {
    for (let i = summaryHeaderIndex + 1; i < summaryBlock.length; i++) {
      const line = summaryBlock[i];
      if (!/^\d+\./.test(line) && !line.startsWith('證券合計') && !line.startsWith('總計')) break;
      const [cat, val, vol, cnt] = line.split(',').map((s) => s.trim());
      let categoryName = (cat ?? '').replace(/^\d+\.\s*/, '').trim();
      if (categoryName.startsWith('證券合計')) categoryName = '證券合計';
      if (categoryName.startsWith('總計')) categoryName = '總計';
      summaryRows.push({
        market: 'TWSE',
        date,
        category: categoryName,
        tradeValue: cleanNumber(val),
        tradeVolume: toBigIntOrNull(vol),
        tradeCount: Number(cleanNumber(cnt) ?? '0'),
      });
    }
  }

  // Info: (20251003 - Tzuhan) 4. 解析 Price 區塊
  const priceRows: Array<z.infer<typeof DailyPriceRowSchema>> = [];
  if (priceBlock.length > 1) {
    const records: string[][] = parse(priceBlock.join('\n').replace(/=\s*"(.*?)"/g, '"$1"'), {
      relax_column_count: true,
      skip_empty_lines: true,
      trim: true,
    });
    const header = records[0];
    const idx = {
      symbol: must(
        header.findIndex((h) => h.includes('證券代號')),
        '證券代號'
      ),
      name: must(
        header.findIndex((h) => h.includes('證券名稱')),
        '證券名稱'
      ),
      vol: must(
        header.findIndex((h) => h.includes('成交股數')),
        '成交股數'
      ),
      cnt: must(
        header.findIndex((h) => h.includes('成交筆數')),
        '成交筆數'
      ),
      val: must(
        header.findIndex((h) => h.includes('成交金額')),
        '成交金額'
      ),
      open: must(
        header.findIndex((h) => h.includes('開盤價')),
        '開盤價'
      ),
      high: must(
        header.findIndex((h) => h.includes('最高價')),
        '最高價'
      ),
      low: must(
        header.findIndex((h) => h.includes('最低價')),
        '最低價'
      ),
      close: must(
        header.findIndex((h) => h.includes('收盤價')),
        '收盤價'
      ),
      sign: must(
        header.findIndex((h) => h.includes('漲跌')),
        '漲跌'
      ),
      chg: must(
        header.findIndex((h) => h.includes('漲跌價差')),
        '漲跌價差'
      ),
      bidP: must(
        header.findIndex((h) => h.includes('最後揭示買價')),
        '最後揭示買價'
      ),
      bidV: must(
        header.findIndex((h) => h.includes('最後揭示買量')),
        '最後揭示買量'
      ),
      askP: must(
        header.findIndex((h) => h.includes('最後揭示賣價')),
        '最後揭示賣價'
      ),
      askV: must(
        header.findIndex((h) => h.includes('最後揭示賣量')),
        '最後揭示賣量'
      ),
      pe: must(
        header.findIndex((h) => h.includes('本益比')),
        '本益比'
      ),
    };

    for (let r = 1; r < records.length; r++) {
      const row = records[r];
      if (!row || !row[idx.symbol]) continue;
      const data = {
        market: 'TWSE' as const,
        date,
        symbol: normalizeSymbol(row[idx.symbol]),
        name: row[idx.name],
        tradeVolume: toBigIntOrNull(row[idx.vol]),
        tradeValue: cleanNumber(row[idx.val]),
        tradeCount: Number(cleanNumber(row[idx.cnt]) ?? '0'),
        openPrice: cleanNumber(row[idx.open]),
        highPrice: cleanNumber(row[idx.high]),
        lowPrice: cleanNumber(row[idx.low]),
        closePrice: cleanNumber(row[idx.close]),
        changeSign: (row[idx.sign] ?? '').trim().replace('X', '') || undefined,
        changeAmount: cleanNumber(row[idx.chg]),
        finalBidPrice: cleanNumber(row[idx.bidP]),
        finalBidVolume: toBigIntOrNull(row[idx.bidV]),
        finalAskPrice: cleanNumber(row[idx.askP]),
        finalAskVolume: toBigIntOrNull(row[idx.askV]),
        peRatio: cleanNumber(row[idx.pe]),
      };
      try {
        priceRows.push(DailyPriceRowSchema.parse(data));
      } catch (e) {
        console.warn(
          `[WARN] 解析檔案 ${date.toISOString().slice(0, 10)} 中的行失敗: ${JSON.stringify(row)} -> ${(e as Error).message}`
        );
      }
    }
  }

  return { date, summary: summaryRows, prices: priceRows };
}

// Info: (20251003 - Tzuhan) --- DB Writer ---
async function importOneFile(
  filePath: string
): Promise<{ priceCount: number; summaryCount: number }> {
  const { summary, prices } = parseTwseCsv(fs.readFileSync(filePath));
  if (prices.length > 0) {
    const data = prices.map((p) => ({
      market: p.market,
      date: p.date,
      symbol: p.symbol,
      name: p.name,
      tradeVolume: p.tradeVolume,
      tradeValue: toDecimalOrNull(p.tradeValue),
      tradeCount: p.tradeCount,
      openPrice: toDecimalOrNull(p.openPrice),
      highPrice: toDecimalOrNull(p.highPrice),
      lowPrice: toDecimalOrNull(p.lowPrice),
      closePrice: toDecimalOrNull(p.closePrice),
      changeSign: p.changeSign,
      changeAmount: toDecimalOrNull(p.changeAmount),
      finalBidPrice: toDecimalOrNull(p.finalBidPrice),
      finalBidVolume: p.finalBidVolume,
      finalAskPrice: toDecimalOrNull(p.finalAskPrice),
      finalAskVolume: p.finalAskVolume,
      peRatio: toDecimalOrNull(p.peRatio),
    }));
    await prisma.marketDailyPrice.createMany({ data, skipDuplicates: true });
  }
  if (summary.length > 0) {
    const data = summary.map((s) => ({
      market: s.market,
      date: s.date,
      category: s.category,
      tradeValue: toDecimalOrNull(s.tradeValue),
      tradeVolume: s.tradeVolume,
      tradeCount: s.tradeCount,
    }));
    await prisma.marketDailySummary.createMany({ data, skipDuplicates: true });
  }
  return { priceCount: prices.length, summaryCount: summary.length };
}

// Info: (20251003 - Tzuhan) --- File Finder ---
function findCsvFiles(baseDir: string, fromDate: Date): string[] {
  const allFiles: string[] = [];
  if (!fs.existsSync(baseDir)) return [];

  const fromYear = fromDate.getUTCFullYear();
  const fromMonth = fromDate.getUTCMonth() + 1;
  const fromDay = fromDate.getUTCDate();

  for (const yearDir of fs.readdirSync(baseDir).sort()) {
    const year = parseInt(yearDir, 10);
    if (!/^\d{4}$/.test(yearDir) || year < fromYear) continue;

    const fullYearPath = path.join(baseDir, yearDir);
    if (fs.statSync(fullYearPath).isDirectory()) {
      for (const file of fs.readdirSync(fullYearPath).sort()) {
        if (!/^\d{8}\.csv$/i.test(file)) continue;

        const y = parseInt(file.slice(0, 4), 10);
        const m = parseInt(file.slice(4, 6), 10);
        const d = parseInt(file.slice(6, 8), 10);

        if (
          y > fromYear ||
          (y === fromYear && (m > fromMonth || (m === fromMonth && d >= fromDay)))
        ) {
          allFiles.push(path.join(fullYearPath, file));
        }
      }
    }
  }
  return allFiles;
}

/**
 * =================================================================
 * Info: (20251003 - Tzuhan) 2. 全新整合後的匯入與驗證流程
 * =================================================================
 */

async function loadExistingSymbols(): Promise<Set<string>> {
  console.log('🔍 正在從資料庫載入所有已知的股票代號...');
  const symbols = await prisma.stockSymbol.findMany({ select: { symbol: true } });
  const symbolSet = new Set(symbols.map((s) => s.symbol));
  console.log(`✅ 已載入 ${symbolSet.size} 個已知的股票代號。`);
  return symbolSet;
}

// Info: (20251003 - Tzuhan) --- Main Import Logic ---
async function importDailyFiles(dataPath: string, fromDate: Date) {
  console.log(`\n🔵 開始從 ${dataPath} 匯入市場行情檔案...`);
  console.log(`   將處理 ${format(fromDate, 'yyyy-MM-dd')} 及之後的檔案。`);

  // Info: (20251003 - Tzuhan) 1. 一次性讀取所有已存在的日期
  const existingDatesResult = await prisma.marketDailyPrice.findMany({
    where: { date: { gte: fromDate } },
    select: { date: true },
    distinct: ['date'],
  });
  const existingDates = new Set(existingDatesResult.map((d) => format(d.date, 'yyyy-MM-dd')));
  console.log(`   資料庫中已有 ${existingDates.size} 天的近期資料，將會跳過。`);

  // Info: (20251003 - Tzuhan) 2. 從源頭過濾檔案
  const files = findCsvFiles(dataPath, fromDate);
  if (files.length === 0) {
    console.log('在指定路徑下找不到任何需要處理的新 .csv 檔案。');
    return;
  }
  console.log(`總共找到 ${files.length} 個可能需要處理的檔案。`);

  let ok = 0,
    fail = 0,
    skipped = 0;
  for (const f of files) {
    const fileDateStr = path.basename(f).slice(0, 8);
    const formattedFileDate = `${fileDateStr.slice(0, 4)}-${fileDateStr.slice(4, 6)}-${fileDateStr.slice(6, 8)}`;

    // Info: (20251003 - Tzuhan) 3. 使用 Set 快速檢查，避免 DB 查詢
    if (existingDates.has(formattedFileDate)) {
      skipped++;
      continue;
    }

    try {
      const { priceCount, summaryCount } = await importOneFile(f);
      console.log(`[OK] ${path.basename(f)} → ${priceCount} prices, ${summaryCount} summary`);
      ok++;
    } catch (e) {
      fail++;
      console.error(`[FAIL] 處理檔案 ${path.basename(f)} 失敗: ${(e as Error).message}`);
    }
  }
  console.log(`\n🟢 匯入完成。成功: ${ok} 檔案, 失敗: ${fail} 檔案, 跳過: ${skipped} 檔案。`);
}

async function auditNewSymbols(fromDate: Date, existingSymbols: Set<string>) {
  console.log(`\n🔵 開始驗證 ${format(fromDate, 'yyyy-MM-dd')} 之後的新資料...`);
  const newPriceEntries = await prisma.marketDailyPrice.findMany({
    where: { date: { gte: fromDate } },
    select: { symbol: true },
    distinct: ['symbol'],
  });

  const missingSymbols = new Set<string>();
  newPriceEntries.forEach((entry) => {
    if (!existingSymbols.has(entry.symbol)) missingSymbols.add(entry.symbol);
  });

  if (missingSymbols.size > 0) {
    console.warn(
      `\n🟡 警告: 發現 ${missingSymbols.size} 個新的股票代號不存在於 StockSymbol 表中！`
    );
    console.warn('   建議您更新對照表並重新執行 `seed_stock_symbols` 以建立關聯。');
    console.warn('   未知代號列表:', Array.from(missingSymbols).join(', '));
  } else {
    console.log(`🟢 資料驗證完成，所有新匯入的股票代號都已存在於 StockSymbol 表中。`);
  }
}

/**
 * =================================================================
 * Info: (20251003 - Tzuhan) 3. 指令碼主程式 (CLI Entrypoint)
 * =================================================================
 */
async function main() {
  console.log('🚀 啟動常態化市場資料匯入與驗證任務...');

  // Info: (20251003 - Tzuhan) --- 參數解析 ---
  const args = process.argv.slice(2);
  const params: { [key: string]: string } = {};
  const targetPath = args.find((arg) => !arg.startsWith('--'));

  args
    .filter((arg) => arg.startsWith('--'))
    .forEach((arg) => {
      const [key, value] = arg.substring(2).split('=');
      if (key && value) params[key] = value;
    });

  let fromDate: Date;
  if (params['from-date']) {
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(params['from-date']) ||
      isNaN(new Date(params['from-date']).getTime())
    ) {
      console.error('❌ 錯誤: --from-date 格式需為 YYYY-MM-DD');
      process.exit(1);
    }
    fromDate = startOfDay(new Date(params['from-date']));
  } else if (params['from-month']) {
    const [year, month] = params['from-month'].split('-').map(Number);
    if (!year || !month || month < 1 || month > 12) {
      console.error('❌ 錯誤: --from-month 格式需為 YYYY-MM');
      process.exit(1);
    }
    fromDate = new Date(year, month - 1, 1);
  } else if (params['from-year']) {
    const year = parseInt(params['from-year'], 10);
    if (isNaN(year)) {
      console.error('❌ 錯誤: --from-year 需為有效的年份');
      process.exit(1);
    }
    fromDate = new Date(year, 0, 1);
  } else {
    fromDate = startOfDay(subDays(new Date(), 1));
  }

  if (!targetPath) {
    console.error('❌ 錯誤: 請提供每日市場行情資料的來源路徑。');
    console.error(
      '用法: npx tsx scripts/import_market_data.ts <dataPath> [--from-date=YYYY-MM-DD | --from-month=YYYY-MM | --from-year=YYYY]'
    );
    process.exit(1);
  }

  console.log(`資料來源路徑: ${targetPath}`);
  console.log(`將處理 ${format(fromDate, 'yyyy-MM-dd')} 之後的資料...`);

  try {
    const existingSymbols = await loadExistingSymbols();
    await importDailyFiles(targetPath, fromDate);
    await auditNewSymbols(fromDate, existingSymbols);
    console.log('\n✅✅✅ 市場資料匯入與驗證任務已成功完成！ ✅✅✅');
  } catch (error) {
    console.error('\n❌❌❌ 任務過程中發生嚴重錯誤，已中斷。 ❌❌❌', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

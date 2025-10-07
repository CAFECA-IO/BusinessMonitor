import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient, Prisma } from '@prisma/client';
import { format, subDays, startOfDay } from 'date-fns';
import { parse } from 'csv-parse/sync';
import iconv from 'iconv-lite';
import { z } from 'zod';

const prisma = new PrismaClient();

/**
 * Info: (20251003 - Tzuhan)
 * =================================================================
 * 1. 核心解析與匯入邏輯 (從 import_twse_daily.ts 整合而來)
 * =================================================================
 */

// Info: (20251003 - Tzuhan) --- 用於資料驗證的 Zod Schema ---
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

// Info: (20251003 - Tzuhan) --- 用於資料轉換的輔助函式 ---

function rocToDate(str: string): Date | null {
  const m = str.match(/(\d{2,3})年(\d{2})月(\d{2})日/);
  if (!m) return null;
  return new Date(Date.UTC(parseInt(m[1], 10) + 1911, parseInt(m[2], 10) - 1, parseInt(m[3], 10)));
}

function cleanNumber(s?: string | null): string | null {
  if (!s) return null;
  const t = s.replace(/,/g, '').trim();
  return t === '' || t === '--' ? null : t;
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
  return t == null ? null : new Prisma.Decimal(t);
}

function normalizeSymbol(raw: string): string {
  return raw.replace(/^="?/, '').replace(/"?$/, '').trim();
}

// Info: (20251003 - Tzuhan) --- 核心 CSV 解析器 (已重構以提高可讀性) ---

function parseTwseCsv(
  buffer: Buffer,
  filePath: string
): {
  date: Date;
  summary: SummaryRow[];
  prices: Array<z.infer<typeof DailyPriceRowSchema>>;
} {
  const txt = iconv.decode(buffer, 'big5').replace(/\r\n?/g, '\n');
  const lines = txt.split('\n');
  let date: Date | null = null;

  // Info: (20251003 - Tzuhan) 1. 區塊分割：將檔案內容分割為 Summary 和 Price 兩個區塊
  const summaryLines: string[] = [];
  const priceLines: string[] = [];
  let currentBlock: 'summary' | 'price' | null = null;
  let foundSummaryTitle = false;

  for (const line of lines) {
    if (!date) {
      const d = rocToDate(line);
      if (d) date = d;
    }
    if (line.includes('大盤統計資訊')) {
      foundSummaryTitle = true;
      currentBlock = null;
      continue;
    }
    if (foundSummaryTitle && line.includes('成交金額')) {
      currentBlock = 'summary';
      foundSummaryTitle = false;
      continue;
    }
    if (line.includes('證券代號') && line.includes('證券名稱')) {
      currentBlock = 'price';
      priceLines.push(line);
      continue;
    }
    if (line.includes('"說明:') || line.includes('ETF')) {
      currentBlock = null;
      continue;
    }

    if (currentBlock === 'summary') {
      summaryLines.push(line);
    } else if (currentBlock === 'price') {
      priceLines.push(line);
    }
  }

  if (!date) throw new Error(`無法從檔案 ${path.basename(filePath)} 解析出交易日期。`);

  // Info: (20251003 - Tzuhan) 2. 解析 Summary 區塊
  const summaryRows: SummaryRow[] = [];
  for (const line of summaryLines) {
    if (/^\d+\./.test(line) || line.startsWith('證券合計') || line.startsWith('總計')) {
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

  // Info: (20251003 - Tzuhan) 3. 解析 Price 區塊
  const priceRows: Array<z.infer<typeof DailyPriceRowSchema>> = [];
  if (priceLines.length > 1) {
    const records: string[][] = parse(priceLines.join('\n').replace(/=\s*"(.*?)"/g, '"$1"'), {
      relax_column_count: true,
      skip_empty_lines: true,
      trim: true,
    });
    const header = records[0];
    const getIdx = (name: string) => header.findIndex((h) => h.includes(name));
    const idx = {
      symbol: getIdx('證券代號'),
      name: getIdx('證券名稱'),
      vol: getIdx('成交股數'),
      cnt: getIdx('成交筆數'),
      val: getIdx('成交金額'),
      open: getIdx('開盤價'),
      high: getIdx('最高價'),
      low: getIdx('最低價'),
      close: getIdx('收盤價'),
      sign: getIdx('漲跌'),
      chg: getIdx('漲跌價差'),
      bidP: getIdx('最後揭示買價'),
      bidV: getIdx('最後揭示買量'),
      askP: getIdx('最後揭示賣價'),
      askV: getIdx('最後揭示賣量'),
      pe: getIdx('本益比'),
    };
    if (Object.values(idx).some((i) => i < 0))
      throw new Error(`檔案 ${path.basename(filePath)} 的 CSV 表頭不完整或格式錯誤`);

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
          `[WARN] 解析檔案 ${path.basename(filePath)} 的某一行失敗: ${JSON.stringify(row)} -> ${(e as Error).message}`
        );
      }
    }
  }
  return { date, summary: summaryRows, prices: priceRows };
}

async function importOneFile(filePath: string) {
  const fileBuffer = fs.readFileSync(filePath);
  const { summary, prices } = parseTwseCsv(fileBuffer, filePath);
  if (prices.length > 0) {
    await prisma.marketDailyPrice.createMany({
      data: prices.map((p) => ({
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
      })),
      skipDuplicates: true,
    });
  }
  if (summary.length > 0) {
    await prisma.marketDailySummary.createMany({
      data: summary.map((s) => ({
        market: s.market,
        date: s.date,
        category: s.category,
        tradeValue: toDecimalOrNull(s.tradeValue),
        tradeVolume: s.tradeVolume,
        tradeCount: s.tradeCount,
      })),
      skipDuplicates: true,
    });
  }
  console.log(
    `[OK] ${path.basename(filePath)} → ${prices.length} rows (prices), ${summary.length} rows (summary)`
  );
}

/**
 * Info: (20251003 - Tzuhan)
 * =================================================================
 * 2. 全新整合後的匯入與驗證流程
 * =================================================================
 */

// Info: (20251003 - Tzuhan) --- 效能優化：一次性載入所有已存在的日期 ---
async function loadExistingDates(): Promise<Set<string>> {
  console.log('🔍 正在從資料庫載入所有已存在的市場行情日期...');
  const dates = await prisma.marketDailyPrice.findMany({
    select: { date: true },
    distinct: ['date'],
  });
  // Info: (20251003 - Tzuhan) 將日期轉換為 'YYYYMMDD' 格式以便快速比對
  const dateSet = new Set(dates.map((d) => format(d.date, 'yyyyMMdd')));
  console.log(`✅ 已載入 ${dateSet.size} 個已存在的日期。`);
  return dateSet;
}

async function loadExistingSymbols(): Promise<Set<string>> {
  console.log('🔍 正在從資料庫載入所有已知的股票代號...');
  const symbols = await prisma.stockSymbol.findMany({ select: { symbol: true } });
  const symbolSet = new Set(symbols.map((s) => s.symbol));
  console.log(`✅ 已載入 ${symbolSet.size} 個已知的股票代號。`);
  return symbolSet;
}

function findCsvFiles(baseDir: string, fromDate: Date): string[] {
  const allFiles: string[] = [];
  const fromDateStr = format(fromDate, 'yyyyMMdd');

  if (!fs.existsSync(baseDir)) return [];

  for (const yearDir of fs.readdirSync(baseDir)) {
    // Info: (20251003 - Tzuhan) 只處理年份大於等於起始年份的資料夾
    if (!/^\d{4}$/.test(yearDir) || parseInt(yearDir, 10) < fromDate.getFullYear()) continue;
    const fullYearPath = path.join(baseDir, yearDir);

    if (fs.statSync(fullYearPath).isDirectory()) {
      for (const file of fs.readdirSync(fullYearPath)) {
        const fileDateStr = file.slice(0, 8);
        // Info: (20251003 - Tzuhan) 直接比較 YYYYMMDD 字串，確保日期過濾完全正確
        if (/^\d{8}\.csv$/i.test(file) && fileDateStr >= fromDateStr) {
          allFiles.push(path.join(fullYearPath, file));
        }
      }
    }
  }
  return allFiles.sort();
}

async function importDailyFiles(dataPath: string, fromDate: Date, existingDates: Set<string>) {
  console.log(`\n🔵 開始從 ${dataPath} 匯入市場行情檔案...`);
  console.log(`   將處理 ${format(fromDate, 'yyyy-MM-dd')} 及之後的檔案。`);

  const files = findCsvFiles(dataPath, fromDate);
  if (files.length === 0) {
    console.log('在指定路徑下找不到任何需要處理的新 .csv 檔案。');
    return;
  }
  console.log(`總共找到 ${files.length} 個可能需要處理的檔案。`);

  let ok = 0,
    fail = 0;
  for (const f of files) {
    const fileDateStr = path.basename(f).slice(0, 8);
    // Info: (20251003 - Tzuhan) 使用記憶體 Set 進行高效比對，避免資料庫查詢
    if (existingDates.has(fileDateStr)) {
      console.log(`[SKIP] ${path.basename(f)} 的資料已存在於資料庫中。`);
      continue;
    }
    try {
      await importOneFile(f);
      ok++;
    } catch (e) {
      fail++;
      console.error(`[FAIL] 處理檔案 ${path.basename(f)} 失敗: ${(e as Error).message}`);
    }
  }
  console.log(`🟢 匯入完成。成功匯入 ${ok} 個新檔案, 失敗: ${fail} 個檔案。`);
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
 * Info: (20251003 - Tzuhan)
 * =================================================================
 * 3. 指令碼主程式 (CLI Entrypoint)
 * =================================================================
 */
async function main() {
  console.log('🚀 啟動常態化市場資料匯入與驗證任務...');

  // Info: (20251003 - Tzuhan) --- 參數解析  ---
  const args = process.argv.slice(2);
  const parsedArgs: { [key: string]: string | boolean } = {};
  let targetPath: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const [key, value] = arg.split('=');
      const cleanKey = key.substring(2);
      if (value !== undefined) {
        parsedArgs[cleanKey] = value;
      } else if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        // Info: (20251003 - Tzuhan) 處理 --key value 這種格式
        parsedArgs[cleanKey] = args[i + 1];
        i++; // Info: (20251003 - Tzuhan) 跳過下一個值，因為它已經被當作參數值了
      } else {
        // Info: (20251003 - Tzuhan) 處理 --flag 這種布林旗標
        parsedArgs[cleanKey] = true;
      }
    } else if (!targetPath) {
      // Info: (20251003 - Tzuhan) 第一個不以 '--' 開頭的參數被視為 targetPath
      targetPath = arg;
    }
  }

  let fromDate: Date;
  const fromDateRaw = parsedArgs['from-date'] as string;
  const fromMonthRaw = parsedArgs['from-month'] as string;
  const fromYearRaw = parsedArgs['from-year'] as string;

  try {
    if (fromDateRaw) {
      let dateStr = fromDateRaw;
      // Info: (20251003 - Tzuhan) 支援 YYYYMMDD 格式
      if (/^\d{8}$/.test(dateStr)) {
        dateStr = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr) || isNaN(new Date(dateStr).getTime())) {
        throw new Error('❌ 錯誤: --from-date 格式需為 YYYY-MM-DD 或 YYYYMMDD');
      }
      fromDate = startOfDay(new Date(dateStr));
    } else if (fromMonthRaw) {
      const [year, month] = fromMonthRaw.split('-').map(Number);
      if (!year || !month || month < 1 || month > 12) {
        throw new Error('❌ 錯誤: --from-month 格式需為 YYYY-MM');
      }
      fromDate = new Date(year, month - 1, 1);
    } else if (fromYearRaw) {
      const year = parseInt(fromYearRaw, 10);
      if (isNaN(year)) {
        throw new Error('❌ 錯誤: --from-year 需為有效的年份');
      }
      fromDate = new Date(year, 0, 1);
    } else {
      fromDate = startOfDay(subDays(new Date(), 1));
    }
  } catch (e) {
    console.error((e as Error).message);
    process.exit(1);
  }

  if (!targetPath) {
    console.error('❌ 錯誤: 請提供每日市場行情資料的來源路徑。');
    console.error(
      '用法: npx tsx scripts/004_import_market_data.ts <dataPath> [--from-date=YYYY-MM-DD | --from-month=YYYY-MM | --from-year=YYYY]'
    );
    process.exit(1);
  }

  console.log(`資料來源路徑: ${targetPath}`);
  console.log(`將處理 ${format(fromDate, 'yyyy-MM-dd')} 之後的資料...`);

  try {
    const [existingDates, existingSymbols] = await Promise.all([
      loadExistingDates(),
      loadExistingSymbols(),
    ]);
    await importDailyFiles(targetPath, fromDate, existingDates);
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

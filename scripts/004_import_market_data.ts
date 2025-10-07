import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient, Prisma, Board } from '@prisma/client';
import { format, subDays, startOfDay } from 'date-fns';
import { parse } from 'csv-parse/sync';
import iconv from 'iconv-lite';
import { z } from 'zod';

const prisma = new PrismaClient();

/**
 * Info: (20251007 - Tzuhan)
 * =================================================================
 * 1. 核心解析與匯入邏輯
 * =================================================================
 */

// Info: (20251007 - Tzuhan) --- Zod Schema，允許價格欄位為 null ---
const DailyPriceRowSchema = z.object({
  market: z.literal('TWSE'),
  date: z.date(),
  symbol: z.string().min(1),
  name: z.string().optional(),
  tradeVolume: z.bigint().or(z.null()),
  tradeValue: z.string().or(z.null()).optional(),
  tradeCount: z.number().int().or(z.null()),
  openPrice: z.string().nullable(),
  highPrice: z.string().nullable(),
  lowPrice: z.string().nullable(),
  closePrice: z.string().nullable(),
  changeSign: z.string().optional(),
  changeAmount: z.string().nullable(),
  finalBidPrice: z.string().nullable(),
  finalBidVolume: z.bigint().or(z.null()).optional(),
  finalAskPrice: z.string().nullable(),
  finalAskVolume: z.bigint().or(z.null()).optional(),
  peRatio: z.string().nullable(),
});

type SummaryRow = {
  market: 'TWSE';
  date: Date;
  category: string;
  tradeValue?: string | null;
  tradeVolume?: bigint | null;
  tradeCount?: number | null;
};

// Info: (20251007 - Tzuhan) --- 用於資料轉換的輔助函式 ---

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

function classifyBoard(symbol: string): Board {
  return /^\d{4}$/.test(symbol.trim()) ? Board.LISTED : Board.OTC;
}

// Info: (20251007 - Tzuhan) --- 核心 CSV 解析器 ---

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
    if (line.includes('"說明:') || line.includes('ETF') || line.includes('備註:')) {
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
      if (!row || !row[idx.symbol] || row[idx.symbol].includes('備註')) continue;
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
        // Info: (20251007 - Tzuhan) 記錄解析失敗的行，但不中斷流程
        console.warn(
          `[WARN] 解析檔案 ${path.basename(filePath)} 的某一行因格式問題被跳過: ${JSON.stringify(row)} -> ${(e as Error).message}`
        );
      }
    }
  }
  return { date, summary: summaryRows, prices: priceRows };
}

async function importOneFile(
  filePath: string,
  existingSymbols: Set<string>,
  newSymbolLog: Set<string>
) {
  const fileBuffer = fs.readFileSync(filePath);
  const { summary, prices } = parseTwseCsv(fileBuffer, filePath);

  const symbolsInFile = new Set(prices.map((p) => p.symbol));
  const newSymbols = new Set<string>();
  symbolsInFile.forEach((s) => {
    if (!existingSymbols.has(s)) {
      newSymbols.add(s);
    }
  });

  if (newSymbols.size > 0) {
    const newSymbolData = Array.from(newSymbols).map((symbol) => {
      const priceData = prices.find((p) => p.symbol === symbol);
      return {
        symbol,
        name: priceData?.name || 'N/A',
        board: classifyBoard(symbol),
        updated_at: new Date(),
      };
    });

    await prisma.stockSymbol.createMany({
      data: newSymbolData,
      skipDuplicates: true,
    });

    newSymbols.forEach((s) => {
      existingSymbols.add(s);
      newSymbolLog.add(s);
    });
    console.log(
      `[INFO] 在 ${path.basename(filePath)} 中發現並新增了 ${newSymbols.size} 個股票代號。`
    );
  }

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
    `[OK] ${path.basename(filePath)} → 寫入/更新 ${prices.length} 筆 (prices), ${summary.length} 筆 (summary)`
  );
}

/**
 * Info: (20251007 - Tzuhan)
 * =================================================================
 * 2. 全新整合後的匯入與驗證流程
 * =================================================================
 */

async function loadExistingDates(): Promise<Set<string>> {
  console.log('🔍 正在從資料庫載入所有已存在的市場行情日期...');
  const dates = await prisma.marketDailyPrice.findMany({
    select: { date: true },
    distinct: ['date'],
  });
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

  function walk(currentDir: string) {
    if (!fs.existsSync(currentDir)) return;
    try {
      const entries = fs.readdirSync(currentDir);
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry);
        try {
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            walk(fullPath);
          } else {
            const fileDateStr = path.basename(entry).slice(0, 8);
            if (/^\d{8}\.csv$/i.test(entry) && fileDateStr >= fromDateStr) {
              allFiles.push(fullPath);
            }
          }
        } catch (e) {
          console.error(`[WARN] 無法讀取路徑屬性: ${fullPath}`, e);
        }
      }
    } catch (e) {
      console.error(`[WARN] 無法讀取資料夾: ${currentDir}`, e);
    }
  }

  walk(baseDir);
  return allFiles.sort();
}

async function importDailyFiles(
  dataPath: string,
  fromDate: Date,
  existingDates: Set<string>,
  existingSymbols: Set<string>
) {
  console.log(`\n🔵 開始從 ${dataPath} 匯入市場行情檔案...`);
  console.log(`   將處理 ${format(fromDate, 'yyyy-MM-dd')} 及之後的檔案。`);

  const files = findCsvFiles(dataPath, fromDate);
  if (files.length === 0) {
    console.log('   在指定路徑下找不到任何需要處理的新 .csv 檔案。');
    return new Set<string>();
  }
  console.log(`   總共找到 ${files.length} 個檔案準備處理。`);

  const newSymbolLog = new Set<string>();
  let ok = 0,
    fail = 0;

  for (const f of files) {
    const fileDateStr = path.basename(f).slice(0, 8);
    if (existingDates.has(fileDateStr)) {
      continue;
    }
    try {
      // Info: (20251007 - Tzuhan) 核心修正：移除日期檢查，總是處理檔案
      await importOneFile(f, existingSymbols, newSymbolLog);
      ok++;
    } catch (e) {
      fail++;
      console.error(`[FAIL] 處理檔案 ${path.basename(f)} 失敗: ${(e as Error).message}`);
    }
  }
  console.log(`🟢 匯入完成。成功處理 ${ok} 個檔案, 失敗: ${fail} 個檔案。`);
  return newSymbolLog;
}

function writeNewSymbolsLog(newSymbols: Set<string>) {
  if (newSymbols.size === 0) return;

  const logDir = path.resolve(process.cwd(), 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  const logFile = path.join(logDir, 'new_symbols_to_backfill.log');
  const content = `[${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}] 發現 ${newSymbols.size} 個新代號:\n${Array.from(newSymbols).join('\n')}\n\n`;

  fs.appendFileSync(logFile, content);
  console.log(`\n📝 已將 ${newSymbols.size} 個新發現的股票代號記錄至 ${logFile}`);
}

/**
 * Info: (20251007 - Tzuhan)
 * =================================================================
 * 3. 指令碼主程式 (CLI Entrypoint)
 * =================================================================
 */
async function main() {
  console.log('🚀 啟動常態化市場資料匯入與驗證任務...');

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
        parsedArgs[cleanKey] = args[i + 1];
        i++;
      } else {
        parsedArgs[cleanKey] = true;
      }
    } else if (!targetPath) {
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
      if (/^\d{8}$/.test(dateStr)) {
        dateStr = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr) || isNaN(new Date(dateStr).getTime())) {
        throw new Error('❌ 錯誤: --from-date 格式需為 YYYY-MM-DD 或 YYYYMMDD');
      }
      fromDate = startOfDay(new Date(dateStr));
    } else if (fromMonthRaw) {
      let year: number | undefined;
      let month: number | undefined;
      if (/^\d{6}$/.test(fromMonthRaw)) {
        year = parseInt(fromMonthRaw.slice(0, 4), 10);
        month = parseInt(fromMonthRaw.slice(4, 6), 10);
      } else if (/^\d{4}-\d{2}$/.test(fromMonthRaw)) {
        [year, month] = fromMonthRaw.split('-').map(Number);
      }
      if (!year || !month || month < 1 || month > 12) {
        throw new Error('❌ 錯誤: --from-month 格式需為 YYYY-MM 或 YYYYMM');
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

  console.log(`   資料來源路徑: ${targetPath}`);
  console.log(`   將處理 ${format(fromDate, 'yyyy-MM-dd')} 之後的資料...`);

  try {
    // Info: (20251007 - Tzuhan) 核心修正：不再需要 loadExistingDates
    const [existingDates, existingSymbols] = await Promise.all([
      loadExistingDates(),
      loadExistingSymbols(),
    ]);
    const newSymbolsFound = await importDailyFiles(
      targetPath,
      fromDate,
      existingDates,
      existingSymbols
    );

    if (newSymbolsFound.size > 0) {
      writeNewSymbolsLog(newSymbolsFound);
      console.warn(`\n🟡 警告: 發現 ${newSymbolsFound.size} 個新的股票代號！`);
      console.warn('   這些代號已被自動新增至 StockSymbol 表，但尚未關聯公司。');
      console.warn(
        '   請更新您的公司對照表，並執行 `npx tsx scripts/003_backfill_company_ids.ts <path/to/mapping_data>` 以完成關聯。'
      );
      console.warn('   新代號列表:', Array.from(newSymbolsFound).join(', '));
    } else {
      console.log(`\n🟢 資料驗證完成，沒有發現新的股票代號。`);
    }

    console.log('\n✅✅✅ 市場資料匯入與驗證任務已成功完成！ ✅✅✅');
  } catch (error) {
    console.error('\n❌❌❌ 任務過程中發生嚴重錯誤，已中斷。 ❌❌❌', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

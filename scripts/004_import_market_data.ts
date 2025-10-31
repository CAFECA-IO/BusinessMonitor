import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient, Prisma, Board } from '@prisma/client';
import { format, addDays, startOfDay } from 'date-fns';
import { parse } from 'csv-parse/sync';
import iconv from 'iconv-lite';
import { z } from 'zod';
import { fetchCompanyDataBySymbol } from 'scripts/lib/fetch_mops'; // Info: (20251030 - Tzuhan)匯入 MOPS 爬蟲

const prisma = new PrismaClient();

/**
 * Info: (20251007 - Tzuhan)
 * =================================================================
 * 1. 核心解析與匯入邏輯
 * =================================================================
 */

// Info: (20251015 - Tzuhan) Info: (20251007 - Tzuhan) --- Zod Schema，允許價格欄位為 null ---
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

  // Info: (20251030 - Tzuhan) --- 步驟 1: (網路/快取) 在交易*之外*，*並行*爬取所有新代號的 MOPS 資料 ---
  const companiesToCreate: Prisma.CompanyCreateInput[] = [];
  // 修正：symbolsDataForUpsert 用於收集所有新代號的資料 (包含公司和ETF)
  const symbolsDataForUpsert: (Prisma.StockSymbolCreateInput & { symbol: string })[] = [];
  const mopsDataMap = new Map<string, Prisma.CompanyCreateInput | null>();
  const priceDataMap = new Map(prices.map((p) => [p.symbol, p]));

  if (newSymbols.size > 0) {
    console.log(
      `[INFO] 在 ${path.basename(filePath)} 發現 ${newSymbols.size} 個新代號，開始並行爬取 MOPS...`
    );
    const mopsFetchPromises = Array.from(newSymbols).map((symbol) =>
      fetchCompanyDataBySymbol(symbol).then((companyInfo) => ({
        symbol,
        companyInfo,
      }))
    );

    // Info: (20251030 - Tzuhan) 等待所有爬蟲完成
    const mopsFetchResults = await Promise.all(mopsFetchPromises);

    // Info: (20251030 - Tzuhan) --- 步驟 2: (準備) 整理要寫入資料庫的資料 ---
    const regNoSet = new Set<string>();

    for (const { symbol, companyInfo } of mopsFetchResults) {
      const priceData = priceDataMap.get(symbol);

      if (companyInfo && companyInfo.registrationNo) {
        // Info: (20251030 - Tzuhan) ** 情況 A: 爬到公司資料 **
        if (!regNoSet.has(companyInfo.registrationNo)) {
          companiesToCreate.push(companyInfo);
          regNoSet.add(companyInfo.registrationNo);
        }
        mopsDataMap.set(symbol, companyInfo);
      } else {
        // Info: (20251030 - Tzuhan) ** 情況 B: 爬不到資料 (ETF/權證) **
        symbolsDataForUpsert.push({
          symbol: symbol,
          name: priceData?.name || 'N/A',
          board: classifyBoard(symbol),
          updated_at: new Date(),
          company: undefined,
        });
      }
    }
  }

  // Info: (20251030 - Tzuhan) --- 步驟 3: (資料庫) 在單一 Transaction 中執行所有寫入操作 ---
  await prisma.$transaction(
    async (tx) => {
      // Info: (20251030 - Tzuhan) 3a: 寫入新公司 (Company)
      if (companiesToCreate.length > 0) {
        console.log(`[DB] 正在 Upsert ${companiesToCreate.length} 筆公司資料...`);
        for (const companyData of companiesToCreate) {
          await tx.company.upsert({
            where: { registrationNo: companyData.registrationNo },
            create: companyData,
            update: companyData,
          });
        }
      }

      // Info: (20251030 - Tzuhan) 3b: 建立新代號 (StockSymbol) - 包含已關聯和未關聯的
      const regNosToQuery = companiesToCreate.map((c) => c.registrationNo);
      const companyMap = new Map<string, number>();

      if (regNosToQuery.length > 0) {
        // Info: (20251030 - Tzuhan) 取得剛剛寫入的公司 ID
        const companies = await tx.company.findMany({
          where: { registrationNo: { in: regNosToQuery } },
          select: { id: true, registrationNo: true },
        });
        companies.forEach((c) => companyMap.set(c.registrationNo, c.id));
      }

      // Info: (20251030 - Tzuhan) 補完那些需要關聯 company_id 的 StockSymbol
      for (const [symbol, companyInfo] of mopsDataMap.entries()) {
        if (companyInfo && companyInfo.registrationNo) {
          const companyId = companyMap.get(companyInfo.registrationNo);
          const priceData = priceDataMap.get(symbol);
          symbolsDataForUpsert.push({
            symbol: symbol,
            name: companyInfo.name || priceData?.name || 'N/A',
            board: classifyBoard(symbol),
            updated_at: new Date(),
            company: companyId ? { connect: { id: companyId } } : undefined, // 關聯 ID
          });
        }
      }

      if (symbolsDataForUpsert.length > 0) {
        console.log(`[DB] 正在 Upsert ${symbolsDataForUpsert.length} 筆股票代號...`);
        for (const symbolData of symbolsDataForUpsert) {
          const createData = {
            symbol: symbolData.symbol,
            name: symbolData.name,
            board: symbolData.board,
            company: symbolData.company,
            updated_at: symbolData.updated_at,
          };

          const updateData = {
            name: symbolData.name,
            company: symbolData.company,
            updated_at: new Date(),
          };

          await tx.stockSymbol.upsert({
            where: { symbol: symbolData.symbol },
            create: createData,
            update: updateData,
          });
        }
      }

      // 3c: 寫入每日價格 (MarketDailyPrice)
      if (prices.length > 0) {
        console.log(`[DB] 正在 CreateMany ${prices.length} 筆每日價格...`);
        await tx.marketDailyPrice.createMany({
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

      // 3d: 寫入每日總覽 (MarketDailySummary)
      if (summary.length > 0) {
        console.log(`[DB] 正在 CreateMany ${summary.length} 筆每日總覽...`);
        await tx.marketDailySummary.createMany({
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
    },
    {
      maxWait: 30000, // 30 秒
      timeout: 60000, // 60 秒
    }
  ); // Info: (20251030 - Tzuhan) Transaction 結束

  // Info: (20251030 - Tzuhan) 只有在 transaction 成功後，才更新記憶體中的 set
  newSymbols.forEach((s) => {
    existingSymbols.add(s);
    // Info: (20251030 - Tzuhan) 記錄那些爬不到資料的代號
    if (!mopsDataMap.has(s) || !mopsDataMap.get(s)) {
      newSymbolLog.add(s);
    }
  });

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

// Info: (20251030 - Tzuhan) 增加 fromDate 參數，只載入需要的日期
async function loadExistingDates(fromDate: Date, targetYear?: string): Promise<Set<string>> {
  console.log(`🔍 正在從資料庫載入 ${format(fromDate, 'yyyy-MM-dd')} 之後已存在的市場行情日期...`);

  // Info: (20251030 - Tzuhan) 基礎 where 條件：只撈 fromDate 之後的
  let whereClause: Prisma.MarketDailyPriceWhereInput = {
    date: { gte: fromDate },
  };

  if (targetYear) {
    // Info: (20251030 - Tzuhan) 如果指定了年份，增加年份的篩選
    const year = parseInt(targetYear, 10);
    const startDate = new Date(Date.UTC(year, 0, 1));
    const endDate = new Date(Date.UTC(year + 1, 0, 0, 23, 59, 59));
    // Info: (20251030 - Tzuhan) 合併 fromDate 和年份的篩選
    whereClause = {
      AND: [whereClause, { date: { gte: startDate, lte: endDate } }],
    };
    console.log(`   (僅篩選年份: ${targetYear})`);
  }

  const dates = await prisma.marketDailyPrice.findMany({
    where: whereClause,
    select: { date: true },
    distinct: ['date'],
  });
  const dateSet = new Set(dates.map((d) => format(d.date, 'yyyyMMdd')));
  console.log(`✅ 已載入 ${dateSet.size} 個相關日期。 (效能優化)`);
  return dateSet;
}

async function loadExistingSymbols(): Promise<Set<string>> {
  console.log('🔍 正在從資料庫載入所有已知的股票代號...');
  const symbols = await prisma.stockSymbol.findMany({ select: { symbol: true } });
  const symbolSet = new Set(symbols.map((s) => s.symbol));
  console.log(`✅ 已載入 ${symbolSet.size} 個已知的股票代號。`);
  return symbolSet;
}

function findCsvFiles(baseDir: string, fromDate: Date, targetYear?: string): string[] {
  const allFiles: string[] = [];
  let searchDir = baseDir;

  if (targetYear) {
    searchDir = path.join(baseDir, targetYear);
    console.log(`🎯 已鎖定目標資料夾: ${searchDir}`);
  }
  const fromDateStr = format(fromDate, 'yyyyMMdd');

  function walk(currentDir: string) {
    if (!fs.existsSync(currentDir)) {
      if (targetYear) console.warn(`[WARN] 找不到年份資料夾: ${currentDir}，略過...`);
      return;
    }
    try {
      const entries = fs.readdirSync(currentDir);
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry);
        try {
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory() && !targetYear) {
            walk(fullPath);
          } else if (/^\d{8}\.csv$/i.test(entry)) {
            const fileDateStr = path.basename(entry).slice(0, 8);
            if (fileDateStr >= fromDateStr) {
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
  existingSymbols: Set<string>,
  targetYear?: string
) {
  console.log(`\n🔵 開始從 ${dataPath} 匯入市場行情檔案...`);
  if (!targetYear) {
    console.log(`   將處理 ${format(fromDate, 'yyyy-MM-dd')} 之後的所有檔案。`);
  }

  const files = findCsvFiles(dataPath, fromDate, targetYear);

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
    // Info: (20251030 - Tzuhan) 這裡的 existingDates 已經被優化過了，只包含相關日期
    if (existingDates.has(fileDateStr)) {
      console.log(`↪️  檔案 ${fileDateStr}.csv 已存在於資料庫中，略過匯入。`);
      continue;
    }
    try {
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

  const logDir = path.resolve(process.cwd(), 'private', 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  const dateSuffix = format(new Date(), 'yyyyMMdd');
  const logFile = path.join(logDir, `new_symbols_to_backfill_${dateSuffix}.log`);
  const content = `[${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}] 發現 ${newSymbols.size} 個新代號 (未能在 MOPS 找到關聯):\n${Array.from(newSymbols).join('\n')}\n\n`;

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
  console.log('🚀 啟動市場資料匯入任務...');

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
  let targetYear: string | undefined;

  try {
    if (fromDateRaw) {
      // Info: (20251030 - Tzuhan) 1. 如果 --from-date 存在，優先使用
      let dateStr = fromDateRaw;
      if (/^\d{8}$/.test(dateStr)) {
        dateStr = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr) || isNaN(new Date(dateStr).getTime())) {
        throw new Error('❌ 錯誤: --from-date 格式需為 YYYY-MM-DD 或 YYYYMMDD');
      }
      fromDate = startOfDay(new Date(dateStr));
    } else if (fromMonthRaw) {
      // Info: (20251030 - Tzuhan) 2. 如果 --from-month 存在，次要使用
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
      // Info: (20251030 - Tzuhan) 3. 如果 --from-year 存在，再次要使用
      const year = parseInt(fromYearRaw, 10);
      if (isNaN(year)) {
        throw new Error('❌ 錯誤: --from-year 需為有效的年份');
      }
      targetYear = fromYearRaw;
      fromDate = new Date(Date.UTC(year, 0, 1));
    } else {
      // Info: (20251030 - Tzuhan) 4. (預設行為) 查詢資料庫決定起始日
      console.log('ℹ️  未指定日期參數，正在查詢資料庫決定預設起始日期...');
      const latestEntry = await prisma.marketDailyPrice.findFirst({
        orderBy: { date: 'desc' },
        select: { date: true },
      });

      if (latestEntry) {
        // Info: (20251030 - Tzuhan) 從資料庫最新日期的 *下一天* 開始處理
        // Info: (20251030 - Tzuhan) 使用 .getTime() 和 86400000 毫秒 (24小時) 來安全地增加一天 (避免時區問題)
        const nextDay = addDays(new Date(latestEntry.date.getTime()), 1);
        fromDate = startOfDay(nextDay);
      } else {
        // Info: (20251030 - Tzuhan) 資料庫為空，使用硬編碼的預設起始日 (同 download.sh)
        fromDate = new Date(Date.UTC(2024, 0, 1)); // 2024-01-01
      }
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

  if (targetPath.startsWith('~/')) {
    targetPath = path.join(process.env.HOME || '', targetPath.substring(2));
  }

  console.log(`   資料來源路徑: ${path.resolve(targetPath)}`);
  if (targetYear) {
    console.log(`   🎯 目標處理年份: ${targetYear}`);
  } else {
    console.log(`   處理範圍: ${format(fromDate, 'yyyy-MM-dd')} 之後的所有資料...`);
  }

  try {
    // Info: (20251030 - Tzuhan) 將計算好的 fromDate 傳入 loadExistingDates
    const [existingDates, existingSymbols] = await Promise.all([
      loadExistingDates(fromDate, targetYear),
      loadExistingSymbols(),
    ]);
    const newSymbolsFound = await importDailyFiles(
      targetPath,
      fromDate,
      existingDates,
      existingSymbols,
      targetYear
    );

    if (newSymbolsFound.size > 0) {
      // Info: (20251030 - Tzuhan) 現在这个日誌只會包含那些 *真的* 爬不到資料的代號 (例如 ETF)
      writeNewSymbolsLog(newSymbolsFound);
      console.warn(
        `\n🟡 警告: 發現 ${newSymbolsFound.size} 個無法自動關聯的代號 (例如 ETF 或權證)。`
      );
      console.warn('   這些代號已被新增至 StockSymbol 表，但未關聯公司。');
      console.warn('   無法關聯的代號列表:', Array.from(newSymbolsFound).join(', '));
    } else {
      console.log(`\n🟢 資料驗證完成，所有新代號均已自動關聯或新增。`);
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

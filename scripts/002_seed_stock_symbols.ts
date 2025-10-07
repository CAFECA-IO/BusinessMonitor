import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse/sync';
import { PrismaClient, Prisma, Board } from '@prisma/client';
import iconv from 'iconv-lite';

const prisma = new PrismaClient();

interface IMappingCsvRow {
  公司代號: string;
  公司名稱: string;
  [key: string]: string;
}

// Info: (20251003 - Tzuhan) 根據股票代號判斷其市場別
function classifyBoard(symbol: string): Board {
  return /^\d{4}$/.test(symbol.trim()) ? Board.LISTED : Board.OTC;
}

async function main() {
  console.log('🚀 開始從對照表建立 StockSymbol 總表...');

  const mappingDataPath = process.argv[2];
  if (!mappingDataPath) {
    console.error('❌ 錯誤: 請提供包含「公司代號」對照表的 CSV 檔案或資料夾路徑。');
    console.error('用法: npx tsx scripts/seed_stock_symbols.ts <path/to/mapping/folder_or_file>');
    process.exit(1);
  }

  // Info: (20251003 - Tzuhan) --- 讀取所有對照表 CSV ---
  const allRecords: IMappingCsvRow[] = [];
  const filesToRead: string[] = [];

  if (fs.statSync(mappingDataPath).isDirectory()) {
    filesToRead.push(
      ...fs
        .readdirSync(mappingDataPath)
        .filter((f) => f.toLowerCase().endsWith('.csv'))
        .map((f) => path.join(mappingDataPath, f))
    );
  } else {
    filesToRead.push(mappingDataPath);
  }

  if (filesToRead.length === 0) {
    console.error(`❌ 錯誤: 在路徑 ${mappingDataPath} 中找不到任何 .csv 檔案。`);
    return;
  }

  console.log(`📂 正在從 ${filesToRead.length} 個對照表檔案中讀取資料...`);
  for (const csvPath of filesToRead) {
    try {
      const fileBuffer = fs.readFileSync(csvPath);
      const decodedCsv = iconv.decode(fileBuffer, 'big5');
      const records: IMappingCsvRow[] = parse(decodedCsv, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
      allRecords.push(...records);
    } catch (error) {
      console.error(`❌ 讀取或解析檔案 ${csvPath} 時發生錯誤:`, error);
    }
  }

  // Info: (20251003 - Tzuhan) --- 整理並去重 ---
  const symbolMap = new Map<string, { name?: string; board: Board }>();
  for (const record of allRecords) {
    const symbol = record['公司代號']?.trim();
    if (symbol && !symbolMap.has(symbol)) {
      symbolMap.set(symbol, {
        name: record['公司名稱']?.trim() || undefined,
        board: classifyBoard(symbol),
      });
    }
  }

  const toInsert: Prisma.StockSymbolCreateManyInput[] = Array.from(symbolMap.entries()).map(
    ([symbol, data]) => ({
      symbol,
      name: data.name,
      board: data.board,
      updated_at: new Date(),
    })
  );

  if (toInsert.length === 0) {
    console.log('🟡 未發現任何可供建立的股票代號。');
    return;
  }

  console.log(`📝 準備將 ${toInsert.length} 筆獨特的股票代號寫入資料庫...`);

  // Info: (20251003 - Tzuhan) --- 寫入資料庫 ---
  const result = await prisma.stockSymbol.createMany({
    data: toInsert,
    skipDuplicates: true, // Info: (20251003 - Tzuhan) 如果代號已存在，則忽略
  });

  console.log(`\n--- 任務完成 ---`);
  console.log(`🎉 成功新增 ${result.count} 筆 StockSymbol 記錄。`);
}

main()
  .catch((e) => {
    console.error('❌ 執行過程中發生嚴重錯誤：', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

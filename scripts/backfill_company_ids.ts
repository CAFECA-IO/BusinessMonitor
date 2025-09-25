import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse/sync';
import { PrismaClient } from '@prisma/client';
import iconv from 'iconv-lite';

const prisma = new PrismaClient();

interface IMopsCsvRow {
  公司代號: string;
  公司名稱: string;
  營利事業統一編號: string;
  [key: string]: string;
}

async function main() {
  console.log('🚀 開始回填 StockSymbol 的 company_id (使用營利事業統一編號)...');

  // --- 步驟 1: 讀取資料夾路徑 ---
  const folderPath = process.argv[2];
  if (!folderPath) {
    console.error('❌ 錯誤：請提供包含 CSV 檔案的資料夾路徑作為命令列參數。');
    console.error('用法: npx tsx scripts/backfill_company_ids.ts <path/to/your/folder>');
    return;
  }
  const resolvedFolderPath = path.resolve(process.cwd(), folderPath);

  if (!fs.existsSync(resolvedFolderPath) || !fs.lstatSync(resolvedFolderPath).isDirectory()) {
    console.error(`❌ 錯誤：找不到資料夾: ${resolvedFolderPath}`);
    return;
  }

  // --- 步驟 2: 讀取所有 CSV 並建立「股票代號 -> 統一編號」的 Map ---
  const allRecords: IMopsCsvRow[] = [];
  const files = fs.readdirSync(resolvedFolderPath).filter((f) => f.toLowerCase().endsWith('.csv'));

  if (files.length === 0) {
    console.error(`❌ 錯誤：在資料夾 ${resolvedFolderPath} 中找不到任何 .csv 檔案。`);
    return;
  }

  console.log(`📂 正在從 ${files.length} 個 CSV 檔案讀取資料...`);
  for (const file of files) {
    const csvPath = path.join(resolvedFolderPath, file);
    try {
      const fileBuffer = fs.readFileSync(csvPath);
      const decodedCsv = iconv.decode(fileBuffer, 'big5');
      const records: IMopsCsvRow[] = parse(decodedCsv, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
      allRecords.push(...records);
    } catch (error) {
      console.error(`❌ 讀取或解析檔案 ${file} 時發生錯誤:`, error);
    }
  }

  const symbolToRegNoMap = new Map<string, string>();
  for (const record of allRecords) {
    const symbol = record['公司代號'];
    // CSV 中的統一編號可能包含非數字字元，例如 '\t'，需要清理
    const regNo = record['營利事業統一編號']?.replace(/\D/g, '');
    if (symbol && regNo) {
      symbolToRegNoMap.set(symbol, regNo);
    }
  }
  console.log(`🗺️  成功載入 ${symbolToRegNoMap.size} 筆 [代號 -> 統一編號] 的對應關係。`);

  // --- 步驟 3: 建立「統一編號 -> company.id」的 Map ---
  const allCompanies = await prisma.company.findMany({
    select: { id: true, registrationNo: true },
  });
  const regNoToCompanyIdMap = new Map<string, number>();
  for (const company of allCompanies) {
    const cleanedRegNo = company.registrationNo.replace(/\D/g, '');
    regNoToCompanyIdMap.set(cleanedRegNo, company.id);
  }
  console.log(`🏢 成功載入 ${regNoToCompanyIdMap.size} 筆 [統一編號 -> company.id] 的對應關係。`);

  // --- 步驟 4: 找出所有尚未關聯的 StockSymbol ---
  const symbolsToUpdate = await prisma.stockSymbol.findMany({
    where: { company_id: null },
  });
  console.log(`🔍 發現 ${symbolsToUpdate.length} 筆 StockSymbol 需要更新...`);

  // --- 步驟 5: 遍歷並更新 ---
  let updatedCount = 0;
  let notFoundInMappingFile = 0;
  let notFoundInDb = 0;

  for (const stockSymbol of symbolsToUpdate) {
    // 1. 用 stockSymbol.symbol 在 CSV map 中找到 registration_no
    const registrationNo = symbolToRegNoMap.get(stockSymbol.symbol);
    if (!registrationNo) {
      notFoundInMappingFile++;
      continue; // 對於權證等非公司標的，找不到是正常的
    }

    // 2. 用 registration_no 在 DB map 中找到 company.id
    const companyId = regNoToCompanyIdMap.get(registrationNo);
    if (!companyId) {
      notFoundInDb++;
      console.warn(
        `\x1b[33m[警告]\x1b[0m 在 Company 資料表中找不到統一編號: ${registrationNo} (代號: ${stockSymbol.symbol})`
      );
      continue;
    }

    // 3. 找到對應，執行更新
    await prisma.stockSymbol.update({
      where: { id: stockSymbol.id },
      data: { company_id: companyId },
    });
    updatedCount++;
    process.stdout.write(`✅ 正在更新... ${updatedCount}/${symbolsToUpdate.length}\r`);
  }

  process.stdout.write('\n');
  console.log('\n--- 任務完成 ---');
  console.log(`🎉 成功更新 \x1b[32m${updatedCount}\x1b[0m 筆資料。`);
  console.log(
    `❓ 未找到對應的權證、ETF等商品共 \x1b[33m${notFoundInMappingFile}\x1b[0m 筆 (此為正常現象)。`
  );
  if (notFoundInDb > 0) {
    console.log(
      `❓ 在 Company 資料表中找不到 \x1b[33m${notFoundInDb}\x1b[0m 個對應的公司統一編號。`
    );
  }
}

main()
  .catch((e) => {
    console.error('❌ 執行過程中發生嚴重錯誤：', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

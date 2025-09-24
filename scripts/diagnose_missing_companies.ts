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

/**
 * 清理統一編號，只保留數字部分
 * @param regNo 原始統一編號字串
 * @returns 清理後的純數字字串
 */
function cleanRegistrationNo(regNo: string | null | undefined): string {
  if (!regNo) return '';
  return regNo.replace(/\D/g, '');
}

async function main() {
  console.log('🚀 開始診斷 CSV 對照表與 Company 資料庫的差異...');

  // --- 步驟 1: 讀取並載入所有 CSV 對照表資料 ---
  const folderPath = process.argv[2];
  if (!folderPath) {
    console.error('❌ 錯誤：請提供包含 CSV 檔案的資料夾路徑作為參數。');
    return;
  }
  const resolvedFolderPath = path.resolve(process.cwd(), folderPath);
  if (!fs.existsSync(resolvedFolderPath) || !fs.lstatSync(resolvedFolderPath).isDirectory()) {
    console.error(`❌ 錯誤：找不到資料夾: ${resolvedFolderPath}`);
    return;
  }

  const files = fs.readdirSync(resolvedFolderPath).filter((f) => f.toLowerCase().endsWith('.csv'));
  if (files.length === 0) {
    console.error(`❌ 錯誤：在資料夾 ${resolvedFolderPath} 中找不到任何 .csv 檔案。`);
    return;
  }

  const csvRegNos = new Map<string, { symbol: string; name: string }>();
  for (const file of files) {
    const csvPath = path.join(resolvedFolderPath, file);
    const fileBuffer = fs.readFileSync(csvPath);
    const decodedCsv = iconv.decode(fileBuffer, 'big5');
    const records: IMopsCsvRow[] = parse(decodedCsv, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    for (const record of records) {
      const regNo = cleanRegistrationNo(record['營利事業統一編號']);
      if (regNo) {
        csvRegNos.set(regNo, { symbol: record['公司代號'], name: record['公司名稱'] });
      }
    }
  }
  console.log(`🗺️  CSV 對照表分析完成：共找到 ${csvRegNos.size} 筆唯一的公司統一編號。`);

  // --- 步驟 2: 讀取資料庫中所有的公司統一編號 ---
  const allCompanies = await prisma.company.findMany({
    select: { registrationNo: true },
  });

  const dbRegNos = new Set<string>();
  for (const company of allCompanies) {
    dbRegNos.add(cleanRegistrationNo(company.registrationNo));
  }
  console.log(`🏢 資料庫分析完成：Company 表中共有 ${dbRegNos.size} 筆唯一的公司統一編號。`);

  // --- 步驟 3: 進行交叉比對，找出差異 ---
  const missingCompanies: { registrationNo: string; symbol: string; name: string }[] = [];

  csvRegNos.forEach((companyInfo, regNo) => {
    if (!dbRegNos.has(regNo)) {
      missingCompanies.push({
        registrationNo: regNo,
        symbol: companyInfo.symbol,
        name: companyInfo.name,
      });
    }
  });

  // --- 步驟 4: 產生診斷報告 ---
  console.log('\n--- 📋 診斷報告 ---');
  if (missingCompanies.length === 0) {
    console.log('✅ 恭喜！所有在 CSV 對照表中的上市櫃公司，都已存在於您的 Company 資料庫中。');
  } else {
    console.log(
      `⚠️ 發現有 \x1b[33m${missingCompanies.length}\x1b[0m 家上市櫃公司存在於 CSV 對照表中，但在您的 Company 資料庫裡找不到對應的統一編號。`
    );
    console.log('這很可能是 `backfill` 腳本匹配率不如預期的主要原因。');
    console.log('詳細列表如下：');
    console.table(missingCompanies);
    console.log('\n下一步建議：');
    console.log('1. 確認您的 `Company` 資料來源是否完整。');
    console.log('2. 將以上列表中的公司資料，補齊到您的 `Company` 資料庫中。');
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

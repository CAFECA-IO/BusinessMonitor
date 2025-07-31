import fs from "fs";
import path from "path";
import readline from "readline";
import { PrismaClient, Prisma } from "@prisma/client";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

// Info: (20250731-Tzuhan) ==== 寫入失敗紀錄 ====
function logFailedRecord(
  fileName: string,
  reason: string,
  data: unknown,
): void {
  const logDir = path.join(__dirname, "logs");
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  const failedLogPath = path.join(logDir, `failed_records_${fileName}.jsonl`);
  const record = { reason, data, timestamp: new Date().toISOString() };
  fs.appendFileSync(failedLogPath, JSON.stringify(record) + "\n", "utf8");
}

// Info: (20250731-Tzuhan) ==== 型別 ====
interface BusinessData {
  id: string | number;
  商業名稱: string | string[];
  負責人姓名?: string | string[];
  登記機關?: string;
  核准設立日期?: DateField | null;
  最近異動日期?: DateField | null;
  資本額元?: string | number;
  組織類型?: string;
  地址?: string;
  營業項目?: string;
  出資額元?: Record<string, string | number>;
  現況?: string;
}

interface CompanyData {
  id: string | number;
  公司名稱: string | string[];
  代表人姓名?: string | string[];
  公司所在地?: string;
  登記機關?: string;
  核准設立日期?: DateField | null;
  最後核准變更日期?: DateField | null;
  資本總額元?: string | number;
  實收資本額元?: string | number;
  所營事業資料?: unknown;
  公司狀況?: string;
  登記現況?: string;
}

interface BranchOfficeData {
  id: string | number;
  登記機關?: string;
  核准設立日期?: DateField | null;
  最後核准變更日期?: DateField | null;
  分公司所在地?: string;
  分公司狀況?: string;
  分公司名稱: string;
  分公司經理姓名?: string | string[];
  總本公司統一編號?: string | number;
  廢止日期?: DateField | null;
}

interface InstitutionData {
  id: string | number;
  名稱: string;
  類別: string;
  來源: string;
}

interface DateField {
  year: number;
  month: number;
  day: number;
}

// Info: (20250731-Tzuhan) ==== 工具函數 ====
function parseDate(obj: DateField | string | null | undefined): Date | null {
  if (!obj) return null;
  if (typeof obj === "string") return new Date(obj);
  if ("year" in obj && obj.year > 0)
    return new Date(obj.year, obj.month - 1, obj.day);
  return null;
}

function parseName(value: string | string[]): string {
  return Array.isArray(value) ? value.join(" / ") : value;
}

function parseNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const num = parseFloat(value.toString().replace(/,/g, ""));
  return isNaN(num) ? null : num;
}

function normalizeRegNo(
  value: string | number | null | undefined,
): string | null {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  if (isNaN(num)) return null;
  return num.toString().padStart(8, "0");
}

function parseRepresentative(
  value: string | string[] | undefined | null,
): string | null {
  if (!value) return null;
  if (Array.isArray(value)) {
    const filtered = value.map((v) => v.trim()).filter((v) => v !== "");
    return filtered.length > 0 ? filtered.join(" / ") : null;
  }
  return value.trim() || null;
}

function safeParseJSON(fileName: string, line: string) {
  try {
    return JSON.parse(line);
  } catch {
    const match = line.match(/^(\d{1,8}),(.*)$/);
    if (match) {
      const regNo = match[1].padStart(8, "0");
      try {
        const obj = JSON.parse(match[2]);
        return { ...obj, id: regNo };
      } catch (err2) {
        logFailedRecord(fileName, `解析失敗: ${(err2 as Error).message}`, line);
        return null;
      }
    }
    logFailedRecord(fileName, "解析失敗: 無法識別資料格式", line);
    return null;
  }
}

// Info: (20250731-Tzuhan) ==== 匯入單一檔案 ====
async function importFile(
  filePath: string,
): Promise<{ total: number; success: number }> {
  console.log(`📄 開始匯入 ${filePath}`);
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Infinity,
  });
  const fileName = path.basename(filePath);

  let count = 0;
  let successCount = 0;

  for await (const line of rl) {
    if (!line.trim()) continue;
    const jsonData = safeParseJSON(fileName, line) as
      | BusinessData
      | CompanyData
      | BranchOfficeData
      | InstitutionData
      | null;

    if (!jsonData) continue;

    try {
      const regNo = normalizeRegNo(jsonData.id);
      if (!regNo) {
        logFailedRecord(fileName, "缺少或無效的統一編號", jsonData);
        continue;
      }

      let record: Prisma.CompanyCreateInput | null = null;

      if ("商業名稱" in jsonData) {
        record = {
          name: parseName(jsonData.商業名稱),
          registrationNo: regNo,
          representative: parseRepresentative(jsonData.負責人姓名),
          registrationCountry: "Taiwan",
          establishedDate: parseDate(jsonData.核准設立日期),
          capitalAmount: parseNumber(jsonData.資本額元),
          address: jsonData.地址 || null,
          status: jsonData.現況 || null,
          organizationType: jsonData.組織類型 || null,
          registrationAgency: jsonData.登記機關 || null,
          ...(jsonData.營業項目 ? { contributions: jsonData.營業項目 } : {}),
          ...(jsonData.出資額元 ? { contributions: jsonData.出資額元 } : {}),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      } else if ("公司名稱" in jsonData) {
        record = {
          name: parseName(jsonData.公司名稱),
          registrationNo: regNo,
          representative: parseRepresentative(jsonData.代表人姓名),
          registrationCountry: "Taiwan",
          establishedDate: parseDate(jsonData.核准設立日期),
          capitalAmount: parseNumber(jsonData.資本總額元),
          paidInCapital: parseNumber(jsonData.實收資本額元),
          address: jsonData.公司所在地 || null,
          status: jsonData.公司狀況 || jsonData.登記現況 || null,
          registrationAgency: jsonData.登記機關 || null,
          ...(jsonData.所營事業資料
            ? { contributions: jsonData.所營事業資料 }
            : {}),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      } else if ("分公司名稱" in jsonData && "總(本)公司統一編號" in jsonData) {
        const parentRegNo = normalizeRegNo(jsonData["總本公司統一編號"]);
        if (!parentRegNo) {
          logFailedRecord(fileName, "分公司缺少有效母公司統編", jsonData);
          continue;
        }
        record = {
          name: jsonData.分公司名稱,
          registrationNo: regNo,
          parentRegNo,
          representative: parseRepresentative(jsonData.分公司經理姓名),
          registrationCountry: "Taiwan",
          establishedDate: parseDate(jsonData.核准設立日期),
          address: jsonData.分公司所在地 || null,
          status: jsonData.分公司狀況 || null,
          registrationAgency: jsonData.登記機關 || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      } else if (
        "名稱" in jsonData &&
        "類別" in jsonData &&
        "來源" in jsonData
      ) {
        record = {
          name: jsonData.名稱,
          registrationNo: regNo,
          registrationCountry: "Taiwan",
          organizationType: jsonData.類別,
          websiteUrl: jsonData.來源,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      } else {
        logFailedRecord(fileName, "無法識別資料格式", jsonData);
        continue;
      }

      await prisma.company.upsert({
        where: { registrationNo: regNo },
        update: record,
        create: record,
      });

      successCount++;
      count++;
      if (count % 1000 === 0) console.log(`  已處理 ${count} 筆...`);
    } catch (err) {
      logFailedRecord(fileName, `解析失敗: ${(err as Error).message}`, line);
    }
  }

  console.log(`✅ 完成匯入 ${count} 筆 (成功 ${successCount} 筆)`);
  return { total: count, success: successCount };
}

// Info: (20250731-Tzuhan) ==== 匯入資料夾 ====
async function importFolder(folderPath: string, resume = false) {
  const files = fs.readdirSync(folderPath);

  for (const file of files) {
    const log = await prisma.importLog.findUnique({
      where: { folder_file_unique: { folderPath, fileName: file } },
    });

    if (resume && log?.status === "completed") {
      console.log(`⏩ 跳過已完成檔案 ${file}`);
      continue;
    }

    await prisma.importLog.upsert({
      where: { folder_file_unique: { folderPath, fileName: file } },
      update: { status: "in_progress", startedAt: new Date() },
      create: {
        folderPath,
        fileName: file,
        totalCount: 0,
        successCount: 0,
        status: "in_progress",
        startedAt: new Date(),
      },
    });

    const { total, success } = await importFile(path.join(folderPath, file));

    await prisma.importLog.update({
      where: { folder_file_unique: { folderPath, fileName: file } },
      data: {
        totalCount: total,
        successCount: success,
        status: "completed",
        finishedAt: new Date(),
      },
    });
  }
}

// Info: (20250731-Tzuhan) ==== 主程式 ====
(async () => {
  const targetFolder = process.argv[2];
  const resume = process.argv.includes("--resume");
  if (!targetFolder) {
    console.error("❌ 請指定資料夾路徑，例如: npm run import ./data");
    process.exit(1);
  }
  await importFolder(targetFolder, resume);
  await prisma.$disconnect();
})();

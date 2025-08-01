import fs from "fs";
import path from "path";
import readline from "readline";
import { PrismaClient, Prisma } from "@prisma/client";
import { fileURLToPath } from "url";
import { Decimal } from "@prisma/client/runtime/library";

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
// Info: (20250801-Tzuhan) 年月日物件型別
interface DateField {
  year: number;
  month: number;
  day: number;
}

interface DirectorItem {
  序號: string;
  職稱: string;
  姓名: string;
  所代表法人: [number, string];
  出資額: string;
}

interface ManagerItem {
  序號: string;
  姓名: string;
  到職日期: DateField;
}

// Info: (20250801-Tzuhan) 商業登記資料型別
interface BusinessData {
  id: string | number; // Info: (20250801-Tzuhan) registrationNo
  商業名稱: string | string[]; // Info: (20250801-Tzuhan) name
  負責人姓名?: string | string[]; // Info: (20250801-Tzuhan) representative
  登記機關?: string; // Info: (20250801-Tzuhan) registrationAgency
  核准設立日期?: DateField | null; // Info: (20250801-Tzuhan) establishedDate
  最近異動日期?: DateField | null; // Info: (20250801-Tzuhan) lastChangeDate
  "資本額(元)"?: string | number; // Info: (20250801-Tzuhan) capitalAmount
  組織類型?: string; // Info: (20250801-Tzuhan) organizationType
  地址?: string; // Info: (20250801-Tzuhan) address
  營業項目?: string; // Info: (20250801-Tzuhan) businessItems
  "出資額(元)"?: Record<string, string | number>; // Info: (20250801-Tzuhan) contributions
  現況?: string; // Info: (20250801-Tzuhan) status
  登記現況?: string; // Info: (20250801-Tzuhan) status
  url?: string; // Info: (20250801-Tzuhan) websiteUrl
}

// Info: (20250801-Tzuhan) 公司登記資料型別（含章程、董監事等欄位）
interface CompanyData {
  id: string | number;
  公司名稱: string | string[];
  代表人姓名?: string | string[];
  公司所在地?: string; // Info: (20250801-Tzuhan) address
  登記機關?: string; // Info: (20250801-Tzuhan) registrationAgency
  核准設立日期?: DateField | null; // Info: (20250801-Tzuhan) establishedDate
  最近異動日期?: DateField | null; // Info: (20250801-Tzuhan) lastChangeDate
  最後核准變更日期?: DateField | null; // Info: (20250801-Tzuhan) lastApprovedChange
  公司狀況日期?: DateField | null; // Info: (20250801-Tzuhan) statusDate
  公司狀況文號?: string; // Info: (20250801-Tzuhan) statusDocNo
  "資本總額(元)"?: string | number; // Info: (20250801-Tzuhan) capitalAmount
  "實收資本額(元)"?: string | number; // Info: (20250801-Tzuhan) paidInCapital
  所營事業資料?: [string, string][]; // Info: (20250801-Tzuhan) businessItems
  公司狀況?: string; // Info: (20250801-Tzuhan) status
  登記現況?: string; // Info: (20250801-Tzuhan) status
  章程所訂外文公司名稱?: string; // Info: (20250801-Tzuhan) foreignCompanyName
  董監事名單?: DirectorItem[]; // Info: (20250801-Tzuhan) directors (Json)
  經理人名單?: ManagerItem[]; // Info: (20250801-Tzuhan) managers (Json)
  股權狀況?: string; // Info: (20250801-Tzuhan) shareholdingStatus
  "停業日期(起)"?: DateField | null; // Info: (20250801-Tzuhan) suspensionStartDate
  "停業日期(迄)"?: DateField | null; // Info: (20250801-Tzuhan) suspensionEndDate
  舊營業項目資料?: string; // Info: (20250801-Tzuhan) oldBusinessItemsUrl
  "停業核准(備)機關"?: string; // Info: (20250801-Tzuhan) suspensionAgency
  logoUrl?: string;
  複數表決權特別股?: string; // Info: (20250801-Tzuhan) multipleVotingRights
  對於特定事項具否決權特別股?: string; // Info: (20250801-Tzuhan) specialVotingRights
  "每股金額(元)"?: number; // Info: (20250801-Tzuhan) sharePrice
  "已發行股份總數(股)"?: number; // Info: (20250801-Tzuhan) totalIssuedShares
}

// Info: (20250801-Tzuhan) 分公司登記資料型別
interface BranchOfficeData {
  id: string | number; // Info: (20250801-Tzuhan) → registration_no
  分公司名稱: string; // Info: (20250801-Tzuhan) → name
  分公司經理姓名?: string | string[]; // Info: (20250801-Tzuhan) → representative
  登記機關?: string; // Info: (20250801-Tzuhan) → registration_agency
  核准設立日期?: DateField | null; // Info: (20250801-Tzuhan) → established_date
  最後核准變更日期?: DateField | null; // Info: (20250801-Tzuhan) → last_approved_change
  分公司所在地?: string; // Info: (20250801-Tzuhan) → address
  分公司狀況?: string; // Info: (20250801-Tzuhan) → status
  "總(本)公司統一編號"?: string | number; // Info: (20250801-Tzuhan) → parent_reg_no
  廢止日期?: DateField | null; // Info: (20250801-Tzuhan) → suspension_end_date（或另字段）
}

// Info: (20250801-Tzuhan) 其它機構／學校等資料型別
interface InstitutionData {
  id: string | number; // Info: (20250801-Tzuhan) → registration_no
  名稱: string; // Info: (20250801-Tzuhan) → name
  類別: string; // Info: (20250801-Tzuhan) → organization_type
  來源: string; // Info: (20250801-Tzuhan) → website_url
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

function parseDecimal(
  value: string | number | null | undefined,
): Prisma.Decimal | null {
  if (value === null || value === undefined) return null;
  const num = parseFloat(value.toString().replace(/,/g, ""));
  return isNaN(num) ? null : new Decimal(num);
}

function parseBigInt(value?: string | number | null): bigint | null {
  if (value == null) return null;
  const s = value.toString().replace(/,/g, "");
  return /^\d+$/.test(s) ? BigInt(s) : null;
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
        logFailedRecord(
          fileName,
          `❌ 解析失敗: ${(err2 as Error).message}`,
          line,
        );
        return null;
      }
    }
    logFailedRecord(fileName, "❌ 解析失敗: 無法識別資料格式", line);
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
      let parentRegNo: string | null = null;
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
          lastChangeDate: parseDate(jsonData.最近異動日期),
          capitalAmount: parseDecimal(jsonData["資本額(元)"]),
          address: jsonData.地址 || null,
          status: jsonData.現況 || jsonData.登記現況 || null,
          organizationType: jsonData.組織類型 || null,
          registrationAgency: jsonData.登記機關 || null,
          ...(jsonData.營業項目 ? { businessItems: jsonData.營業項目 } : {}),
          ...(jsonData["出資額(元)"]
            ? { contributions: jsonData["出資額(元)"] }
            : {}),
          websiteUrl: jsonData.url || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      } else if ("公司名稱" in jsonData) {
        record = {
          name: parseName(jsonData.公司名稱),
          registrationNo: regNo,
          representative: parseRepresentative(jsonData.代表人姓名),
          registrationCountry: "Taiwan",
          address: jsonData.公司所在地 || null,
          registrationAgency: jsonData.登記機關 || null,
          establishedDate: parseDate(jsonData.核准設立日期),
          lastChangeDate: parseDate(jsonData.最近異動日期),
          lastApprovedChange: parseDate(jsonData.最後核准變更日期),
          statusDate: parseDate(jsonData.公司狀況日期),
          statusDocNo: jsonData.公司狀況文號 || null,
          capitalAmount: parseDecimal(jsonData["資本總額(元)"]),
          paidInCapital: parseDecimal(jsonData["實收資本額(元)"]),
          ...(jsonData.所營事業資料
            ? { businessItems: jsonData.所營事業資料 }
            : {}),
          status: jsonData.公司狀況 || jsonData.登記現況 || null,
          foreignCompanyName: jsonData.章程所訂外文公司名稱 || null,
          ...(jsonData.董監事名單
            ? { directors: JSON.stringify(jsonData.董監事名單) }
            : {}),
          ...(jsonData.經理人名單
            ? { managers: JSON.stringify(jsonData.經理人名單) }
            : {}),
          suspensionStartDate: parseDate(jsonData["停業日期(起)"]),
          suspensionEndDate: parseDate(jsonData["停業日期(迄)"]),
          oldBusinessItemsUrl: jsonData.舊營業項目資料 || null,
          suspensionAgency: jsonData["停業核准(備)機關"] || null,
          logoUrl: jsonData.logoUrl || null,
          multipleVotingRights: jsonData.複數表決權特別股,
          specialVotingRights: jsonData.對於特定事項具否決權特別股,
          sharePrice: parseDecimal(jsonData["每股金額(元)"]),
          totalIssuedShares: parseBigInt(jsonData["已發行股份總數(股)"]),
          shareholdingStatus: jsonData.股權狀況 || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      } else if ("分公司名稱" in jsonData && "總(本)公司統一編號" in jsonData) {
        parentRegNo = normalizeRegNo(jsonData["總(本)公司統一編號"]);
        if (!parentRegNo) {
          const reason = "⚠️  分公司缺少有效母公司統一編號";
          logFailedRecord(fileName, reason, jsonData);
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
        logFailedRecord(fileName, "❌ 無法識別資料格式", jsonData);
        continue;
      }

      await prisma.company.upsert({
        where: { registrationNo: regNo },
        update: record,
        create: record,
      });
      if (parentRegNo) {
        await prisma.company.upsert({
          where: { registrationNo: parentRegNo },
          update: {},
          create: {
            name: "暫存母公司",
            registrationNo: parentRegNo,
            registrationCountry: "Taiwan",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        await prisma.companyRelation.upsert({
          where: {
            parentRegNo_childRegNo: { parentRegNo, childRegNo: regNo },
          },
          update: { relation: "branch" },
          create: { parentRegNo, childRegNo: regNo, relation: "branch" },
        });
      }

      successCount++;
      count++;
      if (count % 1000 === 0) console.log(`  已處理 ${count} 筆...`);
    } catch (err) {
      logFailedRecord(fileName, `❌ 解析失敗: ${(err as Error).message}`, line);
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

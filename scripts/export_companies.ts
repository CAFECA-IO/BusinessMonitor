import fs from 'fs';
import path from 'path';
import { PrismaClient, Company } from '@prisma/client';
import { Parser } from 'json2csv';
import { createGzip } from 'zlib';
import { pipeline } from 'stream/promises';

const prisma = new PrismaClient();

// Info: (20250804 - Tzuhan) 1. CSV 欄位定義（同前）
const fields = [
  { label: 'ID', value: 'id' },
  { label: '公司名稱', value: 'name' },
  { label: '統一編號', value: 'registrationNo' },
  { label: '母公司統編', value: 'parentRegNo' },
  { label: '代表人', value: 'representative' },
  { label: '註冊國家', value: 'registrationCountry' },
  {
    label: '成立日期',
    value: (r: Company) => r.establishedDate?.toISOString().split('T')[0] ?? '',
  },
  {
    label: '資本總額',
    value: (r: Company) => r.capitalAmount?.toString() ?? '',
  },
  {
    label: '實收資本額',
    value: (r: Company) => r.paidInCapital?.toString() ?? '',
  },
  {
    label: '資本排名',
    value: (r: Company) => r.capitalRanking?.toString() ?? '',
  },
  { label: '地址', value: 'address' },
  { label: '網站 URL', value: 'websiteUrl' },
  { label: 'Logo URL', value: 'logoUrl' },
  { label: '登記機關', value: 'registrationAgency' },
  { label: '狀態', value: 'status' },
  { label: '組織類型', value: 'organizationType' },
  {
    label: '營業項目 (JSON)',
    value: (r: Company) => JSON.stringify(r.businessItems),
  },
  {
    label: '出資資訊 (JSON)',
    value: (r: Company) => JSON.stringify(r.contributions),
  },
  { label: '股權狀態', value: 'shareholdingStatus' },
  {
    label: '每股金額',
    value: (r: Company) => r.sharePrice?.toString() ?? '',
  },
  {
    label: '已發行股份總數',
    value: (r: Company) => r.totalIssuedShares?.toString() ?? '',
  },
  { label: '多重投票權', value: 'multipleVotingRights' },
  { label: '特殊投票權', value: 'specialVotingRights' },
  {
    label: '最後異動日期',
    value: (r: Company) => r.lastChangeDate?.toISOString().split('T')[0] ?? '',
  },
  {
    label: '最後核准變更日期',
    value: (r: Company) => r.lastApprovedChange?.toISOString().split('T')[0] ?? '',
  },
  {
    label: '狀態生效日期',
    value: (r: Company) => r.statusDate?.toISOString().split('T')[0] ?? '',
  },
  { label: '狀態文件編號', value: 'statusDocNo' },
  { label: '外文公司名稱', value: 'foreignCompanyName' },
  {
    label: '董事 (JSON)',
    value: (r: Company) => JSON.stringify(r.directors),
  },
  {
    label: '經理人 (JSON)',
    value: (r: Company) => JSON.stringify(r.managers),
  },
  {
    label: '停業開始日期',
    value: (r: Company) => r.suspensionStartDate?.toISOString().split('T')[0] ?? '',
  },
  {
    label: '停業結束日期',
    value: (r: Company) => r.suspensionEndDate?.toISOString().split('T')[0] ?? '',
  },
  { label: '停業機關', value: 'suspensionAgency' },
  { label: '舊營業項目連結', value: 'oldBusinessItemsUrl' },
  {
    label: '建立時間',
    value: (r: Company) => r.createdAt.toISOString(),
  },
  {
    label: '更新時間',
    value: (r: Company) => r.updatedAt.toISOString(),
  },
];

const CHUNK_SIZE = parseInt(process.env.CHUNK_SIZE || '200000', 10);

async function exportWithChunksAndGzip() {
  const total = await prisma.company.count();
  const exportDir = path.join(process.cwd(), 'exports');
  if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });

  console.log(`🔢 總 ${total} 筆，分批每 ${CHUNK_SIZE} 筆並壓縮`);

  let fileIndex = 1;
  for (let offset = 0; offset < total; offset += CHUNK_SIZE) {
    // Info: (20250804 - Tzuhan) 1. 讀 batch
    const batch = await prisma.company.findMany({
      skip: offset,
      take: CHUNK_SIZE,
      orderBy: { id: 'asc' },
    });

    // Info: (20250804 - Tzuhan) 2. 轉 CSV
    const parser = new Parser<Company>({
      fields,
      withBOM: fileIndex === 1,
    });
    const csv = parser.parse(batch);

    // Info: (20250804 - Tzuhan) 3. 建 Gzip 串流 寫入檔案
    const gzip = createGzip();
    const filename = `company_chunk_${fileIndex}.csv.gz`;
    const filepath = path.join(exportDir, filename);
    const outStream = fs.createWriteStream(filepath);

    // Info: (20250804 - Tzuhan) pipeline: 把 csv 字串餵給 gzip，再寫檔
    await pipeline(
      // Info: (20250804 - Tzuhan) 將字串轉 Buffer
      (async function* () {
        yield Buffer.from(csv, 'utf8');
      })(),
      gzip,
      outStream
    );

    console.log(`✅ 匯出 chunk #${fileIndex}：${batch.length} 筆 → ${filename}`);
    fileIndex++;
  }

  await prisma.$disconnect();
  console.log('🔚 全部匯出完成');
}

exportWithChunksAndGzip().catch((e) => {
  console.error('❌ 匯出失敗：', e);
  process.exit(1);
});

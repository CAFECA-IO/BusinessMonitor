import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { format } from 'date-fns';

const prisma = new PrismaClient();

async function getLatestDate() {
  try {
    const latestEntry = await prisma.marketDailyPrice.findFirst({
      orderBy: {
        date: 'desc',
      },
      select: {
        date: true,
      },
    });

    if (latestEntry) {
      // Info: (20251015 - Tzuhan) 將日期以 YYYYMMDD 格式輸出到終端機
      process.stdout.write(format(latestEntry.date, 'yyyyMMdd'));
    }
    // Info: (20251015 - Tzuhan) 如果資料庫是空的，則不輸出任何東西
  } catch (error) {
    // Info: (20251015 - Tzuhan) 將錯誤訊息輸出到 stderr，這樣就不會被主腳本誤認為是日期
    console.error('❌ 查詢資料庫最新日期時發生錯誤:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

getLatestDate();

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    // Deprecated: (20250807 - Luphia) remove eslint-disable
    // eslint-disable-next-line no-console
    console.log('✅ 資料庫連線成功');
  } catch (err) {
    // Deprecated: (20250807 - Luphia) remove eslint-disable
    // eslint-disable-next-line no-console
    console.error('❌ 資料庫連線失敗');
    // Deprecated: (20250807 - Luphia) remove eslint-disable
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

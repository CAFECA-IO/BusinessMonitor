 
import { PrismaClient, Prisma, Board } from '@prisma/client';

const prisma = new PrismaClient();

type Row = { symbol: string; name: string | null };

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function classifyBoard(symbol: string): Board {
  return /^\d{4}$/.test(symbol.trim()) ? 'LISTED' : 'OTC';
}

async function main() {
  // 用 SQL 抓 distinct（拿一個代表名稱）
  const rows: Row[] = await prisma.$queryRaw<Row[]>`
    select symbol, max(name) as name
    from market_daily_price
    group by symbol
  `;

  if (rows.length === 0) {
    console.log('market_daily_price 無資料可回填。');
    return;
  }

  const toInsert: Prisma.StockSymbolCreateManyInput[] = [];
  for (const r of rows) {
    const symbol = r.symbol.trim();
    if (!symbol) continue; // 仍然保留對空字串的檢查
    toInsert.push({
      symbol,
      name: r.name ?? undefined,
      board: classifyBoard(symbol) as Board,
      updated_at: new Date(),
    });
  }

  if (toInsert.length === 0) {
    console.log('沒有新的 symbol 需要建立。');
    return;
  }

  // 分批寫入（預設 2000 可調）
  const batch = Number(process.env.IMPORT_BATCH ?? '2000');
  let created = 0;
  for (const part of chunk(toInsert, batch)) {
    const res = await prisma.stockSymbol.createMany({ data: part, skipDuplicates: true });
    created += res.count;
  }

  console.log(`完成：新增 ${created} 筆 stock_symbol。`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

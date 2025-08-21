import { Prisma, News } from '@prisma/client';
import type { Db } from '@/repositories/company.shared.repo';

export type NewsWhere = Prisma.NewsWhereInput;

export async function countCompanyNews(Db: Db, where: NewsWhere): Promise<number> {
  return Db.news.count({ where });
}

export async function findCompanyNews(
  Db: Db,
  where: NewsWhere,
  orderBy: Prisma.NewsOrderByWithRelationInput[],
  skip: number,
  take: number
): Promise<News[]> {
  return Db.news.findMany({
    where,
    orderBy,
    skip,
    take,
  });
}

import { countCompanyNews, findCompanyNews, NewsWhere } from '@/repositories/news.repo';
import { CompanyNewsPayload } from '@/validators/news';
import { prisma } from '@/lib/prisma';

export async function listCompanyNews(
  companyId: number,
  q: string | undefined,
  from: Date | undefined,
  to: Date | undefined,
  page: number,
  pageSize: number,
  sort: 'newest' | 'relevance',
  lang?: string,
  source?: string[]
): Promise<CompanyNewsPayload> {
  const where: NewsWhere = {
    companyId,
    AND: [],
  };

  if (from || to) {
    const gte = from ? from : undefined;
    const lte = to ? to : undefined;
    (where.AND as NewsWhere[]).push({ date: { gte, lte } });
    if (from && to && from.getTime() > to.getTime()) {
      throw new Error('from must be <= to');
    }
  }

  if (q) {
    (where.AND as NewsWhere[]).push({
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } },
      ],
    });
  }

  if (lang) (where.AND as NewsWhere[]).push({ lang });
  if (source && source.length > 0) (where.AND as NewsWhere[]).push({ source: { in: source } });

  // Info: (20250821 - Tzuhan) 排序：預設 newest。relevance（有 q 時）採用簡單 relevance → 再以日期降序作為第二排序
  const orderBy =
    sort === 'newest' || !q ? [{ date: 'desc' as const }] : [{ date: 'desc' as const }]; // Info: (20250821 - Tzuhan) 簡化：DB 不做複雜 relevance 排序，保持 predictability

  const skip = (page - 1) * pageSize;
  const [total, rows] = await Promise.all([
    countCompanyNews(prisma, where),
    findCompanyNews(prisma, where, orderBy, skip, pageSize),
  ]);

  // Info: (20250821 - Tzuhan) relevance 的簡易排序（有 q 時）— 以包含次數粗排，再回寫分頁內的次序；資料量大時可改用全文索引
  let items = rows;
  if (q) {
    const score = (s: string | null | undefined) =>
      (s?.toLowerCase().match(new RegExp(q.toLowerCase(), 'g')) || []).length;
    items = [...rows].sort(
      (a, b) =>
        score(b.title) + score(b.content) - (score(a.title) + score(a.content)) ||
        b.date.getTime() - a.date.getTime()
    );
  }

  return {
    items: items.map((n) => ({
      id: n.id,
      title: n.title,
      content: n.content ?? undefined,
      date: n.date.toISOString(),
      imageUrl: n.imageUrl ?? undefined,
      lang: n.lang ?? undefined,
      source: n.source ?? undefined,
      url: n.url ?? undefined,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    hasPrev: page > 1,
    hasNext: page * pageSize < total,
  };
}

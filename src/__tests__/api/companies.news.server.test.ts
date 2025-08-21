import { getAgent } from '@/__tests__/helpers/agent';
import { Routes } from '@/config/api-routes';
import { prisma } from '@/lib/prisma';

const agent = getAgent();

describe('GET /api/v1/companies/:id/news', () => {
  let companyId: number;

  beforeAll(async () => {
    const company = await prisma.company.create({
      data: { name: 'Acme Inc.', registrationNo: 'ACME-001' },
    });
    companyId = company.id;

    // 造 15 筆新聞：不同日期、不同來源
    const sources = ['Bloomberg', 'Reuters', 'FT'];
    const langs = ['en', 'zh'];
    const now = new Date();

    await prisma.news.createMany({
      data: Array.from({ length: 15 }).map((_, i) => ({
        companyId,
        title: `News #${i + 1}`,
        content: i % 2 === 0 ? 'lorem ipsum acme' : 'dolor sit amet',
        date: new Date(now.getTime() - i * 24 * 60 * 60 * 1000),
        source: sources[i % sources.length],
        lang: langs[i % langs.length],
        url: `https://example.com/news/${i + 1}`,
      })),
    });
  });

  afterAll(async () => {
    await prisma.companyView.deleteMany({ where: { companyId } });
    await prisma.news.deleteMany({ where: { companyId } });
    await prisma.company.delete({ where: { id: companyId } });
  });

  it('200：預設 pageSize=10、sort=newest', async () => {
    const url = Routes.companies.news({ id: companyId });
    const res = await agent.get(url).expect(200);

    expect(res.body.success).toBe(true);
    const payload = res.body.payload as {
      items: Array<{ id: number; title: string; date: string }>;
      total: number;
      page: number;
      pageSize: number;
    };
    expect(payload.page).toBe(1);
    expect(payload.pageSize).toBe(10);
    expect(payload.items.length).toBe(10);
    // newest：第一筆日期應 >= 第二筆
    expect(new Date(payload.items[0].date).getTime()).toBeGreaterThanOrEqual(
      new Date(payload.items[1].date).getTime()
    );
  });

  it('400：時間/分頁錯誤（page=0）', async () => {
    await agent.get(Routes.companies.newsQ({ id: companyId }, { page: 0 })).expect(400);
  });

  it('400：時間格式錯誤', async () => {
    await agent.get(Routes.companies.newsQ({ id: companyId }, { from: '2025-13-01' })).expect(400);
  });

  it('200：支援多值 source', async () => {
    const res = await agent
      .get(
        Routes.companies.newsQ(
          { id: companyId },
          { source: ['Bloomberg', 'Reuters'], pageSize: 50 }
        )
      )
      .expect(200);

    const payload = res.body.payload as { items: Array<{ source?: string }> };
    const sources = new Set(payload.items.map((i) => i.source));
    expect(sources.has('Bloomberg')).toBe(true);
    expect(sources.has('Reuters')).toBe(true);
  });
});

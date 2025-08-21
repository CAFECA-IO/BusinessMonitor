import { getAgent } from '@/__tests__/helpers/agent';
import { Routes } from '@/config/api-routes';
import { prisma } from '@/lib/prisma';

const agent = getAgent();

describe('自動記錄公司瀏覽（withCompanyView on GET routes）', () => {
  let companyId: number;

  const countViews = async () => {
    const rows = await prisma.$queryRaw<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM company_view WHERE company_id = ${companyId}
    `;
    return rows[0].n;
  };

  beforeAll(async () => {
    const c = await prisma.company.create({
      data: { name: 'Acme AutoView', registrationNo: 'ACME-V-1' },
    });
    companyId = c.id;

    await prisma.companyView.deleteMany({ where: { company_id: companyId } });
  });

  afterAll(async () => {
    await prisma.companyView.deleteMany({ where: { company_id: companyId } });
    await prisma.company.delete({ where: { id: companyId } });
  });

  it('第一次 GET /basic 會插入 1 筆', async () => {
    await agent
      .get(Routes.companies.basic({ id: companyId }))
      .set('x-forwarded-for', '203.0.113.1')
      .set('user-agent', 'Mozilla/5.0')
      .expect(200);

    expect(await countViews()).toBe(1);
  });

  it('同日同 IP 再打 /news 不會重複插入', async () => {
    await agent
      .get(Routes.companies.news({ id: companyId }))
      .set('x-forwarded-for', '203.0.113.1')
      .set('user-agent', 'Mozilla/5.0')
      .expect(200);

    expect(await countViews()).toBe(1);
  });

  it('不同 IP 再打 /news 會再插入 1 筆', async () => {
    await agent
      .get(Routes.companies.news({ id: companyId }))
      .set('x-forwarded-for', '198.51.100.7')
      .set('user-agent', 'Mozilla/5.0')
      .expect(200);

    expect(await countViews()).toBe(2);
  });

  it('常見 Bot UA 不計入', async () => {
    await agent
      .get(Routes.companies.basic({ id: companyId }))
      .set('x-forwarded-for', '203.0.113.9')
      .set('user-agent', 'Googlebot/2.1')
      .expect(200);

    expect(await countViews()).toBe(2);
  });
});

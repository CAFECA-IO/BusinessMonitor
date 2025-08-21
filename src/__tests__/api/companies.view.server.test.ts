import { getAgent } from '@/__tests__/helpers/agent';
import { Routes } from '@/config/api-routes';
import { prisma } from '@/lib/prisma';

const agent = getAgent();

describe.skip('POST /api/v1/companies/:id/view (integration, black-box)', () => {
  let companyId: number;
  let path: string;

  beforeAll(async () => {
    const c = await prisma.company.create({
      data: { name: 'Acme AutoView', registrationNo: 'ACME-V-1' },
    });
    companyId = c.id;
    path = Routes.companies.view({ id: companyId });

    await prisma.companyView.deleteMany({ where: { companyId } });
  });

  afterAll(async () => {
    await prisma.companyView.deleteMany({ where: { companyId } });
    await prisma.company.delete({ where: { id: companyId } });
  });

  it('201：第一次計數', async () => {
    const res = await agent
      .post(path)
      // Info: (20250819 - Tzuhan) 固定 IP/UA，確保 idempotency 可被檢驗
      .set('x-forwarded-for', '9.9.9.9')
      .set('user-agent', 'bm-tests/1.0')
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.code).toBe('OK');
    expect(res.body.payload).toEqual({ created: true });
  });

  it('200：相同 IP+UA 當天重送為 idempotent（不重覆計數）', async () => {
    const res = await agent
      .post(path)
      .set('x-forwarded-for', '9.9.9.9') // Info: (20250819 - Tzuhan) 與前一個 case 相同
      .set('user-agent', 'bm-tests/1.0') // Info: (20250819 - Tzuhan) 與前一個 case 相同
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.code).toBe('OK');
    expect(res.body.payload).toEqual({ created: false });
  });
});

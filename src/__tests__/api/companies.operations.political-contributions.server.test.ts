import { getAgent } from '@/__tests__/helpers/agent';
import { Routes } from '@/config/api-routes';
import { ApiCode } from '@/lib/status';

const agent = getAgent();
const companyId = Number(process.env.IT_SAMPLE_COMPANY_ID ?? '1');

describe('GET /api/v1/companies/:id/operations/political-contributions (integration, black-box)', () => {
  it('200：預設分頁；金額為字串；可回空集合', async () => {
    const url = Routes.companies.operations.politicalContributionsQ({ id: companyId });
    const res = await agent.get(url).expect(200);
    expect(res.body.success).toBe(true);
    const payload = res.body.payload as {
      items: Array<{ event: string; amount: string; date: string; recipient?: string }>;
      page: number;
      pageSize: number;
      total: number;
      pages: number;
    };
    expect(Array.isArray(payload.items)).toBe(true);
    if (payload.items.length > 0) {
      const it = payload.items[0];
      expect(typeof it.event).toBe('string');
      expect(typeof it.amount).toBe('string');
      expect(/^\d{4}-\d{2}-\d{2}$/.test(it.date)).toBe(true);
    }
  });

  it('400：pageSize 非法 (=0)', async () => {
    const url = Routes.companies.operations.politicalContributionsQ(
      { id: companyId },
      { pageSize: 0 }
    );
    const res = await agent.get(url).expect(400);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe(ApiCode.VALIDATION_ERROR);
  });
});

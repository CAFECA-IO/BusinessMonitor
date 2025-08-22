import { getAgent } from '@/__tests__/helpers/agent';
import { Routes } from '@/config/api-routes';

const agent = getAgent();
const companyId = Number(process.env.IT_SAMPLE_COMPANY_ID ?? '1');

describe('GET /api/v1/companies/:id/operations/tenders', () => {
  it('200：預設分頁（awardDate 為 YYYY-MM-DD）', async () => {
    const url = Routes.companies.operations.tenders({ id: companyId });
    const res = await agent.get(url).expect(200);
    expect(res.body.success).toBe(true);
    const payload = res.body.payload as { items: Array<{ awardDate: string }> };
    if (payload.items.length > 0) {
      expect(/^\d{4}-\d{2}-\d{2}$/.test(payload.items[0].awardDate)).toBe(true);
    }
  });

  it('422：pageSize 非法 (=0)', async () => {
    const url = Routes.companies.operations.tendersQ({ id: companyId }, { pageSize: 0 });
    const res = await agent.get(url).expect(422);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });
});

import { getAgent } from '@/__tests__/helpers/agent';
import { Routes } from '@/config/api-routes';

const agent = getAgent();
const companyId = Number(process.env.IT_SAMPLE_COMPANY_ID ?? '1');

describe('GET /api/v1/companies/:id/operations/trademarks', () => {
  it('200：預設分頁（imageUrl 可為 null）', async () => {
    const url = Routes.companies.operations.trademarks({ id: companyId });
    const res = await agent.get(url).expect(200);
    expect(res.body.success).toBe(true);
    const payload = res.body.payload as { items: Array<{ imageUrl: string | null }> };
    if (payload.items.length > 0) {
      expect([null, 'string']).toContain(
        typeof payload.items[0].imageUrl === 'string' ? 'string' : null
      );
    }
  });

  it('422：pageSize 非法 (=0)', async () => {
    const url = Routes.companies.operations.trademarksQ({ id: companyId }, { pageSize: 0 });
    const res = await agent.get(url).expect(422);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });
});

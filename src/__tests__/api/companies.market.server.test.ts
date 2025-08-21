import { getAgent } from '@/__tests__/helpers/agent';
import { Routes } from '@/config/api-routes';

const agent = getAgent();
const companyId = Number(process.env.IT_SAMPLE_COMPANY_ID ?? '1');

describe('GET /api/v1/companies/:id/market (integration, black-box)', () => {
  it.skip('200：預設 range（3m）', async () => {
    const url = Routes.companies.market({ id: companyId });
    const res = await agent.get(url).expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.code).toBe('OK');
    const m = res.body.payload as { sparkline: Array<unknown> };
    expect(Array.isArray(m.sparkline)).toBe(true);
  });

  it.skip('200：range=1y', async () => {
    const url = Routes.companies.marketQ({ id: companyId }, { range: '1y' });
    const res = await agent.get(url).expect(200);
    expect(res.body.success).toBe(true);
  });

  it.skip('422：非法 range', async () => {
    const url = Routes.companies.marketQ({ id: companyId }, { range: 'xxx' as unknown as '3m' });
    const res = await agent.get(url).expect(422);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });
});

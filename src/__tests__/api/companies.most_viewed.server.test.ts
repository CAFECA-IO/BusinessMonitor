import { getAgent } from '@/__tests__/helpers/agent';
import { Routes } from '@/config/api-routes';

const agent = getAgent();

describe('GET /api/v1/companies/most-viewed (integration, black-box)', () => {
  it('200：正常（預設 limit=10）', async () => {
    const url = Routes.companies.mostViewed();
    const res = await agent.get(url).expect(200);
    expect(res.body.success).toBe(true);
    const items = res.body.payload as Array<unknown>;
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeLessThanOrEqual(10);
  });

  it('400：limit 非法（=0）', async () => {
    const url = Routes.companies.mostViewed({ limit: 0 });
    const res = await agent.get(url).expect(400);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.payload).toBeNull();
  });
});

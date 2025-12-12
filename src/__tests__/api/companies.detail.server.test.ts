import { getAgent } from '@/__tests__/helpers/agent';
import { routes } from '@/config/api_routes';

const agent = getAgent();

const companyId = 1;
const nonExistentCompanyId = 999999999;

describe('Company Detail APIs (integration, black-box)', () => {
  it('GET /companies/:id/basic → 200 基本資訊', async () => {
    const url = routes.companies.basic({ id: companyId });
    const res = await agent.get(url).expect(200);

    expect(res.body.success).toBe(true);
    const payload = res.body.payload as {
      card: Record<string, unknown>;
      investors: unknown[];
      businessScopes: unknown[];
      history: unknown[];
      related: unknown[];
    };

    expect(payload.card).toMatchObject({
      id: companyId,
      name: expect.any(String),
      registrationNo: expect.any(String),
      lastUpdateTime: expect.any(String),
      flags: { green: expect.any(Number), red: expect.any(Number) },
    });
    expect(Array.isArray(payload.investors)).toBe(true);
    expect(Array.isArray(payload.businessScopes)).toBe(true);
    expect(Array.isArray(payload.history)).toBe(true);
    expect(Array.isArray(payload.related)).toBe(true);
  });

  it('GET /companies/:id/basic → 404 不存在的 id', async () => {
    const url = routes.companies.basic({ id: nonExistentCompanyId });
    const res = await agent.get(url).expect(404);
    expect(res.body.success).toBe(false);
  });
});

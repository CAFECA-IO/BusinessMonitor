import { getAgent } from '@/__tests__/helpers/agent';
import { Routes } from '@/config/api-routes';

const agent = getAgent();

async function pickSampleCompanyId(): Promise<number> {
  const name = process.env.IT_SAMPLE_COMPANY_NAME ?? '台積電';
  const url = Routes.companies.search({ q: name, page: 1, pageSize: 5 });
  const res = await agent.get(url).expect(200);
  const items = res.body.payload.items as Array<{ id: number }>;
  if (!items?.length) throw new Error('No sample company found from search');
  return items[0].id;
}

describe('Company Detail APIs (integration, black-box)', () => {
  let sampleId = 0;

  beforeAll(async () => {
    sampleId = await pickSampleCompanyId();
  });

  it('GET /companies/:id/basic → 200 基本資訊', async () => {
    const url = Routes.companies.basic({ id: sampleId });
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
      id: sampleId,
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
    const url = Routes.companies.basic({ id: 987654321 });
    const res = await agent.get(url).expect(404);
    expect(res.body.success).toBe(false);
  });
});

import { getAgent } from '@/__tests__/helpers/agent';
import { Routes } from '@/config/api-routes';

const agent = getAgent();

describe('GET /api/v1/companies/new (integration, black-box)', () => {
  it('200：正常（預設 limit=10）', async () => {
    const url = Routes.companies.newest(); // Info: (20250819 - Tzuhan) 無參數走後端預設 10
    const res = await agent.get(url).expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.code).toBe('OK');

    const items = res.body.payload as Array<Record<string, unknown>>;
    expect(Array.isArray(items)).toBe(true);
    // Info: (20250819 - Tzuhan) 資料量會依 DB 而異，黑箱僅驗證「不超過 10」
    expect(items.length).toBeLessThanOrEqual(10);

    if (items.length > 0) {
      const card = items[0] as Record<string, unknown>;
      expect(card).toHaveProperty('id');
      expect(card).toHaveProperty('name');
      expect(card).toHaveProperty('registrationNo');
      expect(card).toHaveProperty('flags');
      expect(card).toHaveProperty('market');
      expect(Array.isArray((card.market as { sparkline: unknown[] }).sparkline)).toBe(true);
    }
  });

  it('200：limit=1', async () => {
    const url = Routes.companies.newest({ limit: 1 });
    const res = await agent.get(url).expect(200);

    expect(res.body.success).toBe(true);
    const items = res.body.payload as Array<unknown>;
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeLessThanOrEqual(1);
  });

  it.skip('422：limit 非法（=0）', async () => {
    const url = Routes.companies.newest({ limit: 0 });
    const res = await agent.get(url).expect(422);

    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.payload).toBeNull();
  });
});

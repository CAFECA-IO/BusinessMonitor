import { getAgent } from '@/__tests__/helpers/agent';
import { Routes } from '@/config/api-routes';

const agent = getAgent();

describe('GET /api/v1/companies/search (integration, black-box)', () => {
  it('400：缺少必要參數 q', async () => {
    const url = Routes.companies.search({ q: '', page: 1, pageSize: 10 });
    const res = await agent.get(url).expect(400);
    expect(res.body.success).toBe(false);
    expect(res.body.payload).toBeNull();
  });

  it('404：查無資料（極低機率字串）', async () => {
    const impossible = `no_such_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const url = Routes.companies.search({ q: impossible, page: 1, pageSize: 10 });
    const res = await agent.get(url).expect(404);
    expect(res.body.success).toBe(false);
    expect(res.body.payload).toBeNull();
  });

  it('200：以名稱關鍵字搜尋（僅透過 API 探測關鍵字）', async () => {
    const url = Routes.companies.search({ q: '台積電', page: 1, pageSize: 10 });
    const res = await agent.get(url).expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.code).toBe('OK');
    expect(res.body.payload.page).toBe(1);

    const items = res.body.payload.items as Array<Record<string, unknown>>;
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThan(0);

    const card = items[0];
    expect(card).toHaveProperty('id');
    expect(card).toHaveProperty('name');
    expect(card).toHaveProperty('registrationNo');
    expect(card).toHaveProperty('market');
    expect(Array.isArray((card.market as { sparkline: unknown[] }).sparkline)).toBe(true);
  });

  it('200：統編全等應排第一（從環境變數注入 IT_SAMPLE_REGNO）', async () => {
    const regno = process.env.IT_SAMPLE_REGNO ?? '98888889';
    const url = Routes.companies.search({ q: regno, page: 1, pageSize: 10 });
    const res = await agent.get(url).expect(200);
    const items = res.body.payload.items as Array<{ registrationNo: string }>;
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].registrationNo).toBe(regno);
  });

  // Info: (20250815 - Tzuhan) ---- 注入防禦：多型態變體 ----

  it('防止注入：分號與註解', async () => {
    const res = await agent
      .get(
        Routes.companies.search({
          q: `'; DROP TABLE company; --`,
          page: 1,
          pageSize: 10,
        })
      )
      .expect(400);
    expect(res.body.success).toBe(false);
  });

  it('防止注入：邏輯短路 OR 1=1（含前置引號與註解）', async () => {
    const res = await agent
      .get(
        Routes.companies.search({
          q: `' OR 1=1 --`,
          page: 1,
          pageSize: 10,
        })
      )
      .expect(400);
    expect(res.body.success).toBe(false);
  });

  it('防止注入：大小寫混合與塊註解', async () => {
    const res = await agent
      .get(
        Routes.companies.search({
          q: `") oR 1=1 /* hack */`,
          page: 1,
          pageSize: 10,
        })
      )
      .expect(400);
    expect(res.body.success).toBe(false);
  });

  it('防止注入：雙管道與 AND', async () => {
    const res = await agent
      .get(
        Routes.companies.search({
          q: `a || true AND 'b'='b'`,
          page: 1,
          pageSize: 10,
        })
      )
      .expect(400);
    expect(res.body.success).toBe(false);
  });

  it('防止注入：Null byte（\x00）', async () => {
    const res = await agent
      .get(
        Routes.companies.search({
          q: `abc\x00def`,
          page: 1,
          pageSize: 10,
        })
      )
      .expect(400);
    expect(res.body.success).toBe(false);
  });

  // Info: (20250815 - Tzuhan) ---- 邊界：非純數字不應命中統編條件（不可出現 500） ----

  it('健壯性：長英數非中文（但不是極低機率）不應超時或 500', async () => {
    const q = 'enterprise_monitor_search_keyword';
    const url = Routes.companies.search({ q, page: 1, pageSize: 10 });
    const res = await agent.get(url).expect((r) => {
      // Info: (20250815 - Tzuhan) 200（找得到）或 404（找不到）都算合理，只要不 5xx、不超時
      if (![200, 404].includes(r.status)) {
        throw new Error(`Unexpected status: ${r.status}`);
      }
    });
    expect([true, false]).toContain(res.body.success);
  });
});

it('防止注入：全形關鍵字繞過（toHalfWidth 後應命中）', async () => {
  // Info: (20250815 - Tzuhan) 全形 ＯＲ 與 ＝，以及註解符號
  const res = await agent
    .get(
      Routes.companies.search({
        q: ` ＯＲ 1＝1 --`,
        page: 1,
        pageSize: 10,
      })
    )
    .expect(400);
  expect(res.body.success).toBe(false);
});

it('防止注入：零寬字元繞過（stripZeroWidth 後應命中）', async () => {
  // Info: (20250815 - Tzuhan) 在 o 與 r 之間插入 \u200B（Zero Width Space）
  const tricky = `o\u200Br 1=1`;
  const res = await agent
    .get(
      Routes.companies.search({
        q: tricky,
        page: 1,
        pageSize: 10,
      })
    )
    .expect(400);
  expect(res.body.success).toBe(false);
});

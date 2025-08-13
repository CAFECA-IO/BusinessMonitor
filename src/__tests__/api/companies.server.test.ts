import request from 'supertest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const { port } = JSON.parse(readFileSync(join(tmpdir(), 'bm_next_test.json'), 'utf-8'));
const agent = request(`http://127.0.0.1:${port}`);
const BASE = '/api/v1/companies/search';

describe('GET /api/v1/companies/search (integration, black-box)', () => {
  it('400：缺少必要參數 q', async () => {
    const res = await agent.get(BASE).query({ page: '1', pageSize: '10' }).expect(400);
    expect(res.body.success).toBe(false);
    expect(res.body.payload).toBeNull();
  });

  it('404：查無資料（極低機率字串）', async () => {
    const impossible = `no_such_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const res = await agent
      .get(BASE)
      .query({ q: impossible, page: '1', pageSize: '10' })
      .expect(404);
    expect(res.body.success).toBe(false);
    expect(res.body.payload).toBeNull();
  });

  it('200：以名稱關鍵字搜尋（僅透過 API 探測關鍵字）', async () => {
    const res = await agent.get(BASE).query({ q: '台積電', page: '1', pageSize: '10' }).expect(200);
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
    expect(Array.isArray(card['trend'])).toBe(true);
  });

  it('200：統編全等應排第一（從環境變數注入 IT_SAMPLE_REGNO）', async () => {
    const regno = process.env.IT_SAMPLE_REGNO ?? '98888889';
    const res = await agent.get(BASE).query({ q: regno, page: '1', pageSize: '10' }).expect(200);
    const items = res.body.payload.items as Array<{ registrationNo: string }>;
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].registrationNo).toBe(regno);
  });
});

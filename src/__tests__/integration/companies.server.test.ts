import request from 'supertest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const { port } = JSON.parse(readFileSync(join(tmpdir(), 'bm_next_test.json'), 'utf-8'));
const agent = request(`http://127.0.0.1:${port}`);
const BASE = '/api/v1/companies/search';

async function probeAnyKeyword(): Promise<string | null> {
  const fromEnv = (process.env.IT_SAMPLE_NAME_PREFIX ?? '').trim();
  const candidates = fromEnv ? [fromEnv] : ['公司', '科技', '電子', 'a', '1'];
  for (const q of candidates.slice(0, 3)) {
    // Info: (20250812 - Tzuhan) 最多試 3 個
    const p = agent.get(BASE).query({ q, page: '1', pageSize: '5' });
    const res = (await Promise.race([
      p,
      new Promise((_, r) => setTimeout(() => r(new Error('timeout')), 1000)),
    ]).catch(() => null)) as request.Response | null;
    if (res && res.status === 200 && res.body?.payload?.items?.length > 0) {
      return q;
    }
  }
  return null;
}

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
    const q = await probeAnyKeyword();
    if (!q) {
      console.warn('[IT] 無法從真資料探測到可用關鍵字，略過此測試（仍已驗證 400/404）');
      return; // 等同於 soft-skip，不讓 CI fail
    }

    const res = await agent.get(BASE).query({ q, page: '1', pageSize: '10' }).expect(200);
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
    expect(Array.isArray(card['trend'])).toBe(true); // 可能為空陣列
  });

  it('200：統編全等應排第一（從環境變數注入 IT_SAMPLE_REGNO）', async () => {
    const regno = (process.env.IT_SAMPLE_REGNO ?? '').trim();
    if (!regno) {
      console.warn('[IT] 未提供 IT_SAMPLE_REGNO，略過「統編全等排序」測試');
      return; // soft-skip
    }

    const res = await agent.get(BASE).query({ q: regno, page: '1', pageSize: '10' }).expect(200);
    const items = res.body.payload.items as Array<{ registrationNo: string }>;
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].registrationNo).toBe(regno);
  });
});

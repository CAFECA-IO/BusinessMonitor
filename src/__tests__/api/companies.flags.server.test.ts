import { getAgent } from '@/__tests__/helpers/agent';
import { Routes } from '@/config/api-routes';
import { ApiCode } from '@/lib/status';

const agent = getAgent();
const companyId = Number(process.env.IT_SAMPLE_COMPANY_ID ?? '1');

describe('GET /api/v1/companies/:id/flags (integration, black-box)', () => {
  it('200：預設 type=red；分頁欄位齊全；items 可為空', async () => {
    const url = Routes.companies.flagsQ({ id: companyId }); // 不帶 type
    const res = await agent.get(url).expect(200);
    expect(res.body.success).toBe(true);
    const p = res.body.payload as {
      items: Array<{ date: string; level: number; event: string }>;
      page: number;
      pageSize: number;
      total: number;
      pages: number;
    };
    expect(Array.isArray(p.items)).toBe(true);
    if (p.items[0]) {
      expect(/^\d{4}-\d{2}-\d{2}$/.test(p.items[0].date)).toBe(true);
      expect(typeof p.items[0].level).toBe('number');
      expect(typeof p.items[0].event).toBe('string');
    }
  });

  it('200：type=green 也可用', async () => {
    const url = Routes.companies.flagsQ({ id: companyId }, { type: 'green', page: 1, pageSize: 5 });
    const res = await agent.get(url).expect(200);
    expect(res.body.success).toBe(true);
  });

  it('400：非法 type', async () => {
    const url = `${Routes.companies.flags({ id: companyId })}?type=blue`;
    const res = await agent.get(url).expect(400);
    expect(res.body.code).toBe(ApiCode.VALIDATION_ERROR);
  });

  it('400：pageSize=0', async () => {
    const url = Routes.companies.flagsQ({ id: companyId }, { pageSize: 0 });
    const res = await agent.get(url).expect(400);
    expect(res.body.code).toBe(ApiCode.VALIDATION_ERROR);
  });
});

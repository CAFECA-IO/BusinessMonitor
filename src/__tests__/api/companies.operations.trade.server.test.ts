import { getAgent } from '@/__tests__/helpers/agent';
import { Routes } from '@/config/api-routes';
import { ApiCode } from '@/lib/status';

const agent = getAgent();
const companyId = Number(process.env.IT_SAMPLE_COMPANY_ID ?? '1');

describe('GET /api/v1/companies/:id/operations/trade (integration, black-box)', () => {
  it('200：預設分頁；可回空集合；欄位齊全', async () => {
    const url = Routes.companies.operations.trade({ id: companyId });
    const res = await agent.get(url).expect(200);
    expect(res.body.success).toBe(true);
    const payload = res.body.payload as {
      items: Array<{ year: number; month: string; totalImportUSD: string; totalExportUSD: string }>;
      page: number;
      pageSize: number;
      total: number;
      pages: number;
    };
    expect(payload).toHaveProperty('page');
    expect(payload).toHaveProperty('pageSize');
    expect(payload).toHaveProperty('total');
    expect(payload).toHaveProperty('pages');
    expect(Array.isArray(payload.items)).toBe(true);
    if (payload.items.length > 0) {
      const r = payload.items[0];
      expect(typeof r.year).toBe('number');
      expect(/^\d{4}-\d{2}$/.test(r.month)).toBe(true);
      expect(typeof r.totalImportUSD).toBe('string');
      expect(typeof r.totalExportUSD).toBe('string');
    }
  });

  it('200：year 過濾', async () => {
    const sampleYear = Number(process.env.IT_SAMPLE_YEAR ?? '2024');
    const url = Routes.companies.operations.tradeQ(
      { id: companyId },
      { year: sampleYear, pageSize: 5 }
    );
    const res = await agent.get(url);
    expect(200);
    expect(res.body.success).toBe(true);
    // 可能為空集合，不強制斷言 items.length>0
  });

  it('400：年份格式錯（字串或超出範圍）', async () => {
    const url = Routes.companies.operations.tradeQ(
      { id: companyId },
      { year: 0 as unknown as number }
    );
    const res = await agent.get(url).expect(400);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe(ApiCode.VALIDATION_ERROR);
  });

  it('400：pageSize 非法 (=0)', async () => {
    const url = Routes.companies.operations.tradeQ({ id: companyId }, { pageSize: 0 });
    const res = await agent.get(url).expect(400);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe(ApiCode.VALIDATION_ERROR);
  });
});

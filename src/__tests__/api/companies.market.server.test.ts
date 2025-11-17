import { getAgent } from '@/__tests__/helpers/agent';
import { routes } from '@/config/api_routes';
import { companyMarketResponseSchema } from '@/validators';
import { subDays, format } from 'date-fns';

const agent = getAgent();

const companyId = 291652;
const nonExistentCompanyId = 37759808;

describe('GET /api/v1/companies/:id/market (Final Integration Test)', () => {
  let latestTradingDate: Date | null = null;

  // Info: (20251002 - Tzuhan) 在所有測試前，先取得最新的交易日期，以確保測試的日期基準是有效的
  beforeAll(async () => {
    const url = `${routes.companies.market({ id: companyId })}?timeframe=1d`;
    const res = await agent.get(url);
    if (res.status === 200) {
      const { payload } = companyMarketResponseSchema.parse(res.body);
      if (payload.data.length > 0) {
        latestTradingDate = new Date(payload.data[0].date);
      }
    }
  });

  it('預設行為：不帶任何參數時，應回傳最近三個月的每日資料', async () => {
    const url = routes.companies.market({ id: companyId });
    const res = await agent.get(url).expect(200);
    const { payload } = companyMarketResponseSchema.parse(res.body);
    expect(payload.timeframe).toBe('3m');
    expect(payload.data.length).toBeGreaterThan(0);
  });

  it('Timeframe "1d" (今日)：應回傳最新交易日的當日所有資料', async () => {
    const url = `${routes.companies.market({ id: companyId })}?timeframe=1d`;
    const res = await agent.get(url).expect(200);
    const { payload } = companyMarketResponseSchema.parse(res.body);
    expect(payload.timeframe).toBe('1d');
    expect(payload.data.length).toBeGreaterThan(0);
  });

  it('Timeframe "1w" (一週)：應回傳最近一週的每日資料', async () => {
    const url = `${routes.companies.market({ id: companyId })}?timeframe=1w`;
    const res = await agent.get(url).expect(200);
    const { payload } = companyMarketResponseSchema.parse(res.body);
    expect(payload.timeframe).toBe('1w');
    expect(payload.data.length).toBeGreaterThan(0);
  });

  it('Timeframe "1y" (一年)：應回傳最近一年的每週資料', async () => {
    const url = `${routes.companies.market({ id: companyId })}?timeframe=1y`;
    const res = await agent.get(url).expect(200);
    const { payload } = companyMarketResponseSchema.parse(res.body);
    expect(payload.timeframe).toBe('1y');
    expect(payload.data.length).toBeGreaterThan(0);
  });

  it('Timeframe "all" (全部)：應回傳所有的每月資料', async () => {
    const url = `${routes.companies.market({ id: companyId })}?timeframe=all`;
    const res = await agent.get(url).expect(200);
    const { payload } = companyMarketResponseSchema.parse(res.body);
    expect(payload.timeframe).toBe('all');
    expect(payload.data.length).toBeGreaterThan(0);
  });

  it('使用 from/to 參數：應基於最新資料回傳有效區間內的資料', async () => {
    // Info: (20251002 - Tzuhan) 如果無法取得最新日期，則跳過此測試
    if (!latestTradingDate) {
      console.warn('Skipping from/to test: could not determine latest trading date.');
      return;
    }

    const to = format(latestTradingDate, 'yyyy-MM-dd');
    const from = format(subDays(latestTradingDate, 4), 'yyyy-MM-dd');

    const url = `${routes.companies.market({ id: companyId })}?from=${from}&to=${to}`;
    const res = await agent.get(url).expect(200);

    const { payload } = companyMarketResponseSchema.parse(res.body);
    expect(payload.timeframe).toBe('custom');
    expect(payload.data.length).toBeGreaterThan(1);
    expect(payload.data.length).toBeLessThanOrEqual(5);
  });

  it('錯誤案例 1：當 timeframe 與 from/to 參數並存時，應回傳 400 驗證錯誤', async () => {
    const url = `${routes.companies.market({
      id: companyId,
    })}?timeframe=1m&from=2024-01-01&to=2024-01-31`;
    const res = await agent.get(url).expect(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.message).toContain('timeframe 參數不可與 from/to 參數同時使用');
  });

  it('錯誤案例 2：當 company ID 不存在時，應回傳 404 Not Found', async () => {
    const url = routes.companies.market({ id: nonExistentCompanyId });
    const res = await agent.get(url).expect(404);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('NOT_FOUND');
  });

  it('邊界案例：查詢一個沒有資料的日期區間時，應回傳空陣列', async () => {
    const from = '1990-01-01';
    const to = '1990-01-10';
    const url = `${routes.companies.market({ id: companyId })}?from=${from}&to=${to}`;
    const res = await agent.get(url).expect(200);

    const { payload } = companyMarketResponseSchema.parse(res.body);
    expect(payload.data.length).toBe(0);
  });
});

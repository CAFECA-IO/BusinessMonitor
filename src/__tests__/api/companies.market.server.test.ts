import { getAgent } from '@/__tests__/helpers/agent';
import { routes } from '@/config/api-routes';
import { companyMarketResponseSchema } from '@/validators';

const agent = getAgent();

const companyId = Number(process.env.IT_SAMPLE_COMPANY_ID ?? '142');
const nonExistentCompanyId = 37759808;

// Todo: (20250922 - Tzuhan) 完成市場跟公司資料的關聯後再打開這個測試
describe('GET /api/v1/companies/:id/market (Refactored)', () => {
  /**
   * Info: (20250922 - Tzuhan)
   * 測試案例 1: 預設行為 (daily)
   * 驗證在沒有任何查詢參數時，API 是否能成功回傳 timeframe 為 'daily' 的數據。
   */
  it('應成功回傳預設的每日 (daily) 市場數據', async () => {
    const url = routes.companies.market({ id: companyId });
    const res = await agent.get(url).expect(200);

    // Info: (20250922 - Tzuhan) 使用 Zod schema 驗證整個 API 回應的結構是否符合預期
    const validationResult = companyMarketResponseSchema.safeParse(res.body);
    expect(validationResult.success).toBe(true);

    if (validationResult.success) {
      const { payload } = validationResult.data;
      expect(payload.companyId).toBe(companyId);
      expect(payload.timeframe).toBe('daily');
      expect(Array.isArray(payload.data)).toBe(true);
      expect(payload.data.length).toBeGreaterThan(0);
      expect(payload.data[0]).toHaveProperty('date');
      expect(payload.data[0]).toHaveProperty('open');
      expect(payload.data[0]).toHaveProperty('high');
      expect(payload.data[0]).toHaveProperty('low');
      expect(payload.data[0]).toHaveProperty('close');
      expect(payload.data[0]).toHaveProperty('volume');
    }
  });

  /**
   * Info: (20250922 - Tzuhan)
   * 測試案例 2: 指定 timeframe=weekly
   * 驗證 API 是否能正確處理 'weekly' 參數。
   */
  it('應成功回傳每週 (weekly) 市場數據', async () => {
    const url = `${routes.companies.market({ id: companyId })}?timeframe=weekly`;
    const res = await agent.get(url).expect(200);

    const validationResult = companyMarketResponseSchema.safeParse(res.body);
    expect(validationResult.success).toBe(true);
    if (validationResult.success) {
      expect(validationResult.data.payload.timeframe).toBe('weekly');
    }
  });

  /**
   * Info: (20250922 - Tzuhan)
   * 測試案例 3: 指定 timeframe=monthly
   * 驗證 API 是否能正確處理 'monthly' 參數。
   */
  it('應成功回傳每月 (monthly) 市場數據', async () => {
    const url = `${routes.companies.market({ id: companyId })}?timeframe=monthly`;
    const res = await agent.get(url).expect(200);

    const validationResult = companyMarketResponseSchema.safeParse(res.body);
    expect(validationResult.success).toBe(true);
    if (validationResult.success) {
      expect(validationResult.data.payload.timeframe).toBe('monthly');
    }
  });

  /**
   * Info: (20250922 - Tzuhan)
   * 測試案例 4: 錯誤處理 - 非法的 timeframe
   * 驗證當傳入不合法的 timeframe 參數時，API 是否會回傳 400 驗證錯誤。
   */
  it('當 timeframe 參數非法時，應回傳 400 驗證錯誤', async () => {
    const url = `${routes.companies.market({ id: companyId })}?timeframe=yearly`;
    const res = await agent.get(url).expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.message).toContain("timeframe 參數僅接受 'daily', 'weekly', 'monthly'");
  });

  /**
   * Info: (20250922 - Tzuhan)
   * 測試案例 5: 錯誤處理 - 公司 ID 不存在
   * 驗證當傳入一個不存在的 companyId 時，API 是否會回傳 404 Not Found。
   */
  it('當 company ID 不存在時，應回傳 404 Not Found', async () => {
    const url = routes.companies.market({ id: nonExistentCompanyId });
    const res = await agent.get(url).expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('NOT_FOUND');
  });
});

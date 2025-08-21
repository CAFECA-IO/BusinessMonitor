import { getAgent } from '@/__tests__/helpers/agent';
import { Routes } from '@/config/api-routes';

const agent = getAgent();
// Info: (20250819 - Tzuhan) 測試使用的公司 id：可由環境變數注入，否則預設 1
const companyId = Number(process.env.IT_SAMPLE_COMPANY_ID ?? '1');

describe('POST /api/v1/companies/:id/view (integration, black-box)', () => {
  const path = Routes.companies.view({ id: companyId });

  it('201：第一次計數', async () => {
    const res = await agent
      .post(path)
      // Info: (20250819 - Tzuhan) 固定 IP/UA，確保 idempotency 可被檢驗
      .set('x-forwarded-for', '9.9.9.9')
      .set('user-agent', 'bm-tests/1.0')
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.code).toBe('OK');
    expect(res.body.payload).toEqual({ created: true });
  });

  it('200：相同 IP+UA 當天重送為 idempotent（不重覆計數）', async () => {
    const res = await agent
      .post(path)
      .set('x-forwarded-for', '9.9.9.9') // Info: (20250819 - Tzuhan) 與前一個 case 相同
      .set('user-agent', 'bm-tests/1.0') // Info: (20250819 - Tzuhan) 與前一個 case 相同
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.code).toBe('OK');
    expect(res.body.payload).toEqual({ created: false });
  });
});

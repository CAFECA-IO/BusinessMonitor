import { getAgent } from '@/__tests__/helpers/agent';
import { Routes } from '@/config/api-routes';
import { ApiCode } from '@/lib/status';

const agent = getAgent();
const companyId = Number(process.env.IT_SAMPLE_COMPANY_ID ?? '1');

describe('GET /api/v1/companies/:id/comments (integration, black-box)', () => {
  it('200：預設分頁，回傳分頁容器；items 為陣列（可為空）', async () => {
    const url = Routes.companies.comments({ id: companyId });
    const res = await agent.get(url).expect(200);

    expect(res.body.success).toBe(true);
    const payload = res.body.payload as {
      items: Array<{
        id: number;
        userName?: string | null;
        userAvatar?: string | null;
        content: string;
        createdAt: string;
        likes: number;
        comments: number;
        shares: number;
      }>;
      page: number;
      pageSize: number;
      total: number;
      pages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };

    expect(Array.isArray(payload.items)).toBe(true);
    expect(typeof payload.page).toBe('number');
    expect(typeof payload.pageSize).toBe('number');
    expect(typeof payload.total).toBe('number');
    expect(typeof payload.pages).toBe('number');

    if (payload.items.length > 0) {
      const c = payload.items[0];
      expect(typeof c.id).toBe('number');
      expect(typeof c.content).toBe('string');
      expect(/^\d{4}-\d{2}-\d{2}$/.test(c.createdAt)).toBe(true);
      expect(typeof c.likes).toBe('number');
      expect(typeof c.comments).toBe('number');
      expect(typeof c.shares).toBe('number');
    }
  });

  it('400：page 非法 (=0)', async () => {
    const url = Routes.companies.commentsQ({ id: companyId }, { page: 0, pageSize: 10 });
    const res = await agent.get(url).expect(400);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe(ApiCode.VALIDATION_ERROR);
  });

  it('400：pageSize 非法 (=0)', async () => {
    const url = Routes.companies.commentsQ({ id: companyId }, { pageSize: 0 });
    const res = await agent.get(url).expect(400);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe(ApiCode.VALIDATION_ERROR);
  });
});

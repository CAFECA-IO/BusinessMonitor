import { getAgent } from '@/__tests__/helpers/agent';
import { Routes } from '@/config/api-routes';
import { ApiCode } from '@/lib/status';

const agent = getAgent();
const companyId = Number(process.env.IT_SAMPLE_COMPANY_ID ?? '1');

describe('GET /api/v1/companies/:id/announcements (integration, black-box)', () => {
  it('200：正常（預設 limit=10）；可回空陣列', async () => {
    const url = Routes.companies.announcements({ id: companyId });
    const res = await agent.get(url).expect(200);

    expect(res.body.success).toBe(true);
    const items = res.body.payload as Array<{
      id: number;
      title: string;
      date: string;
      content?: string | null;
      imageUrl?: string | null;
      views?: number;
      shares?: number;
      isPinned?: boolean;
    }>;

    expect(Array.isArray(items)).toBe(true);

    if (items.length > 0) {
      const it = items[0];
      expect(typeof it.id).toBe('number');
      expect(typeof it.title).toBe('string');
      expect(/^\d{4}-\d{2}-\d{2}$/.test(it.date)).toBe(true);
      if (it.content !== undefined && it.content !== null) {
        expect(typeof it.content).toBe('string');
      }
      if (it.imageUrl !== undefined && it.imageUrl !== null) {
        expect(typeof it.imageUrl).toBe('string');
      }
      if (it.views !== undefined) expect(typeof it.views).toBe('number');
      if (it.shares !== undefined) expect(typeof it.shares).toBe('number');
      if (it.isPinned !== undefined) expect(typeof it.isPinned).toBe('boolean');
    }
  });

  it('400：limit 非法 (=0)', async () => {
    const url = Routes.companies.announcementsQ({ id: companyId }, { limit: 0 });
    const res = await agent.get(url).expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe(ApiCode.VALIDATION_ERROR);
  });

  it('400：limit 非法（非數字）', async () => {
    // Info: (20250902 - Tzuhan) 直接在 querystring 模擬非法值
    const url = `${Routes.companies.announcements({ id: companyId })}?limit=foo`;
    const res = await agent.get(url).expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe(ApiCode.VALIDATION_ERROR);
  });
});

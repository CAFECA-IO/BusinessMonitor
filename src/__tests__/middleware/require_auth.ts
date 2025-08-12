import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/require_auth';
import { signJwt } from '@/lib/auth';
import { ApiResponse, ok } from '@/lib/response';

const buildRequest = (token?: string) =>
  new Request('http://localhost/api/test', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }) as unknown as NextRequest;

describe('requireAuth', () => {
  // Info: (20250812 - Tzuhan) 確保用對稱金鑰，測試簡單
  const OLD_SECRET = process.env.JWT_SECRET;
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret-1234567890';
  });
  afterAll(() => {
    process.env.JWT_SECRET = OLD_SECRET;
  });

  it('missing header -> 401', async () => {
    const handler = requireAuth(async () => ok({}));
    const res = (await handler(buildRequest(), {})) as NextResponse<ApiResponse<null>>;
    const json = await res.json();
    expect(res.status).toBe(401);
    expect(json.success).toBe(false);
  });

  it('expired token -> 401', async () => {
    const token = signJwt(
      {
        sub: 'u1',
        email: 'a@a.com',
        name: 'A',
        provider: 'google',
        avatar: '',
      },
      { expiresIn: '1ms' }
    );
    await new Promise((r) => setTimeout(r, 10));

    const handler = requireAuth(async () => ok({}));

    const res = (await handler(buildRequest(), {})) as NextResponse<ApiResponse<null>>;
    expect(res.status).toBe(401);
  });

  it('valid token -> handler receives user', async () => {
    const token = signJwt({
      sub: 'u1',
      email: 'a@a.com',
      name: 'A',
      provider: 'google',
      roles: ['admin'],
      avatar: '',
    });

    const handler = requireAuth(async (_req, { user }) => {
      expect(user.id).toBe('u1');
      expect(user.provider).toBe('google');
      expect(user.roles).toEqual(['admin']);
      return ok({ ok: true });
    });

    const res = (await handler(buildRequest(), {})) as NextResponse<ApiResponse<null>>;
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
  });
});

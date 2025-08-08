import { NextRequest, NextResponse } from 'next/server';
import { assertAuth, AuthUser } from '@/lib/auth';
import { AppError } from '@/lib/error';
import { fail } from '@/lib/response';
import { ApiCode, HttpMap } from '@/lib/status';

type Ctx = { params?: Record<string, string> };
type Handler<T> = (req: NextRequest, ctx: Ctx & { user: AuthUser }) => Promise<T> | T;

export const requireAuth =
  <T>(handler: Handler<T>) =>
  async (req: NextRequest, ctx: Ctx) => {
    try {
      const user = assertAuth(req);
      // Info: (20250808 - Tzuhan) 傳進去 handler 的 ctx.user（避免直接改寫 req）
      return await handler(req, { ...ctx, user });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        return NextResponse.json(fail(err.code, err.message), {
          status: HttpMap[err.code] ?? 401,
        });
      }
      return NextResponse.json(fail(ApiCode.UNAUTHENTICATED, 'Unauthorized'), { status: 401 });
    }
  };

import { NextRequest } from 'next/server';
import { verifyDeWT } from '@/lib/dewt';
import { jsonFail } from '@/lib/response';
import { ApiCode } from '@/lib/status';

export type DeWTUser = {
  id: string;
  scope: string[];
  amr: ['fido2'];
  credIdHash?: string;
  ncfcid?: string;
};

type Ctx = { params?: Record<string, string> };
type Handler<T> = (req: NextRequest, ctx: Ctx & { user: DeWTUser }) => Promise<T> | T;

function bearer(req: NextRequest): string | null {
  const a = req.headers.get('authorization') ?? '';
  if (!a.toLowerCase().startsWith('bearer ')) return null;
  return a.slice(7).trim();
}

export const requireDeWT =
  <T>(handler: Handler<T>) =>
  async (req: NextRequest, ctx: Ctx) => {
    try {
      const token = bearer(req);
      if (!token) return jsonFail(ApiCode.UNAUTHENTICATED, 'Missing Bearer');
      const p = await verifyDeWT(token);
      const sub = typeof p.sub === 'string' ? p.sub : '';
      if (!sub) return jsonFail(ApiCode.UNAUTHENTICATED, 'Invalid DeWT');
      const user: DeWTUser = {
        id: sub,
        scope: Array.isArray(p.scope) ? (p.scope as string[]) : [],
        amr: ['fido2'],
        credIdHash: typeof p.credIdHash === 'string' ? p.credIdHash : undefined,
        ncfcid: typeof p.ncfcid === 'string' ? p.ncfcid : undefined,
      };
      return await handler(req, { ...ctx, user });
    } catch {
      return jsonFail(ApiCode.UNAUTHENTICATED, 'Invalid or expired DeWT');
    }
  };

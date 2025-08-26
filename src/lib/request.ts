import { NextRequest } from 'next/server';
import { createHash } from 'node:crypto';

export function clientIp(req: NextRequest): string {
  const xfwd = req.headers.get('x-forwarded-for');
  if (xfwd) return xfwd.split(',')[0].trim();
  const xreal = req.headers.get('x-real-ip');
  return xreal ?? '0.0.0.0';
}

export function ipUaHash(ip: string, ua: string | null): string {
  const h = createHash('sha256');
  h.update(ip);
  if (ua) h.update('|').update(ua);
  return h.digest('hex').slice(0, 32);
}

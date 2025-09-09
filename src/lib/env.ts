import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  RPID: z.string().min(1, 'RPID is required'), // Info: (20250909 - Tzuhan) 例：localhost 或 bm.example.com
  ORIGIN: z.string().url('ORIGIN must be a valid URL'), // Info: (20250909 - Tzuhan) 例：http://localhost:3000
  SESSION_KID: z.string().min(1, 'SESSION_KID is required'),
  SESSION_JWK: z.string().min(1, 'SESSION_JWK is required'), // Info: (20250909 - Tzuhan) 私鑰 JWK（JSON 或 base64url）
  SESSION_ISS: z.string().default('bm'),
  SESSION_AUD: z.string().default('bm-web'),
  SESSION_MAX_AGE_SEC: z.coerce.number().default(15 * 60), // Info: (20250909 - Tzuhan) 15 分鐘
  COOKIE_DOMAIN: z.string().optional(), // Info: (20250909 - Tzuhan) 正式可設為 .example.com
  COOKIE_SECURE: z
    .preprocess((v) => String(v ?? 'true').toLowerCase(), z.enum(['true', 'false']))
    .default('true'),
});

export const env = EnvSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  RPID: process.env.RPID,
  ORIGIN: process.env.ORIGIN,
  SESSION_KID: process.env.SESSION_KID,
  SESSION_JWK: process.env.SESSION_JWK,
  SESSION_ISS: process.env.SESSION_ISS,
  SESSION_AUD: process.env.SESSION_AUD,
  SESSION_MAX_AGE_SEC: process.env.SESSION_MAX_AGE_SEC,
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,
});

// Info: (20250909 - Tzuhan) 解析 SESSION_JWK：允許 base64url 或 JSON
export function parseSessionJwk<T extends object = Record<string, unknown>>(raw: string): T {
  try {
    // Info: (20250909 - Tzuhan) JSON 直接 parse
    return JSON.parse(raw) as T;
  } catch {
    // Info: (20250909 - Tzuhan) 否則視為 base64url
    const buf = Buffer.from(raw.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
    return JSON.parse(buf.toString('utf8')) as T;
  }
}

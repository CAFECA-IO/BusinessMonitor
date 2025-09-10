import { z } from 'zod';

const EnvSchema = z.object({
  // Info: (20250910 - Tzuhan) --- General ---
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // Info: (20250910 - Tzuhan) --- WebAuthn ---
  RPID: z.string().min(1, 'RPID is required'), // Info: (20250910 - Tzuhan) 例：localhost 或 bm.example.com [cite]
  ORIGIN: z.url('ORIGIN must be a valid URL'), // Info: (20250910 - Tzuhan) 例：http: // Info: (20250910 - Tzuhan)localhost:3000 [cite]

  // Info: (20250910 - Tzuhan) --- DeWT ---
  DEWT_ISS: z.string().min(1), // Info: (20250910 - Tzuhan) [cite]
  DEWT_AUD: z.string().min(1), // Info: (20250910 - Tzuhan) [cite]
  DEWT_MAX_AGE_SEC: z.coerce.number().int().positive(), // Info: (20250910 - Tzuhan) [cite]
  DEWT_KID: z.string().min(1), // Info: (20250910 - Tzuhan) [cite]
  DEWT_JWK: z.string().min(1, 'DEWT_JWK is required for signing tokens'), // Info: (20250910 - Tzuhan) 私鑰 JWK（JSON 或 base64url）
});

// Info: (20250910 - Tzuhan) 解析並導出經過驗證的環境變數
export const env = EnvSchema.parse(process.env);

// Info: (20250910 - Tzuhan) --- Helper Functions (可選，但建議保留) ---

// Info: (20250910 - Tzuhan) 用於解析 base64url 或 JSON 格式的 JWK
export function parseB64uJwk<T extends object = Record<string, unknown>>(raw: string): T {
  try {
    // Info: (20250910 - Tzuhan) 優先嘗試直接解析 JSON
    return JSON.parse(raw) as T;
  } catch {
    // Info: (20250910 - Tzuhan) 否則視為 base64url 處理
    const b64 = raw.replace(/-/g, '+').replace(/_/g, '/');
    const pad = '='.repeat((4 - (b64.length % 4)) % 4);
    const jsonStr = Buffer.from(b64 + pad, 'base64').toString('utf8');
    return JSON.parse(jsonStr) as T;
  }
}

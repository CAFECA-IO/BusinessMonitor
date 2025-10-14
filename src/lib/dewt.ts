import { SignJWT, jwtVerify, importPKCS8, exportJWK, importJWK } from 'jose';
import type { IdentityAccount } from '@prisma/client';
import type { JWTPayload, KeyObject, CryptoKey, JWK } from 'jose';
import { webAuthnRepo } from '@/repositories/webauthn.repo';
import { logger } from '@/lib/logger';

// Info: (20250925 - Tzuhan) --- 環境變數與常數定義 ---
const DEWT_ALG = 'ES256';
const DEWT_ISSUER = process.env.DEWT_ISS ?? 'urn:cafeca:id';
const DEWT_AUDIENCE = process.env.DEWT_AUD ?? 'urn:cafeca:app';
const DEWT_EXPIRATION_TIME = process.env.DEWT_EXPIRATION_TIME ?? '8h';
const PEM_PRIVATE_KEY = process.env.DEWT_PRIVATE_KEY_PEM;

// Info: (20250925 - Tzuhan) --- 金鑰載入與管理 ---
interface ILoadedKeys {
  privateKey: KeyObject | CryptoKey;
  publicKey: KeyObject | CryptoKey;
}

let loadedKeys: ILoadedKeys | null = null;

/**
 * Info: (20250925 - Tzuhan) 從 PEM 格式的環境變數中異步載入並解析 ES256 金鑰對。
 * 這個函式只會在首次需要金鑰時執行一次。
 */
async function loadKeys(): Promise<ILoadedKeys> {
  if (loadedKeys) {
    return loadedKeys;
  }

  if (!PEM_PRIVATE_KEY) {
    logger.error('FATAL: DEWT_PRIVATE_KEY_PEM environment variable is not set.');
    if (typeof process.exit === 'function') {
      process.exit(1);
    }
    throw new Error('DEWT_PRIVATE_KEY_PEM environment variable is not set.');
  }

  try {
    // Info: (20250925 - Tzuhan) 【最終修正】在匯入私鑰時，必須明確告知 jose 我們後續需要將其匯出。
    const privateKey = await importPKCS8(PEM_PRIVATE_KEY, DEWT_ALG, { extractable: true });

    const privateJwk = await exportJWK(privateKey);
    const publicJwk: JWK = {
      kty: privateJwk.kty,
      crv: privateJwk.crv,
      x: privateJwk.x,
      y: privateJwk.y,
    };
    // Info: (20250925 - Tzuhan) 【最終修正】使用類型斷言，明確告知 TypeScript `importJWK` 的結果不會是 Uint8Array。
    const publicKey = (await importJWK(publicJwk, DEWT_ALG)) as KeyObject | CryptoKey;

    loadedKeys = { privateKey, publicKey };
    return loadedKeys;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to load cryptographic keys from DEWT_PRIVATE_KEY_PEM', { error: message });
    if (typeof process.exit === 'function') {
      process.exit(1);
    }
    throw new Error(`Failed to load cryptographic keys from DEWT_PRIVATE_KEY_PEM: ${message}`);
  }
}

/**
 * Info: (20250925 - Tzuhan) 使用 ES256 私鑰簽發一個 DeWT (JWT)。
 * @param identityAccount - 使用者身份帳戶物件。
 * @returns {Promise<string>} 簽發完成的 DeWT 字串。
 */
export const signDeWT = async (identityAccount: IdentityAccount): Promise<string> => {
  const { privateKey } = await loadKeys();
  const dewt = await new SignJWT({ scope: ['user'] }) // 可以在此處加入更多 claims
    .setProtectedHeader({ alg: DEWT_ALG })
    .setSubject(identityAccount.id)
    .setIssuer(DEWT_ISSUER)
    .setAudience(DEWT_AUDIENCE)
    .setExpirationTime(DEWT_EXPIRATION_TIME)
    .setIssuedAt()
    .sign(privateKey);
  return dewt;
};

/**
 * Info: (20250925 - Tzuhan) 使用 ES256 公鑰驗證一個 DeWT 的有效性。
 * @param dewt - 從客戶端收到的 DeWT 字串。
 * @returns {Promise<JWTPayload>} 如果驗證成功，則回傳解析後的 payload。
 */
export const verifyDeWT = async (dewt: string): Promise<JWTPayload> => {
  const { publicKey } = await loadKeys();
  const { payload } = await jwtVerify(dewt, publicKey, {
    issuer: DEWT_ISSUER,
    audience: DEWT_AUDIENCE,
  });
  return payload;
};

/**
 * Info: (20251013 - Tzuhan) 從 Authorization 標頭中解析 DeWT，並查找對應的使用者身份。
 * @param authHeader - 來自 HTTP 請求的 Authorization 標頭字串 (例如 "Bearer ey...")。
 * @returns {Promise<IdentityAccount | null>} 如果驗證成功且找到使用者，則回傳使用者物件，否則回傳 null。
 */
export const getIdentityFromDeWT = async (
  authHeader: string | null | undefined
): Promise<IdentityAccount | null> => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const dewt = authHeader.substring(7); // Info: (20251013 - Tzuhan) 移除 "Bearer " 前綴
  try {
    const payload = await verifyDeWT(dewt);
    const userId = payload.sub;
    if (!userId) {
      logger.warn('DeWT payload is missing "sub" (subject) claim.');
      return null;
    }
    // Info: (20251013 - Tzuhan) 使用 webAuthnRepo 來查找使用者
    const identity = await webAuthnRepo.findIdentityAccountById(userId);
    return identity;
  } catch (error) {
    logger.warn('Failed to verify DeWT or find identity', {
      error: error instanceof Error ? error.message : 'Unknown verification error',
    });
    return null;
  }
};

// Info: (20250925 - Tzuhan) 應用程式啟動時預先載入金鑰，以便及早發現設定錯誤。
loadKeys().catch(() => {
  // Info: (20250925 - Tzuhan) 錯誤已在 loadKeys 內部記錄，此處無需額外操作。
});

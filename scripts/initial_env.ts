import { promises as fs } from 'fs';
import crypto from 'crypto';
import path from 'path';

async function genES256JwkB64u(): Promise<{ b64u: string; kid: string }> {
  try {
    const { subtle } = crypto.webcrypto;
    const keyPair = await subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, [
      'sign',
      'verify',
    ]);
    const jwk = (await subtle.exportKey('jwk', keyPair.privateKey)) as JsonWebKey;
    const pub = (await subtle.exportKey('jwk', keyPair.publicKey)) as JsonWebKey;
    const kidSrc = `${pub.x}.${pub.y}`;
    const kid = 'bm-' + crypto.createHash('sha256').update(kidSrc).digest('base64url').slice(0, 16);
    const b64u = Buffer.from(JSON.stringify(jwk), 'utf8').toString('base64url');
    return { b64u, kid };
  } catch {
    // Info: (20250911 - Tzuhan) 依賴 WebCrypto API，如果失敗則直接拋出錯誤
    throw new Error(
      'Failed to generate ES256 JWK. Please ensure your Node.js version supports WebCrypto API.'
    );
  }
}

/**
 *  Info: (20250911 - Tzuhan) 確保環境變數存在於文件內容中，如果不存在則附加。
 * @param content - 當前的 .env 文件內容
 * @param key - 要檢查的變數名
 * @param valueFn - 一個回傳變數值的函式（延遲執行以提高效率）
 * @returns 更新後的 .env 文件內容
 */
function ensureEnvVar(content: string, key: string, valueFn: () => string): string {
  const regex = new RegExp(`^${key}=.*$`, 'm');
  if (!regex.test(content)) {
    console.log(`  -> Adding missing environment variable: ${key}`);
    // Info: (20250911 - Tzuhan)  確保內容以換行符結尾，以便附加
    if (content.length > 0 && !content.endsWith('\n')) {
      content += '\n';
    }
    return `${content}${key}=${valueFn()}\n`;
  }
  return content;
}

async function initializeEnv() {
  console.log('Checking .env file...');
  const envFile = path.resolve(process.cwd(), '.env');
  const sampleFile = path.resolve(process.cwd(), '.env.example');
  let originalContent = '';

  // Info: (20250911 - Tzuhan) 只讀取一次檔案，並處理檔案不存在的情況
  try {
    originalContent = await fs.readFile(envFile, 'utf-8');
  } catch (error) {
    // Info: (20250911 - Tzuhan) 如果 .env 不存在，嘗試從 .env.example 複製
    try {
      await fs.copyFile(sampleFile, envFile);
      originalContent = await fs.readFile(envFile, 'utf-8');
      console.log('Initialized .env from .env.example.');
    } catch {
      console.log('No .env or .env.example found. A new .env file will be created.');
    }
  }

  let modifiedContent = originalContent;

  // Info: (20250911 - Tzuhan) 統一處理所有需要確保存在的變數
  modifiedContent = ensureEnvVar(modifiedContent, 'UUID', () => crypto.randomUUID());
  modifiedContent = ensureEnvVar(modifiedContent, 'RPID', () => 'localhost');
  modifiedContent = ensureEnvVar(modifiedContent, 'ORIGIN', () => 'http://localhost:3000');

  // Info: (20250911 - Tzuhan) 處理需要非同步產生的 DEWT 金鑰
  const hasJwk = /^DEWT_JWK=.*$/m.test(modifiedContent);
  const hasKid = /^DEWT_KID=.*$/m.test(modifiedContent);

  if (!hasJwk || !hasKid) {
    console.log('  -> Generating DEWT keys...');
    const { b64u, kid } = await genES256JwkB64u();
    if (!hasJwk) {
      modifiedContent = ensureEnvVar(modifiedContent, 'DEWT_JWK', () => b64u);
    }
    if (!hasKid) {
      modifiedContent = ensureEnvVar(modifiedContent, 'DEWT_KID', () => kid);
    }
  }

  // Info: (20250911 - Tzuhan) 只在內容有變動時才寫入檔案
  if (modifiedContent !== originalContent) {
    await fs.writeFile(envFile, modifiedContent, 'utf-8');
    console.log('.env file has been updated successfully.');
  } else {
    console.log('.env file is already up to date. No changes were made.');
  }
}

// Info: (20250911 - Tzuhan)  執行主函式
initializeEnv().catch((error) => {
  console.error('An error occurred during .env initialization:', error);
  process.exit(1);
});

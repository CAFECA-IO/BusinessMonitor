import fs from 'fs';
import crypto from 'crypto';
import path from 'path';

const envFile = path.resolve(process.cwd(), '.env');
const sampleFile = path.resolve(process.cwd(), '.env.example');
// Info: (20250904 - Luphia) 檢查是否有 .env 檔案，若無則複製 .env.sample
if (!fs.existsSync(envFile) && fs.existsSync(sampleFile)) {
  fs.copyFileSync(sampleFile, envFile);
}

// Info: (20250904 - Luphia) 讀取現有內容
let envContent = fs.readFileSync(envFile, 'utf-8');

// Info: (20250904 - Luphia) 確保有 UUID，否則生成一個並放在檔案開頭
if (!/^UUID=.*$/m.test(envContent)) {
  // Info: (20250904 - Luphia) randomUUID 需使用 Node.js 14.17.0 以上版本
  const uuid = crypto.randomUUID();
  envContent = `UUID=${uuid}\n` + envContent;
}

// Info: (20250909 - Tzuhan) 確保 RPID / ORIGIN
if (!/^RPID=.*$/m.test(envContent)) envContent += `\nRPID=localhost\n`;
if (!/^ORIGIN=.*$/m.test(envContent)) envContent += `ORIGIN=http://localhost:3000\n`;

function getEnvLine(content: string, key: string): string | undefined {
  const m = content.match(new RegExp(`^${key}=(.*)$`, 'm'));
  return m ? m[1]?.trim() : undefined;
}

function setEnvLine(content: string, key: string, value: string): string {
  const re = new RegExp(`^${key}=.*$`, 'm');
  if (re.test(content)) return content.replace(re, `${key}=${value}`);
  if (!content.endsWith('\n')) content += '\n';
  return content + `${key}=${value}\n`;
}

function isB64UrlJwk(b64u: string): boolean {
  try {
    if (!/^[A-Za-z0-9\-_]+$/.test(b64u)) return false;
    const b64 = b64u.replace(/-/g, '+').replace(/_/g, '/');
    const pad = '='.repeat((4 - (b64.length % 4)) % 4);
    const json = Buffer.from(b64 + pad, 'base64').toString('utf8');
    const jwk = JSON.parse(json);
    return jwk?.kty === 'EC' && jwk?.crv === 'P-256' && typeof jwk?.d === 'string';
  } catch {
    return false;
  }
}

// Info: (20250909 - Tzuhan) 修改：生成 ES256 並確保 extractable
async function genES256JwkBase64url(): Promise<{ b64: string; kid: string }> {
  try {
    const { generateKeyPair, exportJWK } = await import('jose');
    // Info: (20250909 - Tzuhan) 關鍵：extractable: true
    const { privateKey, publicKey } = await generateKeyPair('ES256', { extractable: true });
    const priv = await exportJWK(privateKey);
    const pub = await exportJWK(publicKey);
    const kidSrc = `${String(pub.x)}.${String(pub.y)}`;
    const kid = 'bm-' + crypto.createHash('sha256').update(kidSrc).digest('base64url').slice(0, 16);
    const b64 = Buffer.from(JSON.stringify(priv), 'utf8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    return { b64, kid };
  } catch (e) {
    // Info: (20250909 - Tzuhan) Fallback：走 Node 原生 crypto 產 KeyObject 再 exportJWK
    const { generateKeyPairSync } = await import('node:crypto');
    const { exportJWK } = await import('jose');
    const pair = generateKeyPairSync('ec', { namedCurve: 'P-256' });
    const priv = await exportJWK(pair.privateKey as unknown as CryptoKey);
    const pub = await exportJWK(pair.publicKey as unknown as CryptoKey);
    const kidSrc = `${String(pub.x)}.${String(pub.y)}`;
    const kid = 'bm-' + crypto.createHash('sha256').update(kidSrc).digest('base64url').slice(0, 16);
    const b64 = Buffer.from(JSON.stringify(priv), 'utf8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    return { b64, kid };
  }
}

// Info: (20250909 - Tzuhan) 修改：把「空值或非法值」視為缺值，會自動覆寫
const curJwk = getEnvLine(envContent, 'SESSION_JWK');
const curKid = getEnvLine(envContent, 'SESSION_KID');

const needNewJwk = !curJwk || curJwk.length === 0 || !isB64UrlJwk(curJwk);
const needNewKid = !curKid || curKid.length === 0;

if (needNewJwk || needNewKid) {
  const { b64, kid } = await genES256JwkBase64url();
  envContent = setEnvLine(envContent, 'SESSION_JWK', b64);
  envContent = setEnvLine(envContent, 'SESSION_KID', needNewKid ? kid : curKid!);
}

if (!/^SESSION_JWK=.*$/m.test(envContent) || !/^SESSION_KID=.*$/m.test(envContent)) {
  const { b64, kid } = await genES256JwkBase64url(); // Info: (20250909 - Tzuhan) << 這裡是「頂層 await」
  if (!/^SESSION_JWK=.*$/m.test(envContent)) envContent += `SESSION_JWK=${b64}\n`;
  if (!/^SESSION_KID=.*$/m.test(envContent)) envContent += `SESSION_KID=${kid}\n`;
}

// Info: (20250909 - Tzuhan) 最後一次性同步寫回檔案（保證完整）
fs.writeFileSync(envFile, envContent, { encoding: 'utf8' });

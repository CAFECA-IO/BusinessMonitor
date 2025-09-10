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
    throw new Error('Fallback path: please reuse previous jose-based exportJWK code');
  }
}

let env = fs.existsSync(envFile) ? fs.readFileSync(envFile, 'utf8') : '';

if (!/^DEWT_JWK=.*$/m.test(env) || !/^DEWT_KID=.*$/m.test(env)) {
  const { b64u, kid } = await genES256JwkB64u();
  if (!/^DEWT_JWK=.*$/m.test(env)) env += `\nDEWT_JWK=${b64u}\n`;
  if (!/^DEWT_KID=.*$/m.test(env)) env += `DEWT_KID=${kid}\n`;
  fs.writeFileSync(envFile, env, 'utf8');
}

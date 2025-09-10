import crypto from 'crypto';
import { getRecoveryPublicKey } from '@/lib/sign';

const PRIVATE_V4 = [
  /^10\./,
  /^127\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^0\./,
  /^169\.254\./,
];

const isPublicIPv4 = (ip: string): boolean => PRIVATE_V4.every((r) => !r.test(ip));

export const getPeerPublicKey = async (
  ip: string,
  port: number = 80
): Promise<string | undefined> => {
  try {
    if (!isPublicIPv4(ip)) return undefined;

    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 3000);
    // Info: (20250904 - Luphia) 建立隨機訊息
    const message = crypto.randomBytes(32).toString('hex');
    // Info: (20250904 - Luphia) 建立對方的 URL
    const url = `http://${ip}:${port}/api/v1/public/sign/${message}`;
    // Info: (20250904 - Luphia) 向對方請求簽名
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(t);
    // ToDo: (20250904 - Luphia) 建立請求簽名失敗錯誤代碼
    if (!response.ok) throw new Error(`Failed to fetch signature from ${url}`);
    // Info: (20250904 - Luphia) 取得對方的公鑰與簽名
    const data: { publicKey?: string; signature?: string } = await response.json();
    if (!data?.publicKey || !data?.signature)
      throw new Error(`Failed to fetch signature from ${url}`);
    // Info: (20250904 - Luphia) 驗證簽名是否正確
    const recovered = getRecoveryPublicKey(message, data.signature);
    // ToDo: (20250904 - Luphia) 建立驗證簽名失敗錯誤代碼
    if (recovered.toLowerCase() !== data.publicKey.toLowerCase())
      throw new Error(`Failed to verify signature from ${url}`);

    return recovered;
  } catch {
    // Info: (20250904 - Luphia) 取得失敗，回傳 undefined
    return undefined;
  }
};

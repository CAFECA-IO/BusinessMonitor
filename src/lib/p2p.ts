import crypto from 'crypto';
import { getRecoveryPublicKey } from '@/lib/sign';

export const getPeerPublicKey = async (
  ip: string,
  port: number = 80
): Promise<string | undefined> => {
  try {
    // Info: (20250904 - Luphia) 建立隨機訊息
    const message = crypto.randomBytes(32).toString('hex');
    // Info: (20250904 - Luphia) 建立對方的 URL
    const url = `http://${ip}:${port}/api/v1/public/sign/${message}`;
    // Info: (20250904 - Luphia) 向對方請求簽名
    const response = await fetch(url);
    // ToDo: (20250904 - Luphia) 建立請求簽名失敗錯誤代碼
    if (!response.ok) throw new Error(`Failed to fetch signature from ${url}`);
    const data = await response.json();
    // Info: (20250904 - Luphia) 取得對方的公鑰與簽名
    const { publicKey, signature } = data;
    // ToDo: (20250904 - Luphia) 建立請求簽名失敗錯誤代碼
    if (!publicKey || !signature) throw new Error(`Failed to fetch signature from ${url}`);
    // Info: (20250904 - Luphia) 驗證簽名是否正確
    const recoveredKey = getRecoveryPublicKey(message, signature);
    // ToDo: (20250904 - Luphia) 建立驗證簽名失敗錯誤代碼
    if (recoveredKey !== publicKey) throw new Error(`Failed to verify signature from ${url}`);
    return publicKey;
  } catch (err) {
    // Info: (20250904 - Luphia) 取得失敗，回傳 undefined
    return undefined;
  }
};

import { Wallet } from 'ethers';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const TAG_LENGTH = 16;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;

export const generateEthereumKeyPair = () => {
  const wallet = Wallet.createRandom();
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
  };
};

export const encryptPrivateKey = (privateKey: string): string => {
  const iv = randomBytes(IV_LENGTH);
  const salt = randomBytes(SALT_LENGTH);
  // Info: (20250917 - Tzuhan) 使用 scrypt 是一個比直接用 key 更安全的做法
  const key = scryptSync(ENCRYPTION_KEY, salt, 32);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(privateKey, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Info: (20250917 - Tzuhan) 將 salt, iv, tag 和加密數據拼接在一起
  return Buffer.concat([salt, iv, tag, encrypted]).toString('hex');
};

/**
 * Info: (20250917 - Tzuhan)解密儲存在資料庫中的以太坊私鑰。
 * @param encryptedData - 從資料庫讀取的、經過加密和 hex 編碼的私鑰字串。
 * @returns - 返回明文的以太坊私鑰。
 */
export const decryptPrivateKey = (encryptedData: string): string => {
  const data = Buffer.from(encryptedData, 'hex');

  // Info: (20250917 - Tzuhan) 將所有 .slice() 替換為 .subarray()
  // .subarray() 是目前推薦的、用於創建 Buffer 視圖的方法。
  const salt = data.subarray(0, SALT_LENGTH);
  const iv = data.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const tag = data.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  const encrypted = data.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

  const key = scryptSync(ENCRYPTION_KEY, salt, 32);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
};

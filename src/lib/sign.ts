import secp256k1 from 'secp256k1';
import crypto from 'crypto';

const getPrivateKey = (): Buffer => {
  // Info: (20250904 - Luphia) 從 UUID 產生私鑰 (32 bytes)
  const uuid = process.env.UUID;
  if (!uuid) throw new Error('UUID is not set in environment variables.');
  // Info: (20250904 - Luphia) 移除 UUID 的 '-' 並轉為 Buffer
  const uuidBuffer = Buffer.from(uuid.replace(/-/g, ''), 'hex');
  // Info: (20250904 - Luphia) 使用 SHA-256 雜湊來產生 32 bytes 的私鑰
  return crypto.createHash('sha256').update(uuidBuffer).digest();
};

export const getRecoveryPublicKey = (message: string, signature: string): string => {
  const msgHash = crypto.createHash('sha256').update(message).digest();
  const sigBuffer = Buffer.from(signature, 'hex');
  // Info: (20250904 - Luphia) r + s 64 bytes
  const sig = sigBuffer.subarray(0, 64);
  // Info: (20250904 - Luphia) recovery id 1 byte
  const recid = sigBuffer[64];
  // Info: (20250904 - Luphia) 回復為壓縮公鑰
  const publicKey = Buffer.from(secp256k1.ecdsaRecover(sig, recid, msgHash)).toString('hex');
  return publicKey;
};

export const getHandshakeSignature = async (
  message: string
): Promise<{ message: string; publicKey: string; signature: string }> => {
  const msgHash = crypto.createHash('sha256').update(message).digest();
  const privateKey = getPrivateKey();
  // Info: (20250904 - Luphia) 使用壓縮公鑰
  const publicKey = Buffer.from(secp256k1.publicKeyCreate(privateKey)).toString('hex');
  // Info: (20250904 - Luphia) 簽名得到 signature + recovery id
  const result = secp256k1.ecdsaSign(msgHash, privateKey);

  // Info: (20250904 - Luphia) r + s 是 64 bytes，把 recovery id 加在最後 1 byte → 65 bytes
  const signature = Buffer.concat([
    Buffer.from(result.signature),
    Buffer.from([result.recid]),
  ]).toString('hex');

  return { message, publicKey, signature };
};

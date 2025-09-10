import secp256k1 from 'secp256k1';
import crypto from 'crypto';

const sha256 = (data: Buffer): Buffer => crypto.createHash('sha256').update(data).digest();

const isHex = (s: string): boolean => /^[0-9a-fA-F]+$/.test(s) && s.length % 2 === 0;

const toBytesForHash = (message: string): Buffer => {
  // Info: (20250909 - Tzuhan) 允許十六進位（當作 raw bytes）或一般 UTF-8 字串
  return isHex(message) ? Buffer.from(message, 'hex') : Buffer.from(message, 'utf8');
};

const domainSep = Buffer.from('CAF-P2P-v1\0', 'utf8');

const getPrivateKey = (): Buffer => {
  // Info: (20250904 - Luphia) 從 UUID 產生私鑰 (32 bytes)
  const uuid = process.env.UUID;
  if (!uuid) throw new Error('UUID is not set in environment variables.');
  const seed = Buffer.from(uuid.replace(/-/g, ''), 'hex'); // Info: (20250909 - Tzuhan) 16 bytes
  // Info: (20250909 - Tzuhan) 加入 domain separation，避免裸雜湊語意不清
  let pk = sha256(Buffer.concat([domainSep, seed]));
  // Info: (20250909 - Tzuhan) 檢查合法性（極少數情況需要重試）
  if (!secp256k1.privateKeyVerify(pk)) {
    pk = sha256(Buffer.concat([pk, Buffer.from('!')]));
    if (!secp256k1.privateKeyVerify(pk)) {
      throw new Error('Derived private key invalid.');
    }
  }
  return pk;
};

export const getRecoveryPublicKey = (message: string, signatureHex: string): string => {
  const sigBuf = Buffer.from(signatureHex.replace(/^0x/, ''), 'hex');
  if (sigBuf.length !== 65) throw new Error('Invalid signature length (expect 65 bytes).');
  const sig = sigBuf.subarray(0, 64);
  const recid = sigBuf[64];
  if (recid < 0 || recid > 3) throw new Error('Invalid recovery id.');

  const msgHash = sha256(toBytesForHash(message));
  // Info: (20250909 - Tzuhan) 明確指定壓縮格式 true（33 bytes）
  const pubkey = Buffer.from(secp256k1.ecdsaRecover(sig, recid, msgHash, true)).toString('hex');
  return pubkey;
};

export const getHandshakeSignature = (
  message: string
): { message: string; publicKey: string; signature: string } => {
  const msgHash = sha256(toBytesForHash(message));
  const privateKey = getPrivateKey();
  // Info: (20250904 - Luphia) 使用壓縮公鑰
  const publicKey = Buffer.from(secp256k1.publicKeyCreate(privateKey, true)).toString('hex');
  const { signature, recid } = secp256k1.ecdsaSign(msgHash, privateKey);
  const sig65 = Buffer.concat([Buffer.from(signature), Buffer.from([recid])]).toString('hex');
  return { message, publicKey, signature: sig65 };
};

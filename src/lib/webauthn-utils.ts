import { encodeAbiParameters, parseAbiParameters } from 'viem';

/**
 * Info: (20251120 - Tzuhan)
 * 將 DER 格式的 ECDSA 簽名解析為 r 和 s (BigInt)
 * WebAuthn 返回的簽名是 ASN.1 DER 編碼，我們需要將其拆解
 */
export function parseDerSignature(signature: Uint8Array): { r: bigint; s: bigint } {
  let offset = 0;
  // Info: (20251120 - Tzuhan) 1. SEQUENCE (0x30)
  if (signature[offset++] !== 0x30) throw new Error('Invalid DER: missing SEQUENCE');
  let len = signature[offset++];
  if (len & 0x80) {
    // Info: (20251120 - Tzuhan) 處理長度大於 127 的情況 (很少見，但為了完整性)
    const n = len & 0x7f;
    len = 0;
    for (let i = 0; i < n; i++) len = (len << 8) | signature[offset++];
  }

  // Info: (20251120 - Tzuhan) 2. INTEGER r (0x02)
  if (signature[offset++] !== 0x02) throw new Error('Invalid DER: missing INTEGER r');
  const rLen = signature[offset++];
  const rBytes = signature.slice(offset, offset + rLen);
  offset += rLen;
  const r = BigInt('0x' + Buffer.from(rBytes).toString('hex'));

  // Info: (20251120 - Tzuhan) 3. INTEGER s (0x02)
  if (signature[offset++] !== 0x02) throw new Error('Invalid DER: missing INTEGER s');
  const sLen = signature[offset++];
  const sBytes = signature.slice(offset, offset + sLen);
  const s = BigInt('0x' + Buffer.from(sBytes).toString('hex'));

  return { r, s };
}

/**
 * Info: (20251120 - Tzuhan)
 * 在 clientDataJSON 中尋找特定 key 的值的起始位置
 * 用於合約中驗證 challenge 和 type
 */
function findindexOf(jsonString: string, key: string): number {
  const searchKey = `"${key}":"`;
  const idx = jsonString.indexOf(searchKey);
  if (idx === -1) throw new Error(`Key ${key} not found in clientDataJSON`);
  return idx + searchKey.length;
}

/**
 * Info: (20251120 - Tzuhan) 將 WebAuthn 的回應打包成 SCW 合約需要的 WebAuthnSignature 結構
 */
export function packWebAuthnSignature(
  authenticatorData: Uint8Array,
  clientDataJSON: string,
  signature: Uint8Array
): string {
  // Info: (20251120 - Tzuhan) 1. 解析 r, s
  const { r, s } = parseDerSignature(signature);

  // Info: (20251120 - Tzuhan) 2. 找出 challenge 和 type 在 JSON 中的位置
  // Info: (20251120 - Tzuhan) clientDataJSON 範例: {"type":"webauthn.get","challenge":"Base64...","origin":"..."}
  const challengeLocation = findindexOf(clientDataJSON, 'challenge');
  const responseTypeLocation = findindexOf(clientDataJSON, 'type');

  // Info: (20251120 - Tzuhan) 3. 使用 viem 的 encodeAbiParameters 打包成 bytes
  // Info: (20251120 - Tzuhan) 對應合約中的 struct WebAuthnSignature
  const encoded = encodeAbiParameters(
    parseAbiParameters(
      '(bytes authenticatorData, bytes clientDataJSON, uint256 challengeLocation, uint256 responseTypeLocation, uint256 r, uint256 s)'
    ),
    [
      {
        authenticatorData: `0x${Buffer.from(authenticatorData).toString('hex')}`,
        clientDataJSON: `0x${Buffer.from(clientDataJSON).toString('hex')}`,
        challengeLocation: BigInt(challengeLocation),
        responseTypeLocation: BigInt(responseTypeLocation),
        r,
        s,
      },
    ]
  );

  return encoded;
}

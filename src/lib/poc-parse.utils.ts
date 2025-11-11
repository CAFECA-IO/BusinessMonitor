import { decode } from 'cbor-js';

// Info: (20251111 - Tzuhan) 建立一個介面，符合您專案的 IPascalCase 規範
export interface ICoordinates {
  x: string;
  y: string;
}

// Info: (20251111 - Tzuhan) 將 Base64URL 字串轉換為 ArrayBuffer
function base64UrlToArrayBuffer(base64Url: string): ArrayBuffer {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Info: (20251111 - Tzuhan) 將 ArrayBuffer 轉換為 Base64URL 字串
function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Info: (20251111 - Tzuhan) PoC 1.2 的核心：解析 Attestation Object 並提取 x, y 座標
 * @param attestationObjectBase64 - 來自 RegistrationJSON.response.attestationObject 的 base64url 字串
 * @returns {ICoordinates | null}
 */
export function parsePublicKeyCoordinates(attestationObjectBase64: string): ICoordinates | null {
  try {
    // Info: (20251111 - Tzuhan) 1. 使用 cbor-js 解析 attestationObject
    const attestationObject = base64UrlToArrayBuffer(attestationObjectBase64);
    const attestation = decode(attestationObject) as {
      authData: ArrayBuffer;
      fmt: string;
      attStmt: unknown;
    };

    // Info: (20251111 - Tzuhan) 2. 提取 authData (這又是一個二進位緩衝區)
    const authData = attestation.authData;

    // Info: (20251111 - Tzuhan) 3. 手動解析 authData 緩衝區 (WebAuthn Spec)
    // Info: (20251111 - Tzuhan) 32 bytes: rpIdHash
    // Info: (20251111 - Tzuhan) 1 byte: flags
    // Info: (20251111 - Tzuhan) 4 bytes: signCount
    // Info: (20251111 - Tzuhan) ... 接下來是 Attested Credential Data (如果 flags bit 6 (AT) 為 1)
    const dataView = new DataView(authData);
    const flags = dataView.getUint8(32);
    const attestedCredentialDataPresent = (flags & (1 << 6)) !== 0;

    if (!attestedCredentialDataPresent) {
      console.error('No Attested Credential Data found in authData.');
      return null;
    }

    // Info: (20251111 - Tzuhan) 37 bytes = 32 (rpIdHash) + 1 (flags) + 4 (signCount)
    let offset = 37;

    // Info: (20251111 - Tzuhan) 16 bytes: aaguid (跳過)
    offset += 16;

    // Info: (20251111 - Tzuhan) 2 bytes: credentialIdLength (讀取長度)
    const credentialIdLength = dataView.getUint16(offset);
    offset += 2;

    // Info: (20251111 - Tzuhan) credentialId (跳過)
    offset += credentialIdLength;

    // Info: (20251111 - Tzuhan) credentialPublicKey (COSE 格式)
    // Info: (20251111 - Tzuhan) 獲取剩餘的緩衝區
    const cosePublicKeyBuffer = authData.slice(offset);

    // Info: (20251111 - Tzuhan) 使用 cbor-js 再次解析 COSE 公鑰
    const cosePublicKey = decode(cosePublicKeyBuffer) as Map<number, unknown>;

    console.log('Decoded COSE Public Key:', cosePublicKey);

    // Info: (20251111 - Tzuhan) 5. 根據 COSE 標準 (RFC 8152) 提取 x, y 座標
    // Info: (20251111 - Tzuhan) kty (1) 必須是 2 (EC2)
    // Info: (20251111 - Tzuhan) alg (3) 必須是 -7 (ES256)
    // Info: (20251111 - Tzuhan) crv (-1) 必須是 1 (P-256)
    // Info: (20251111 - Tzuhan) x (-2) 是 x 座標
    // Info: (20251111 - Tzuhan) y (-3) 是 y 座標

    // Info: (20251111 - Tzuhan) 檢查 alg 和 crv 是否符合 P-256 (ES256)
    //  Info: (20251111 - Tzuhan) fido2-server.ts 已經請求了 alg: -7 (ES256)
    const alg = cosePublicKey.get(3);
    const crv = cosePublicKey.get(-1);

    if (alg !== -7 || crv !== 1) {
      console.error(`COSE key is not P-256/ES256 (alg: ${alg}, crv: ${crv}).`);
      return null;
    }

    const x = cosePublicKey.get(-2) as ArrayBuffer; // x-coordinate
    const y = cosePublicKey.get(-3) as ArrayBuffer; // y-coordinate

    if (!x || !y) {
      console.error('COSE key is missing x(-2) or y(-3) coordinates.');
      return null;
    }

    return {
      x: arrayBufferToBase64Url(x),
      y: arrayBufferToBase64Url(y),
    };
  } catch (error) {
    console.error('Failed to parse attestationObject:', error);
    return null;
  }
}

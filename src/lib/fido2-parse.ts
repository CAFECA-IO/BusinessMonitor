import { decode } from 'cbor-js';

// Info: (20251112 - Tzuhan) 建立介面，符合 IPascalCase 規範
export interface ICoordinates {
  x: string;
  y: string;
}

interface IAttestationObject {
  authData: Uint8Array;
  fmt: string;
  attStmt: unknown;
}
type ICosePublicKey = Record<number, number | ArrayBuffer | Uint8Array>;

function base64UrlToArrayBuffer(base64Url: string): ArrayBuffer {
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padding = base64.length % 4;
  if (padding) {
    if (padding === 2) {
      base64 += '==';
    } else if (padding === 3) {
      base64 += '=';
    }
  }
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Info: (20251112 - Tzuhan)
 * 將 ArrayBuffer 或 Uint8Array 轉換為 Base64URL 字串
 */
export function bufferToBase64Url(buffer: ArrayBuffer | Uint8Array): string {
  // Info: (20251112 - Tzuhan) 如果是 ArrayBuffer，則建立一個檢視整個緩衝區的 Uint8Array。
  // Info: (20251112 - Tzuhan) 如果是 Uint8Array，則 'bytes' 將是該視圖 (尊重 offset 和 length)。
  const bytes = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer;

  let binary = '';
  // Info: (20251112 - Tzuhan) 迭代 Uint8Array 的 .length (視圖的長度)，
  // Info: (20251112 - Tzuhan) 而不是 .buffer.byteLength (底層緩衝區的長度)。
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Info: (20251112 - Tzuhan)
 * [PoC 1.2 核心實作]
 * 解析 Attestation Object 並提取 P-256 x, y 座標。
 * @param attestationObjectBase64 - 來自 RegistrationJSON.response.attestationObject 的 base64url 字串
 * @returns {ICoordinates | null}
 */
export function parsePublicKeyCoordinates(attestationObjectBase64: string): ICoordinates | null {
  try {
    // Info: (20251112 - Tzuhan) 1. ... (解析 attestationObject) ...
    const attestationObject = base64UrlToArrayBuffer(attestationObjectBase64);
    const attestation = decode(attestationObject) as IAttestationObject;

    // Info: (20251112 - Tzuhan) 2. 提取 authData
    const authData = attestation.authData;
    console.log(
      `[DEBUG] authData type: ${authData.constructor.name}, length: ${authData.byteLength}`
    );

    // Info: (20251112 - Tzuhan) 3. 手動解析 authData 緩衝區
    const dataView = new DataView(authData.buffer, authData.byteOffset, authData.byteLength);

    const flags = dataView.getUint8(32);
    console.log(`[DEBUG] Correct Flags byte: ${flags}`);

    const attestedCredentialDataPresent = (flags & (1 << 6)) !== 0;
    console.log(`[DEBUG] Attested Credential Data Present: ${attestedCredentialDataPresent}`);

    if (!attestedCredentialDataPresent) {
      console.error('[DEBUG] No Attested Credential Data found in authData.');
      return null;
    }

    let offset = 37;
    offset += 16;
    const credentialIdLength = dataView.getUint16(offset);
    offset += 2;
    offset += credentialIdLength;

    const cosePublicKeyBuffer = authData.slice(offset);

    const cosePublicKey = decode(cosePublicKeyBuffer.buffer) as ICosePublicKey;
    console.log('[DEBUG] Decoded COSE Public Key Object:', cosePublicKey);

    // Info: (20251112 - Tzuhan) 6. 提取 x, y 座標
    const alg = cosePublicKey[3] as number;
    const crv = cosePublicKey[-1] as number;

    if (alg !== -7 || crv !== 1) {
      console.error(`[DEBUG] COSE key is not P-256/ES26 (alg: ${alg}, crv: ${crv}).`);
      return null;
    }

    const xRaw = cosePublicKey[-2] as ArrayBuffer | Uint8Array;
    const yRaw = cosePublicKey[-3] as ArrayBuffer | Uint8Array;

    if (!xRaw || !yRaw) {
      console.error('[DEBUG] COSE key is missing x(-2) or y(-3) coordinates.');
      return null;
    }

    return {
      x: bufferToBase64Url(xRaw),
      y: bufferToBase64Url(yRaw),
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('[DEBUG] Failed to parse attestationObject:', error.message, error.stack);
    } else {
      console.error('[DEBUG] Failed to parse attestationObject: An unknown error occurred.');
    }
    return null;
  }
}

/**
 * Info: (20251203 - Tzuhan) 解析單獨的 COSE Key (Base64URL 格式)
 * 用於從資料庫取回公鑰後，還原成 BigInt 座標供合約驗證使用
 */
export const parseCoseKey = (coseBase64: string): { x: bigint; y: bigint } | null => {
  try {
    const base64 = coseBase64.replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(base64);
    const buffer = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) buffer[i] = bin.charCodeAt(i);

    if (buffer.length < 64) return null;

    const xBytes = buffer.slice(buffer.length - 64, buffer.length - 32);
    const yBytes = buffer.slice(buffer.length - 32);

    const xHex =
      '0x' +
      Array.from(xBytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    const yHex =
      '0x' +
      Array.from(yBytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

    return { x: BigInt(xHex), y: BigInt(yHex) };
  } catch (e) {
    console.error('COSE Parse error', e);
    return null;
  }
};

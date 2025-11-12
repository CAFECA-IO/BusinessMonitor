/**
 * Info: (20251111 - Tzuhan)
 * 保留內部計算精度，6 位小數對於大多數金融計算來說是安全的。
 */
const PRECISION = 6;

/**
 * Info: (20251111 - Tzuhan)
 * 用於縮放的 BigInt 常數 (10^PRECISION)
 */
const SCALE_FACTOR = BigInt(10) ** BigInt(PRECISION);
const BIGINT_ZERO = BigInt(0);

/**
 * Info: (20251111 - Tzuhan)
 * 檢查輸入是否為 null 或 undefined
 */
export function isNil(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * Info: (20251111 - Tzuhan)
 * 將字串或數字解析為縮放後的 BigInt。
 * 例如：parse("41.25") -> 41_250_000n (假設 PRECISION = 6)
 * @param input 原始值 (string, number, Decimal.js-like object)
 * @returns {bigint | null} 縮放後的 BigInt 或 null
 */
export function parseToBigInt(
  input: string | number | { toString(): string } | null | undefined
): bigint | null {
  if (isNil(input)) return null;

  const s = String(input).trim();
  if (s === '') return null;

  const isNegative = s.startsWith('-');
  const unsignedS = isNegative ? s.slice(1) : s;

  const parts = unsignedS.split('.');
  const intPart = parts[0] || '0';

  // Info: (20251111 - Tzuhan) 取得小數部分，並填充/截斷到我們的 PRECISION
  // Info: (20251111 - Tzuhan) .padEnd(PRECISION, '0') -> 確保 '0.8' 變成 '800000'
  // Info: (20251111 - Tzuhan) .slice(0, PRECISION) -> 確保 '0.123456789' 變成 '123456' (截斷)
  const fracPart = (parts[1] || '0').padEnd(PRECISION, '0').slice(0, PRECISION);

  try {
    const value = BigInt(intPart) * SCALE_FACTOR + BigInt(fracPart);
    return isNegative ? -value : value;
  } catch (error) {
    console.error(`無法將 "${s}" 解析為 BigInt:`, error);
    return null;
  }
}

/**
 * Info: (20251111 - Tzuhan)
 * 將縮放後的 BigInt 格式化回帶有指定小數位數的字串。
 * 包含四捨五入邏輯。
 * @param value 縮放後的 BigInt
 * @param places 輸出時希望保留的小數位數 (預設 2)
 * @returns {string | null} 格式化後的字串或 null
 */
export function formatBigInt(value: bigint | null | undefined, places: number = 2): string | null {
  if (isNil(value)) return null;

  // Info: (20251111 - Tzuhan) 計算需要 "除以" 多少來進行縮放和捨入
  const scaleDownPlaces = PRECISION - places;
  if (scaleDownPlaces < 0) {
    // Info: (20251111 - Tzuhan) 這種情況意味著請求的小數位數比我們的內部精度還高
    // Info: (20251111 - Tzuhan) 為簡化起見，我們只在尾部補 0
    const padding = '0'.repeat(-scaleDownPlaces);
    return formatBigInt(value, PRECISION) + padding;
  }

  const scaleDownFactor = BigInt(10) ** BigInt(scaleDownPlaces);
  const half = scaleDownFactor / BigInt(2);

  // Info: (20251111 - Tzuhan) 應用 "四捨五入"：(value + half) / divisor
  // Info: (20251111 - Tzuhan) 對負數要正確處理
  const rounded = (value + (value < BIGINT_ZERO ? -half : half)) / scaleDownFactor;

  const s = rounded.toString();
  const isNegative = s.startsWith('-');
  const absS = isNegative ? s.slice(1) : s;

  if (places === 0) {
    return s;
  }

  // Info: (20251111 - Tzuhan) 補 0 確保 "0.55" 不會變成 ".55" 或 "55"
  const padded = absS.padStart(places + 1, '0');
  const intPart = padded.slice(0, -places);
  const fracPart = padded.slice(-places);

  return `${isNegative ? '-' : ''}${intPart}.${fracPart}`;
}

/**
 * Info: (20251111 - Tzuhan)
 * 安全地計算兩個值的精確差異 (a - b)。
 * @param a 被減數
 * @param b 減數
 * @returns {bigint | null} 縮放後的 BigInt 差異值，或 null
 */
export function safeSubtract(
  a: string | number | null | undefined,
  b: string | number | null | undefined
): bigint | null {
  const bigA = parseToBigInt(a);
  const bigB = parseToBigInt(b);

  if (isNil(bigA) || isNil(bigB)) {
    return null;
  }

  return bigA - bigB;
}

/**
 * Info: (20251111 - Tzuhan)
 * 安全地計算兩個值之間的精確百分比變化 ((a - b) / b) * 100。
 * @param a 當前值 (e.g., close)
 * @param b 基礎值 (e.g., open)
 * @returns {bigint | null} 縮放後的 BigInt 百分比值，或 null
 */
export function safePercentageChange(
  a: string | number | null | undefined,
  b: string | number | null | undefined
): bigint | null {
  const bigA = parseToBigInt(a);
  const bigB = parseToBigInt(b);

  if (isNil(bigA) || isNil(bigB) || bigB === BigInt(0)) {
    return null;
  }

  // Info: (20251111 - Tzuhan) 計算 (a - b)
  const change = bigA - bigB;

  // Info: (20251111 - Tzuhan) 為了在除法中保持精度，我們先乘以 100 * SCALE_FACTOR
  // (change * 100 * SCALE_FACTOR) / b
  const scaledChange = change * BigInt(100) * SCALE_FACTOR;

  //Info: (20251111 - Tzuhan) BigInt 除法會自動截斷，這在這裡是可接受的
  return scaledChange / bigB;
}

import { NextRequest } from 'next/server';
import { jsonOk, jsonFail } from '@/lib/response';
import { ApiCode } from '@/lib/status';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const xff = req.headers.get('x-forwarded-for') ?? '';
    const ipv4 = xff.split(',')[0]?.trim() || null;
    const ipv6 = req.headers.get('x-forwarded-ipv6') ?? null;
    // Info: (20250909 - Tzuhan) 僅回傳觀測資訊，不做對外 fetch（避免 SSRF）
    return jsonOk({ ipv4, ipv6 });
  } catch (err) {
    console.error(err);
    return jsonFail(ApiCode.SERVER_ERROR, 'Internal Server Error');
  }
}

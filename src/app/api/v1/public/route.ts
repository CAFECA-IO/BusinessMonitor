import { NextRequest } from 'next/server';
import { jsonOk, jsonFail } from '@/lib/response';
import { ApiCode } from '@/lib/status';
import { getPeerPublicKey } from '@/lib/p2p';

export async function GET(req: NextRequest) {
  try {
    // Info: (20250904 - Luphia) 解讀對方 IPv4 與 IPv6
    const ipv4 = req.headers.get('x-forwarded-for');
    const ipv6 = req.headers.get('x-forwarded-ipv6');
    // Info: (20250904 - Luphia) 根據 IP 取得對方公鑰
    const publicKey = typeof ipv4 === 'string' ? await getPeerPublicKey(ipv4) : undefined;
    const result = { ipv4, ipv6, publicKey };
    return jsonOk(result);
  } catch (err) {
    console.error(err);
    return jsonFail(ApiCode.SERVER_ERROR, 'Internal Server Error');
  }
}

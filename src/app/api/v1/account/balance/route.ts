import { NextRequest } from 'next/server';
import { formatEther } from 'viem';
import { z } from 'zod';
import { jsonOk, jsonFail } from '@/lib/response';
import { ApiCode } from '@/lib/status';
import { loggerFromRequest } from '@/lib/logger';
import { publicClient } from '@/lib/viem';

// Info: (20251216 - Tzuhan) 使用 Zod 驗證地址格式
const querySchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid address format'),
});

export async function GET(req: NextRequest) {
  const log = loggerFromRequest(req);
  const { searchParams } = new URL(req.url);

  // Info: (20251216 - Tzuhan) 1. 驗證參數
  const parseResult = querySchema.safeParse({
    address: searchParams.get('address'),
  });

  if (!parseResult.success) {
    return jsonFail(ApiCode.VALIDATION_ERROR, parseResult.error.issues[0].message);
  }

  const { address } = parseResult.data;

  try {
    // Info: (20251216 - Tzuhan) 2. 使用共用 Client 查詢
    const balanceWei = await publicClient.getBalance({
      address: address as `0x${string}`,
    });

    log.info(`[Balance API] Fetched balance for ${address}: ${balanceWei}`);

    return jsonOk({
      symbol: 'iSunCoin',
      balance: formatEther(balanceWei),
      wei: balanceWei, // Info: (20251216 - Tzuhan) jsonOk 會自動轉 String 處理 BigInt
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log.error(`[Balance API] Error: ${msg}`);
    return jsonFail(ApiCode.SERVER_ERROR, 'Failed to fetch balance');
  }
}

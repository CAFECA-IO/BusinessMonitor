import { NextRequest } from 'next/server';
import { parseEther, encodeFunctionData } from 'viem';
import { z } from 'zod';
import { jsonOk, jsonFail } from '@/lib/response';
import { ApiCode } from '@/lib/status';
import { loggerFromRequest } from '@/lib/logger';
import { publicClient } from '@/lib/viem';
import { CONTRACT_ADDRESSES, ABIS } from '@/config/contracts';

// Info: (20251216 - Tzuhan) 定義請求體驗證 Schema
const transferBodySchema = z.object({
  sender: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid sender address'),
  to: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid to address'),
  amount: z.string().regex(/^\d+(\.\d+)?$/, 'Amount must be a valid number string'),
});

export async function POST(req: NextRequest) {
  const log = loggerFromRequest(req);

  try {
    const body = await req.json();

    // 1. 驗證請求參數
    const parseResult = transferBodySchema.safeParse(body);
    if (!parseResult.success) {
      return jsonFail(ApiCode.VALIDATION_ERROR, parseResult.error.issues[0].message);
    }

    const { sender, to, amount } = parseResult.data;

    if (!CONTRACT_ADDRESSES.ENTRY_POINT) {
      throw new Error('EntryPoint address not configured');
    }

    // 2. 取得 Nonce (使用共用 Client 與 ABI)
    const nonce = await publicClient.readContract({
      address: CONTRACT_ADDRESSES.ENTRY_POINT,
      abi: ABIS.ENTRY_POINT,
      functionName: 'getNonce',
      args: [sender as `0x${string}`, BigInt(0)],
    });

    // 3. 編碼 CallData (呼叫 SCW 的 execute)
    const amountWei = parseEther(amount);
    const callData = encodeFunctionData({
      abi: ABIS.SCW,
      functionName: 'execute',
      args: [to as `0x${string}`, amountWei, '0x'],
    });

    log.info(`[Transfer Build] Built UserOp for ${sender}, Nonce: ${nonce}`);

    // 4. 回傳 UserOp 物件
    return jsonOk({
      userOp: {
        sender,
        nonce,
        initCode: '0x',
        callData,
        callGasLimit: BigInt(200_000),
        verificationGasLimit: BigInt(500_000),
        preVerificationGas: BigInt(100_000),
        // Info: Relayer 全額買單模式，Gas 費率設為 0
        maxFeePerGas: BigInt(0),
        maxPriorityFeePerGas: BigInt(0),
        paymasterAndData: '0x',
        signature: '0x',
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    log.error(`[Transfer Build] Error: ${msg}`);
    return jsonFail(ApiCode.SERVER_ERROR, msg);
  }
}

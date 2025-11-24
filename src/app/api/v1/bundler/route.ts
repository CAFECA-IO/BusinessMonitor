import { NextRequest } from 'next/server';
import { jsonOk, jsonFail } from '@/lib/response';
import { ApiCode } from '@/lib/status';
import { loggerFromRequest } from '@/lib/logger';
import { createWalletClient, http, createPublicClient, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { z } from 'zod';
import { userOperationSchema } from '@/validators';

// Info: (20251118 - Tzuhan) 加上 error FailedOp 定義以便解碼錯誤
const entryPointAbi = parseAbi([
  'struct UserOperation { address sender; uint256 nonce; bytes initCode; bytes callData; uint256 callGasLimit; uint256 verificationGasLimit; uint256 preVerificationGas; uint256 maxFeePerGas; uint256 maxPriorityFeePerGas; bytes paymasterAndData; bytes signature; }',
  'function handleOps(UserOperation[] calldata ops, address payable beneficiary)',
  'function getSenderAddress(bytes calldata initCode) external view returns (address)',
  'error FailedOp(uint256 opIndex, string reason)',
]);

const RELAYER_PRIVATE_KEY = process.env.ISUNCOIN_PRIVATE_KEY as `0x${string}` | undefined;
const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;

export async function POST(req: NextRequest) {
  const log = loggerFromRequest(req);
  log.info('[PoC 2.3] Minimal Bundler: Received eth_sendUserOperation');

  try {
    if (!RELAYER_PRIVATE_KEY || !rpcUrl) throw new Error('Configuration error');
    // Info: (20251118 - Tzuhan) 1. 設定 Viem 客戶端連接至 isuncoin_mainnet
    const publicClient = createPublicClient({ transport: http(rpcUrl) });
    const relayerAccount = privateKeyToAccount(RELAYER_PRIVATE_KEY);
    const relayerClient = createWalletClient({
      account: relayerAccount,
      transport: http(rpcUrl),
    });

    log.info(`[PoC 2.3] Relayer (Bundler) Address: ${relayerAccount.address}`);

    // Info: (20251118 - Tzuhan) 2. 解析來自前端的請求
    // Info: (20251118 - Tzuhan) 一個標準的 eth_sendUserOperation 請求包含 [UserOperation, EntryPointAddress]
    const { userOp: userOpJson, entryPointAddress } = (await req.json()) as {
      userOp: unknown;
      entryPointAddress: string;
    };
    const userOp = userOperationSchema.parse(userOpJson);

    // Info: (20251121 - Tzuhan) [資金流向] Relayer 發送交易
    // 這裡就是「平台墊付」發生的時刻。
    // Relayer 使用自己的私鑰 (RELAYER_PRIVATE_KEY) 發送以太坊交易，
    // 因此區塊鏈收取的 Gas 費是從 Relayer 的餘額中扣除的。
    //
    // ★★★ 關於 Relayer 全額買單 ★★★
    // 如果前端傳來的 UserOp 中 maxFeePerGas 是 0：
    // 1. EntryPoint 不會扣 SCW 的錢 (prefund = 0)。
    // 2. 但 Relayer 發送這筆交易時，仍需支付一般的 Transaction Fee (除非我們是礦工)。
    // 3. 結果：Relayer 支出 Gas，收入 0 (沒有來自 EntryPoint 的退款)。平台成功吸收了成本。

    const ops = [
      {
        sender: userOp.sender as `0x${string}`,
        nonce: userOp.nonce,
        initCode: userOp.initCode as `0x${string}`,
        callData: userOp.callData as `0x${string}`,
        callGasLimit: userOp.callGasLimit,
        verificationGasLimit: userOp.verificationGasLimit,
        preVerificationGas: userOp.preVerificationGas,
        maxFeePerGas: userOp.maxFeePerGas,
        maxPriorityFeePerGas: userOp.maxPriorityFeePerGas,
        paymasterAndData: userOp.paymasterAndData as `0x${string}`,
        signature: userOp.signature as `0x${string}`,
      },
    ];

    // Info: (20251118 - Tzuhan) "beneficiary" 是代付 Gas 並收取費用的地址
    // Info: (20251118 - Tzuhan) 在我們的最小 Bundler 中，就是我們自己 (Relayer)
    const beneficiary = relayerAccount.address as `0x${string}`; // 指定退款接收地址 (如果有的話)

    log.info('[PoC 2.3] Calling EntryPoint.handleOps...');

    // Info: (20251118 - Tzuhan) 3. 模擬並發送交易到 EntryPoint.handleOps
    const { request } = await publicClient.simulateContract({
      account: relayerAccount,
      address: entryPointAddress as `0x${string}`,
      abi: entryPointAbi,
      functionName: 'handleOps',
      args: [ops, beneficiary],
      chain: publicClient.chain,
    });

    // Info: (20251118 - Tzuhan) 發送交易
    const txHash = await relayerClient.writeContract(request);
    log.info(`[PoC 2.3] Relayer 已提交交易: ${txHash}`);

    // Info: (20251118 - Tzuhan) 4. 等待交易被打包並回傳結果
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    return jsonOk({
      message: 'UserOperation processed',
      transactionHash: receipt.transactionHash,
      status: receipt.status,
    });
  } catch (err) {
    const isZodError = err instanceof z.ZodError;
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';

    // Info: (20251118 - Tzuhan) 檢查是否為我們的環境變數設定錯誤
    const isConfigError = errorMessage.includes('Server configuration error');

    log.warn(
      `[PoC 2.3/2.5] Bundler: Failed. ${isZodError ? 'Validation Error' : isConfigError ? 'Config Error' : 'Simulation/Execution Error'}: ${errorMessage}`,
      isZodError ? { errors: (err as z.ZodError).format() } : {}
    );

    // Info: (20251118 - Tzuhan) 區分伺服器設定錯誤 (500) 和 Zod 驗證錯誤 (400)
    if (isConfigError) {
      return jsonFail(ApiCode.SERVER_ERROR, errorMessage);
    }
    if (isZodError) {
      return jsonFail(ApiCode.VALIDATION_ERROR, 'Invalid UserOperation structure');
    }

    // Info: (20251118 - Tzuhan) 交易失敗 (例如 Revert)，回傳 200 OK，但在 payload 中告知
    return jsonOk({
      error: 'Transaction failed or reverted (this may be expected if validateUserOp failed)',
      details: errorMessage,
    });
  }
}

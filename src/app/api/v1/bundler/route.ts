import { NextRequest } from 'next/server';
import { jsonOk, jsonFail } from '@/lib/response';
import { ApiCode } from '@/lib/status';
import { loggerFromRequest } from '@/lib/logger';
import { createWalletClient, http, createPublicClient, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { z } from 'zod';
import { userOperationSchema } from '@/validators';

// Info: (20251118 - Tzuhan) 從 @account-abstraction/contracts 取得 EntryPoint 的 ABI
const entryPointAbi = parseAbi([
  'struct UserOperation { address sender; uint256 nonce; bytes initCode; bytes callData; uint256 callGasLimit; uint256 verificationGasLimit; uint256 preVerificationGas; uint256 maxFeePerGas; uint256 maxPriorityFeePerGas; bytes paymasterAndData; bytes signature; }',
  'function handleOps(UserOperation[] calldata ops, address payable beneficiary)',
  'function getSenderAddress(bytes calldata initCode) external view returns (address)',
]);

// Info: (20251118 - Tzuhan) 從 .env 讀取 isuncoin 主網的 Relayer (Bundler) 私鑰
const RELAYER_PRIVATE_KEY = process.env.ISUNCOIN_PRIVATE_KEY as `0x${string}` | undefined;

// Info: (20251118 - Tzuhan) 從 .env 讀取 isuncoin 主網的 RPC URL
const rpcUrl = process.env.ISUNCOIN_MAINNET_RPC_URL;

/**
 * Info: (20251118 - Tzuhan)
 * 最小可行 Bundler (Relayer) 實作。
 * 模擬 `eth_sendUserOperation` RPC 方法。
 */
export async function POST(req: NextRequest) {
  const log = loggerFromRequest(req);
  log.info('[PoC 2.3] Minimal Bundler (isuncoin_mainnet): Received eth_sendUserOperation');

  try {
    // Info: (20251118 - Tzuhan) 關鍵的環境變數檢查
    if (!RELAYER_PRIVATE_KEY) {
      throw new Error('Server configuration error: ISUNCOIN_PRIVATE_KEY is not set in .env');
    }
    if (!rpcUrl) {
      throw new Error('Server configuration error: ISUNCOIN_MAINNET_RPC_URL is not set in .env');
    }

    // Info: (20251118 - Tzuhan) 1. 設定 Viem 客戶端連接至 isuncoin_mainnet
    const publicClient = createPublicClient({
      transport: http(rpcUrl),
    });

    const relayerAccount = privateKeyToAccount(RELAYER_PRIVATE_KEY);
    const relayerClient = createWalletClient({
      account: relayerAccount,
      transport: http(rpcUrl),
    });

    log.info(`[PoC 2.3] Relayer (Bundler) Address: ${relayerAccount.address}`);

    // Info: (20251118 - Tzuhan) 2. 解析來自前端的請求
    // Info: (20251118 - Tzuhan) 一個標準的 eth_sendUserOperation 請求包含 [UserOperation, EntryPointAddress]
    const { userOp: userOpJson, entryPointAddress } = (await req.json()) as {
      userOp: unknown; // 接收 unknown，交給 Zod 驗證
      entryPointAddress: string;
    };

    const userOp = userOperationSchema.parse(userOpJson);

    if (!entryPointAddress) {
      throw new z.ZodError([
        { code: 'custom', path: ['entryPointAddress'], message: 'entryPointAddress is required' },
      ]);
    }

    log.info(`[PoC 2.3] Received valid UserOp for sender: ${userOp.sender}`);
    log.info(`[PoC 2.3] Targeting EntryPoint: ${entryPointAddress}`);

    // Info: (20251118 - Tzuhan) 3. 呼叫 EntryPoint.handleOps
    // Info: (20251118 - Tzuhan) `handleOps` 接收一個 UserOperation 陣列
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
    const beneficiary = relayerAccount.address;

    log.info('[PoC 2.3] Calling EntryPoint.handleOps...');

    // Info: (20251118 - Tzuhan) publicClient.chain 會由 viem 從 RPC 自動獲取
    // Info: (20251118 - Tzuhan) 我們將其明確傳遞給 simulateContract 以確保一致性
    const { request } = await publicClient.simulateContract({
      account: relayerAccount,
      address: entryPointAddress as `0x${string}`,
      abi: entryPointAbi,
      functionName: 'handleOps',
      args: [ops, beneficiary],
      chain: publicClient.chain,
    });

    const txHash = await relayerClient.writeContract(request);

    log.info(`[PoC 2.3] Relayer (isuncoin_mainnet) 已提交交易 (Transaction hash): ${txHash}`);

    // Info: (20251118 - Tzuhan) 4. 等待交易被打包
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    log.info(`[PoC 2.3] 交易已打包! 狀態: ${receipt.status}`);

    // Info: (20251118 - Tzuhan) 5. 回傳 Tx Hash
    return jsonOk({
      message: 'UserOperation processed by minimal bundler on isuncoin_mainnet',
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

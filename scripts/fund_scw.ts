import 'dotenv/config';
import { createWalletClient, http, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
// Info: (20251118 - Tzuhan) 目標 SCW 地址 (可替換為任何有效地址)
const targetScwAddress = process.env.NEXT_PUBLIC_SCW_ADDRESS as `0x${string}`;
const privateKey = process.env.ISUNCOIN_PRIVATE_KEY as `0x${string}`;

async function main() {
  if (!privateKey || !rpcUrl || !targetScwAddress) {
    console.error('❌ 錯誤: 請檢查 .env 中的 NEXT_PUBLIC_RPC_URL 和 NEXT_PUBLIC_SCW_ADDRESS');
    process.exit(1);
  }

  const account = privateKeyToAccount(privateKey);
  const client = createWalletClient({
    account,
    transport: http(rpcUrl),
  });

  console.log(`正在從 Relayer (${account.address}) 轉帳 1 ETH 到 SCW (${targetScwAddress})...`);

  try {
    const hash = await client.sendTransaction({
      to: targetScwAddress,
      value: parseEther('1'),
      chain: {
        id: 8017,
        name: 'isuncoin_mainnet',
        nativeCurrency: {
          name: 'iSunCoin',
          symbol: 'ISC',
          decimals: 18,
        },
        rpcUrls: {
          default: {
            http: [rpcUrl],
          },
        },
      },
    });

    console.log(`✅ 轉帳成功！交易 Hash: ${hash}`);
    console.log('⏳ 請等待幾秒鐘讓區塊確認，然後再試一次前端的 Test Bundler 按鈕。');
  } catch (error) {
    console.error('❌ 轉帳失敗:', error);
  }
}

main();

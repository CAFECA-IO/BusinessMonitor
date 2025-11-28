'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { TbFaceId } from 'react-icons/tb';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fido2ClientService } from '@/lib/fido2-client';
import { routes } from '@/config/api_routes';
import { BM_URL } from '@/constants/url';
import { useAuth } from '@/contexts/auth_context';
import Button from '@/components/common/button';
import MessageModal from '@/components/auth/message_modal';

// Info: (20251128 - Tzuhan) 引入新依賴
import { createPublicClient, http, type Address } from 'viem';
import { getInitCode } from '@/lib/aa-utils';

const origin = process.env.NEXT_PUBLIC_ORIGIN;
if (!origin) {
  throw new Error('NEXT_PUBLIC_ORIGIN is not set in the environment variables.');
}

// Info: (20251128 - Tzuhan) 環境變數
const FACTORY_ADDRESS = (process.env.NEXT_PUBLIC_SCW_FACTORY_ADDRESS || '') as Address;
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://mainnet.isuncoin.com';

export default function LoginClient() {
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('點擊按鈕以 Passkey 登入或註冊。');
  // Info: (20251016 - Julian) During development
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<string | null>(null);
  const [isFidoAvailable, setIsFidoAvailable] = useState(true);
  const [isMessageModalVisible, setIsMessageModalVisible] = useState(false);

  const toggleMessageModal = () => setIsMessageModalVisible((prev) => !prev);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: isAuthLoading, login } = useAuth();

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }
    if (user) {
      router.push(BM_URL.PROFILE);
    }
  }, [user, isAuthLoading, router]);

  useEffect(() => {
    if (!fido2ClientService.isAvailable()) {
      setIsFidoAvailable(false);
      setStatusMessage('此環境不支援 Passkey 功能。');
      setError('請使用支援的瀏覽器並確保在安全的 HTTPS 環境下操作。');
      setIsMessageModalVisible(true);
    }
  }, []);

  const handleLogin = useCallback(async () => {
    if (!isFidoAvailable) return;

    setIsLoading(true);
    setError(null);
    setStatusMessage('正在準備 Passkey 登入...');

    const redirectTo = searchParams.get('redirectTo') || '';

    try {
      // Info: (20251128 - Tzuhan) 步驟 1: 獲取登入選項
      const optionsRes = await fetch(`${origin}${routes.auth.webauthn.options()}`);
      if (!optionsRes.ok) throw new Error('無法從伺服器獲取登入選項。');
      const optionsResponse = await optionsRes.json();
      if (!optionsResponse.success) {
        throw new Error(optionsResponse.message || '無法從伺服器獲取註冊選項。');
      }
      const options = optionsResponse.payload;

      // Info: (20251128 - Tzuhan) 步驟 2: Passkey 驗證
      setStatusMessage('請依照瀏覽器提示進行驗證...');
      const authentication = await fido2ClientService.startLogin(options);

      // Info: (20251128 - Tzuhan) 步驟 3: 後端驗證
      setStatusMessage('正在驗證您的 Passkey...');
      const verifyRes = await fetch(`${origin}${routes.auth.webauthn.verify()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authentication),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.message || '登入驗證失敗。');
      }

      const token = verifyData.payload.dewt;
      setStatusMessage('✅ 驗證成功！正在檢查帳戶狀態...');

      // -----------------------------------------------------------------------
      // Info: (20251128 - Tzuhan) 新增邏輯：Lazy Deployment (自動補部署 SCW)
      // -----------------------------------------------------------------------
      try {
        // Info: (20251128 - Tzuhan) 1. 用 Token 換取用戶詳細資料 (含 SCW 地址 & InitKey)
        const meRes = await fetch(`${origin}${routes.auth.me()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const meData = await meRes.json();
        const userData = meData.payload;

        if (userData && userData.blockchainAddress && FACTORY_ADDRESS) {
          const scwAddress = userData.blockchainAddress as Address;
          const client = createPublicClient({ transport: http(RPC_URL) });

          // Info: (20251128 - Tzuhan) 2. 檢查鏈上是否已部署
          const code = await client.getBytecode({ address: scwAddress });

          // Info: (20251128 - Tzuhan) 如果未部署 (code 為 undefined 或 0x)，則觸發部署交易
          if (!code || code === '0x') {
            console.log('[Login] SCW not deployed, initiating Lazy Deployment...');
            setStatusMessage('正在初始化您的區塊鏈帳戶 (首次登入)...');

            // Info: (20251128 - Tzuhan) 準備 initCode
            const initKey = userData.initPublicKey; // { x: "...", y: "..." }
            if (initKey && initKey.x && initKey.y) {
              const initCode = getInitCode(
                FACTORY_ADDRESS,
                BigInt(initKey.x),
                BigInt(initKey.y),
                BigInt(userData.deploymentSalt || 0)
              );

              /**
               * 這裡有一個 UX 挑戰：發送 UserOp 需要用戶「再次簽名」。
               * 為了不打斷登入流程，通常這裡會做成「背景靜默處理」或「跳轉後提示」。
               * 為了不打斷登入流程，通常這裡會做成「背景靜默處理」或「跳轉後提示」。
               * 但如果我們想要「登入即部署」，我們需要再喚起一次 Passkey 簽署一個 UserOp。
               *
               * [策略] 為了保持登入流暢，我們先不在此處強制部署。
               * 因為 Lazy Deployment 的精隨在於「發送第一筆交易時順便部署」。
               * 所以我們只要確保前端知道這還是個 Fresh Account 即可。
               */

              console.log('[Login] Account is fresh. Will deploy on first transaction.', initCode);
            }
          }
        }
      } catch (deployCheckErr) {
        console.warn('[Login] Failed to check SCW status:', deployCheckErr);
        //  Info: (20251128 - Tzuhan) 不阻擋登入
      }

      await login(token);

      if (redirectTo) {
        const currentRedirectTo = `${BM_URL.APPROVE_DEVICE}?${decodeURIComponent(redirectTo)}`;
        setTimeout(() => router.push(currentRedirectTo), 500);
      } else {
        setTimeout(() => router.push('/profile'), 1500);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '發生未知錯誤。';
      setStatusMessage(
        (err as Error).name === 'NotAllowedError' ? '您取消了登入操作。' : '登入失敗，請重試。'
      );
      setError(errorMessage);
      setIsMessageModalVisible(true);
    } finally {
      setIsLoading(false);
    }
  }, [router, isFidoAvailable, login, searchParams]);

  if (isAuthLoading || user) {
    return (
      <div className="flex w-full grow flex-col items-center justify-center p-4">
        <p>正在驗證您的身份...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-24px">
      <Link href={BM_URL.HOME} className="shrink-0">
        <Image src="/logos/cafeca_logo.svg" alt="cafeca_logo" width={120} height={36} />
      </Link>

      <div className="mt-60px flex flex-1 flex-col items-center justify-end">
        <Image
          src="/elements/graphic.png"
          width={344}
          height={257}
          alt="graphic"
          className="shrink-0"
        />

        <div className="mt-40px flex flex-col gap-16px">
          <Button
            type="button"
            onClick={handleLogin}
            disabled={isLoading || !isFidoAvailable}
            size="extraLarge"
            className="gap-8px"
          >
            <TbFaceId size={18} />
            <p>{isLoading ? '處理中...' : 'Log in to my ID'}</p>
          </Button>
          <Button type="button" variant="secondary" size="extraLarge">
            <Link href={BM_URL.LOGIN_WITH_EXISTING_DEVICE}>Log in on a New Device</Link>
          </Button>
        </div>

        <div className="mt-40px">
          <Link href={BM_URL.SIGN_UP}>
            <Button type="button" variant="primaryBorderless" size="extraSmall">
              I don’t have my Digital ID yet.{' '}
            </Button>
          </Link>
        </div>
      </div>

      {isMessageModalVisible && (
        <MessageModal
          content={statusMessage ?? '--'}
          visibleHandler={toggleMessageModal}
          submitString="Try Again"
          submitHandler={handleLogin}
        />
      )}
    </div>
  );
}

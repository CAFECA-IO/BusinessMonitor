import Layout from '@/components/common/layout';
import LoginWithDeviceClient from '@/components/auth/login_with_device_client';
import { Suspense } from 'react';

/**
 * Info: (20251009 - Tzuhan)
 * 未登入的使用者，希望透過已登入的裝置掃碼來登入此裝置。
 *
 * 職責：
 * 1. 渲染整體的頁面佈局 (Layout)。
 * 2. 載入並顯示 `LoginWithDeviceClient`，由其處理 QR Code 產生與即時監聽的邏輯。
 */
export default function LoginWithExistingDevicePage() {
  return (
    <Layout>
      <Suspense fallback={<div className="flex grow items-center justify-center">Loading...</div>}>
        <LoginWithDeviceClient />
      </Suspense>
    </Layout>
  );
}

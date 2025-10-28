import Layout from '@/components/common/layout';
import ApproveDeviceClient from '@/components/auth/approve_device_client';
import { Suspense } from 'react';

/**
 * Info: (20251009 - Tzuhan)
 * 舊裝置掃碼後，用來批准新裝置的頁面。
 *
 * 職責：
 * 1. 渲染整體的頁面佈局 (Layout)。
 * 2. 載入並顯示 `ApproveDeviceClient`，由其處理完整的 FIDO2 驗證與批准流程。
 */
export default function ApproveDevicePage() {
  return (
    <Layout isLoginPage pageBgColor="bg-surface-background">
      <Suspense
        fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}
      >
        <ApproveDeviceClient />
      </Suspense>
    </Layout>
  );
}

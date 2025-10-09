import Layout from '@/components/common/layout';
import SetupNewDeviceClient from '@/components/auth/setup_new_device_client';
import { Suspense } from 'react';

/**
 * Info: (20251009 - Tzuhan)
 * 新裝置掃描 QR Code 後，用來設定此裝置 Passkey 的頁面。
 *
 * 職責：
 * 1. 渲染佈局。
 * 2. 載入 `SetupNewDeviceClient`，由其處理等待批准、建立 Passkey 的完整流程。
 */
export default function SetupNewDevicePage() {
  return (
    <Layout>
      <Suspense fallback={<div className="flex grow items-center justify-center">載入中...</div>}>
        <SetupNewDeviceClient />
      </Suspense>
    </Layout>
  );
}

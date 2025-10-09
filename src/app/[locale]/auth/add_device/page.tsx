import Layout from '@/components/common/layout';
import AddDeviceClient from '@/components/auth/add_device_client';
import { Suspense } from 'react';

/**
 * Info: (20251009 - Tzuhan)
 * 新增裝置的進入頁面。
 *
 * 職責：
 * 1. 渲染整體的頁面佈局 (Layout)。
 * 2. 載入並顯示 `AddDeviceClient`，由其處理 QR Code 的產生與 Pusher 事件監聽。
 */
export default function AddDevicePage() {
  return (
    <Layout>
      <Suspense
        fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}
      >
        <AddDeviceClient />
      </Suspense>
    </Layout>
  );
}

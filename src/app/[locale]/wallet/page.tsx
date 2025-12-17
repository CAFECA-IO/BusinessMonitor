import Layout from '@/components/common/layout';
import WalletClient from '@/components/wallet/wallet_client';
import { Suspense } from 'react';

export default function WalletPage() {
  return (
    <Layout isLoginPage={false}>
      <Suspense
        fallback={
          <div className="flex h-screen w-full items-center justify-center">Loading Wallet...</div>
        }
      >
        <WalletClient />
      </Suspense>
    </Layout>
  );
}

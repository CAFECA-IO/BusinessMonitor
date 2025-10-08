import LoginClient from '@/components/auth/login_client';
import Layout from '@/components/common/layout';

import { Suspense } from 'react';

export default function LoginPage() {
  return (
    <Layout>
      <Suspense fallback={<div className="w-full max-w-md animate-pulse">正在載入登入模組...</div>}>
        <LoginClient />
      </Suspense>
    </Layout>
  );
}

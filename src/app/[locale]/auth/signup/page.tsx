import SignupClient from '@/components/auth/signup_client';
import Layout from '@/components/common/layout';

import { Suspense } from 'react';

export default function SignupPage() {
  return (
    <Layout>
      <Suspense fallback={<div className="w-full max-w-md animate-pulse">正在載入註冊模組...</div>}>
        <SignupClient />
      </Suspense>
    </Layout>
  );
}

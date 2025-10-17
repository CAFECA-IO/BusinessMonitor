import Layout from '@/components/common/layout';
import { Suspense } from 'react';
import LoginSuccessClient from '@/components/auth/login_success_client';

export default function LoginSuccessPage() {
  return (
    <Layout isLoginPage pageBgColor="bg-surface-background">
      <Suspense fallback={<div className="w-full text-center">Loading...</div>}>
        <LoginSuccessClient />
      </Suspense>
    </Layout>
  );
}

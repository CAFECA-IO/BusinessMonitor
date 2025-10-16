import Layout from '@/components/common/layout';
import LoginClient from '@/components/auth/login_client';
import { Suspense } from 'react';

export default function LoginPage() {
  return (
    <Layout isLoginPage pageBgColor="bg-surface-background">
      <Suspense fallback={<div className="w-full text-center">Loading...</div>}>
        <LoginClient />
      </Suspense>
    </Layout>
  );
}

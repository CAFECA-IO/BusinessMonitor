import Layout from '@/components/common/layout';
import SignupClient from '@/components/auth/signup_client';
import { Suspense } from 'react';

export default function SignupPage() {
  return (
    <Layout isLoginPage pageBgColor="bg-surface-background">
      <Suspense fallback={<div className="w-full text-center">Loading...</div>}>
        <SignupClient />
      </Suspense>
    </Layout>
  );
}

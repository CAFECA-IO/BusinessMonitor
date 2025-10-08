import Layout from '@/components/common/layout';
import SignupClient from '@/components/auth/signup_client';
import { Suspense } from 'react';

export default function SignupPage() {
  return (
    <Layout>
      <Suspense fallback={<div className="w-full text-center">Loading...</div>}>
        <SignupClient />
      </Suspense>
    </Layout>
  );
}

import Layout from '@/components/common/layout';
import ProfileClient from '@/components/auth/profile_client';
import { Suspense } from 'react';

export default function ProfilePage() {
  return (
    <Layout isLoginPage>
      <Suspense fallback={<div className="w-full text-center">Loading...</div>}>
        <ProfileClient />
      </Suspense>
    </Layout>
  );
}

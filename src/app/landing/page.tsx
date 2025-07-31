import Navbar from '@/components/common/navbar';
import Cta from '@/components/landing_page/cta';

export default function LandingPage() {
  return (
    <main className="flex h-screen flex-col items-center">
      <Navbar />

      <Cta />
    </main>
  );
}

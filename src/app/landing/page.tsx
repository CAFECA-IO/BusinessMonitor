import Head from 'next/head';
import Navbar from '@/components/common/navbar';
import Cta from '@/components/landing_page/cta';
import IntroCard from '@/components/landing_page/intro_card';
import ReadyToCafeca from '@/components/landing_page/ready_to_cafeca';
import Footer from '@/components/common/footer';

export default function LandingPage() {
  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon/favicon.ico" />
        <title>CAFECA - Own Your Identity</title>
      </Head>

      <main className="flex min-h-screen flex-col items-center">
        <Navbar />

        <Cta />

        {/* ToDo: (20250801 - Julian) 這裡有個波浪狀的遮擋 */}

        <div className="flex flex-col items-center">
          <IntroCard
            imgSrc="/elements/identity.png"
            title="Verify your **identity** without relying on third parties."
            description="Decentralized Verification: No intermediaries needed. Identity authorization is achieved through blockchain smart contract interactions."
          />
          <IntroCard
            imgSrc="/elements/phone.png"
            title="**Prove** who you are without revealing who you are."
            description="Zero-Knowledge Proof: Uses mobile biometric authentication and the FIDO2 protocol to verify identity without revealing personal information."
          />
          <IntroCard
            imgSrc="/elements/service.png"
            title="Easily connect your identity across **apps** and **services**."
            description="Multi-Platform Integration: Supports OAuth2 protocol, allowing easy integration across various services and applications."
          />
          <IntroCard
            imgSrc="/elements/global.png"
            title="Create once. Use **anywhere**. Stay in control."
            description="Portable Identity: Create your identity once and use it across multiple platforms. All authentication data is stored on the user's mobile device, free from platform lock-in."
          />
          <IntroCard
            imgSrc="/elements/private.png"
            title="Your data stays yours—**private**, **encrypted**, and **protected**."
            description="Privacy Protection: Personal data is encrypted and stored securely, inaccessible to unauthorized parties and protected from misuse."
          />
        </div>

        <ReadyToCafeca />

        <Footer />
      </main>
    </>
  );
}

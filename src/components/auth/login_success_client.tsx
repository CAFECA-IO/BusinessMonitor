'use client';

import Button from '@/components/common/button';
import { useLottie } from 'lottie-react';
import successAnimation from '@/lottie/scanning.json';

const origin = process.env.NEXT_PUBLIC_ORIGIN;
if (!origin) {
  throw new Error('NEXT_PUBLIC_ORIGIN is not set in the environment variables.');
}

export default function LoginSuccessClient() {
  const options = {
    animationData: successAnimation,
    loop: true,
  };

  const { View } = useLottie(options);

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-24px">
      <h1 className="text-h3 font-bold text-text-secondary">Congratulation</h1>
      <div className="mt-24px flex flex-col items-center gap-20px">
        {/* Info: (20241017 - Julian) Replace with Lottie */}
        <div className="relative size-220px">{View}</div>
        <p className="text-base font-medium text-text-secondary">
          You have your own Digital ID now.
        </p>
      </div>
      <div className="mt-100px w-full">
        <Button type="button" className="w-full">
          Go to My ID
        </Button>
      </div>
    </div>
  );
}

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Button from '@/components/common/button';

const ReadyToCafeca: React.FC = () => {
  return (
    <div className="mx-64px my-100px flex items-center bg-ready bg-contain bg-center bg-no-repeat px-72px">
      <Image src="/elements/phone_2.png" width={450} height={600} alt="phone" />
      <div className="flex flex-col gap-40px">
        <h2 className="text-h2 font-bold text-text-invert">
          Ready to be <span className="text-text-primary">you</span>, everywhere, without sharing
          everything? <br />
          <span className="text-text-primary">Let’s go.</span>
        </h2>

        <Link href="/">
          <Button type="button" variant="secondary" className="w-fit shadow-drop-L">
            Go to CAFECA
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default ReadyToCafeca;

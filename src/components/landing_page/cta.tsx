import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaChevronRight } from 'react-icons/fa6';
import Button from '@/components/common/button';

const Cta: React.FC = () => {
  return (
    <div className="mx-24px my-40px flex items-center gap-20px bg-cta bg-contain bg-center bg-no-repeat desktop:mx-64px desktop:my-100px desktop:px-72px">
      <div className="relative h-200px w-100px shrink-0 desktop:h-600px desktop:w-450px">
        <Image src="/elements/phone_2.png" fill objectFit="contain" alt="phone" />
      </div>
      <div className="flex flex-col gap-16px desktop:gap-40px">
        <h2 className="text-base font-bold text-text-invert desktop:text-h2">
          Ready to be <span className="text-text-primary">you</span>, everywhere, without sharing
          everything? <br />
          <span className="text-text-primary">Let’s go.</span>
        </h2>

        <Link href="/">
          <Button type="button" variant="secondary" className="w-fit gap-8px shadow-drop-L">
            Go to CAFECA <FaChevronRight size={20} />
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Cta;

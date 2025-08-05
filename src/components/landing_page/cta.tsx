import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaChevronRight } from 'react-icons/fa6';
import Button from '@/components/common/button';

const Cta: React.FC = () => {
  return (
    <div className="mx-64px my-100px flex items-center bg-cta bg-contain bg-center bg-no-repeat px-72px">
      <Image src="/elements/phone_2.png" width={450} height={600} alt="phone" />
      <div className="flex flex-col gap-40px">
        <h2 className="text-h2 font-bold text-text-invert">
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

import React from 'react';
// import Image from 'next/image';

const Cta: React.FC = () => {
  return (
    <div className="cta-bg relative h-screen w-full">
      {/* Info: (20250730 - Julian) Main Title */}
      <div className="mx-auto flex w-1/2 flex-col text-9xl font-bold">
        <h2 className="text-grey-grey-600 text-left">Redefine</h2>
        <h2 className="text-brand-brand-blud-500 text-center">your</h2>
        <h2 className="text-grey-grey-600 text-right">identity</h2>
      </div>

      <div className="absolute right-40 bottom-20 flex w-[500px] flex-col items-start gap-[40px]">
        <p className="text-lg font-bold">
          CAFECA is a decentralized identity platform using blockchain and zero-knowledge proofs to
          enable secure, private, and portable self-sovereign identity (SSI).
        </p>
        {/* ToDo: (20250731 - Julian) Style */}
        <button type="button" className="bg-button-button-primary rounded-full px-[54px] py-[18px]">
          Go to CAFECA
        </button>
      </div>

      {/* Info: (20250730 - Julian) Image */}
      {/* ToDo: (20250731 - Luphia) use variables instead of hard-coded values */}
      {/* <div className="absolute left-[100px] bottom-0">
        <Image
          src="/elements/hand_holding_phone.png"
          width={574}
          height={733}
          alt="hand_holding_phone"
        />
      </div> */}
    </div>
  );
};

export default Cta;

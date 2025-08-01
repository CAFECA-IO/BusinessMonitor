import React from "react";
import Image from "next/image";

const Cta: React.FC = () => {
  return (
    <div className="h-screen bg-gray-200 relative">
      {/* Info: (20250730 - Julian) Background Image */}
      {/* <div className="absolute w-full z-0">
            <Image src="/elements/cta_bg.png" fill objectFit="contain" alt="cta_bg" />
        </div> */}

      <div className="z-10">
        {/* Info: (20250730 - Julian) Main Title */}
        <div className="flex justify-center text-[120px] items-center h-full">
          <h2 className="">Redefine</h2>
          <h2>your</h2>
          <h2>identity</h2>
        </div>

        {/* Info: (20250730 - Julian) Image */}
        {/* ToDo: (20250731 - Luphia) use variables instead of hard-coded values */}
        <Image
          src="/elements/hand_holding_phone.png"
          width={574}
          height={733}
          alt="hand_holding_phone"
        />
      </div>
    </div>
  );
};

export default Cta;

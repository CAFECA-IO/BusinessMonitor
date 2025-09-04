'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import { PiPaperPlaneTiltBold } from 'react-icons/pi';

const DiscussionPoster: React.FC = () => {
  const { t } = useTranslation(['business_detail']);

  const [inputValue, setInputValue] = useState<string>('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  return (
    <div className="flex items-center gap-24px rounded-radius-l bg-surface-primary px-40px py-24px">
      {/* Info: (20250903 - Julian) Avatar */}
      <div className="h-80px w-80px shrink-0 overflow-hidden rounded-full">
        <Image src={'/fake_avatar/business_img_3.jpg'} width={80} height={80} alt="user_avatar" />
      </div>
      {/* Info: (20250903 - Julian) Input Box */}
      <div className="flex flex-1 items-center rounded-radius-s border border-border-secondary p-spacing-2xs">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={t('business_detail:POSTING_INPUT_PLACEHOLDER')}
          className="flex-1 text-base font-normal text-text-primary placeholder:text-text-note"
        />
        <button type="button" className="text-text-note hover:text-button-accent-hover">
          <PiPaperPlaneTiltBold size={20} />
        </button>
      </div>
    </div>
  );
};

export default DiscussionPoster;

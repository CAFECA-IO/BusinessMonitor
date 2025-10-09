'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import { PiPaperPlaneTiltBold } from 'react-icons/pi';

const DiscussionPoster: React.FC = () => {
  const { t } = useTranslation(['business_detail']);

  // ToDo: (20251007 - Julian) Replace with real user avatar
  const userAvatar = '/fake_avatar/business_img_3.jpg';

  const [inputValue, setInputValue] = useState<string>('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  return (
    <div className="flex items-center gap-24px rounded-radius-l bg-surface-primary p-20px desktop:px-40px desktop:py-24px">
      {/* Info: (20250903 - Julian) Avatar */}
      <div className="relative size-40px shrink-0 overflow-hidden rounded-full desktop:size-80px">
        <Image src={userAvatar} fill objectFit="cover" alt="user_avatar" />
      </div>
      {/* Info: (20250903 - Julian) Input Box */}
      <div className="flex flex-1 items-center rounded-radius-s border border-border-secondary p-8px desktop:p-spacing-2xs">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={t('business_detail:POSTING_INPUT_PLACEHOLDER')}
          className="flex-1 text-sm font-normal text-text-primary outline-none placeholder:text-text-note desktop:text-base"
        />
        <button type="button" className="text-text-note hover:text-button-accent-hover">
          <PiPaperPlaneTiltBold size={20} />
        </button>
      </div>
    </div>
  );
};

export default DiscussionPoster;

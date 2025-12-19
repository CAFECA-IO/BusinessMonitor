'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import { PiPaperPlaneTiltBold } from 'react-icons/pi';
import { useAuth } from '@/contexts/auth_context';
import { DEFAULT_USER_AVATAR } from '@/constants/display';

const DiscussionPoster: React.FC = () => {
  const { t } = useTranslation(['business_detail']);

  const { user } = useAuth();
  const userAvatar = user?.photo ?? DEFAULT_USER_AVATAR;

  const [inputValue, setInputValue] = useState<string>('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // Info: (20251029 - Julian) 登入狀態下才顯示
  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center gap-24px rounded-radius-l bg-surface-primary p-20px desktop:px-40px desktop:py-24px">
      {/* Info: (20250903 - Julian) Avatar */}
      <div className="relative size-40px shrink-0 overflow-hidden rounded-full desktop:size-80px">
        <Image src={userAvatar} fill objectFit="cover" alt="user_avatar" unoptimized />
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

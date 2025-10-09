'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { FaChevronRight } from 'react-icons/fa6';
import Button from '@/components/common/button';

const MessageBubble: React.FC<{ avatarScr: string; text: string; isLeft?: boolean }> = ({
  avatarScr,
  text,
  isLeft = false,
}) => {
  const bubbleOnLeft = isLeft ? (
    <div className="rounded-radius-s bg-surface-brand p-12px text-lg font-medium text-text-invert">
      {text}
    </div>
  ) : null;

  const bubbleOnRight = isLeft ? null : (
    <div className="rounded-radius-s bg-surface-primary p-12px text-lg font-medium text-text-primary">
      {text}
    </div>
  );

  return (
    <div className="flex items-center gap-8px">
      {bubbleOnLeft}
      <Image src={avatarScr} width={100} height={100} alt="fake_avatar" />
      {bubbleOnRight}
    </div>
  );
};

const Kv: React.FC = () => {
  const { t } = useTranslation(['landing_page']);

  return (
    <div
      className="relative block w-full"
      // Info: (20250805 - Julian) 波浪狀背景
      style={{
        maskImage: 'url(/elements/kv_mask.png)',
        maskPosition: 'bottom 30px right 0',
        maskSize: 'cover',
        maskRepeat: 'no-repeat',
      }}
    >
      {/* Info: (20250805 - Julian) Background Image */}
      <div className="z-0">
        <Image src="/elements/kv_bg.png" width={1920} height={1080} alt="kv_bg" />
      </div>

      <div className="absolute top-0 z-10 h-200px w-full desktop:h-800px">
        {/* Info: (20250730 - Julian) Desktop Main Title */}
        <div className="mx-auto mt-8 hidden w-2/3 flex-col text-9xl font-bold desktop:flex">
          <h2 className="text-left text-grey-600">{t('landing_page:KV_1')}</h2>
          <h2 className="text-center text-brand-blud-500">{t('landing_page:KV_2')}</h2>
          <h2 className="text-right text-grey-600">{t('landing_page:KV_3')}</h2>
        </div>

        {/* Info: (20250730 - Julian) Mobile Main Title */}
        <div className="mt-8 block whitespace-nowrap text-center text-xl font-bold desktop:hidden">
          <h2 className="text-grey-600">
            {t('landing_page:KV_1')}{' '}
            <span className="text-brand-blud-500">{t('landing_page:KV_2')}</span>{' '}
            {t('landing_page:KV_3')}
          </h2>
        </div>

        {/* Info: (20250730 - Julian) Subtitle */}
        <div className="absolute bottom-6 flex flex-col items-center gap-16px px-20px desktop:bottom-20 desktop:right-40 desktop:w-500px desktop:items-start desktop:gap-40px">
          <p className="text-xs font-bold text-text-secondary desktop:text-lg">
            {t('landing_page:CTA_DESCRIPTION')}
          </p>
          <Link href="/">
            <Button type="button" variant="primary" className="gap-8px">
              {t('landing_page:CTA_BTN')} <FaChevronRight size={20} />
            </Button>
          </Link>
        </div>

        {/* Info: (20250730 - Julian) Holding a phone Image */}
        <div className="absolute -bottom-8 left-20 hidden desktop:block">
          <Image
            src="/elements/hand_holding_phone.png"
            width={500}
            height={700}
            alt="hand_holding_phone"
          />
        </div>

        {/* Info: (20250801 - Julian) Message Bubbles */}
        <div className="absolute right-12px top-64px hidden desktop:block">
          <MessageBubble
            avatarScr="/fake_avatar/avatar_1.png"
            text={t('landing_page:COMMENT_1')}
            isLeft
          />
        </div>
        <div className="absolute left-12px top-120px hidden desktop:block">
          <MessageBubble avatarScr="/fake_avatar/avatar_2.png" text={t('landing_page:COMMENT_2')} />
        </div>
      </div>
    </div>
  );
};

export default Kv;

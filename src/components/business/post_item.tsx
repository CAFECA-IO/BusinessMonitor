'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useTranslation, Trans } from 'react-i18next';
import { AiOutlineMessage } from 'react-icons/ai';
import { FiShare2, FiMoreVertical, FiEyeOff } from 'react-icons/fi';
import { TbThumbUp, TbThumbDown, TbMessageReport } from 'react-icons/tb';
import { LuTrash2 } from 'react-icons/lu';
import useOuterClick from '@/lib/hooks/use_outer_click';
import { timestampToString, formatNumberWithCommas } from '@/lib/common';
import { IPost } from '@/interfaces/post';

const PostItem: React.FC<IPost> = ({
  author,
  content,
  createdAt,
  countOfLikes,
  countOfDislikes,
  countOfComments,
}) => {
  const { t } = useTranslation(['business_detail']);

  const formattedCreatedTime = timestampToString(createdAt);

  const {
    targetRef: moreRef,
    componentVisible: isMoreOpen,
    setComponentVisible: setIsMoreOpen,
  } = useOuterClick<HTMLDivElement>(false);

  // Info: (20250903 - Julian) True = liked, False = disliked, Null = no action
  const [isLiked, setIsLiked] = useState<boolean | null>(null);

  // ToDo: (20250904 - Julian) 判斷是否有檢舉權限
  const isReportAvailable = true;
  // ToDo: (20250903 - Julian) 判斷是否有刪除權限
  const isDeleteAvailable = true;

  // Info: (20250903 - Julian) 判斷按鈕是否點亮
  const isLikeActive = isLiked === true;
  const isDislikeActive = isLiked === false;

  const toggleMore = () => setIsMoreOpen((prev) => !prev);

  // ToDo: (20250903 - Julian) Send like/dislike action to backend via API
  const handleLike = () => {
    if (isLikeActive) {
      setIsLiked(null);
    } else {
      setIsLiked(true);
    }
  };

  const handleDislike = () => {
    if (isDislikeActive) {
      setIsLiked(null);
    } else {
      setIsLiked(false);
    }
  };

  const moreDropdown = (
    <div
      className={`${
        isMoreOpen ? 'visible opacity-100' : 'invisible opacity-0'
      } absolute right-0 top-54px flex w-220px flex-col rounded-radius-s bg-white p-spacing-3xs shadow-drop-L transition-all duration-150 ease-in-out`}
    >
      {isReportAvailable && (
        <button
          type="button"
          className="flex items-center gap-8px p-spacing-2xs text-text-primary hover:text-text-brand"
        >
          <TbMessageReport size={20} />
          <p>{t('business_detail:DISCUSSION_ACTION_REPORT')}</p>
        </button>
      )}
      <button
        type="button"
        className="flex items-center gap-8px p-spacing-2xs text-text-primary hover:text-text-brand"
      >
        <FiEyeOff size={20} />
        <p>{t('business_detail:DISCUSSION_ACTION_HIDE')}</p>
      </button>
      {isDeleteAvailable && (
        <button
          type="button"
          className="flex items-center gap-8px p-spacing-2xs text-text-primary hover:text-text-brand"
        >
          <LuTrash2 size={20} />
          <p>{t('business_detail:DISCUSSION_ACTION_DELETE')}</p>
        </button>
      )}
    </div>
  );

  return (
    <div className="flex w-full flex-col gap-32px rounded-radius-l bg-surface-primary px-36px py-24px">
      {/* Info: (20250903 - Julian) Author */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-16px">
          <div className="h-80px w-80px overflow-hidden rounded-full">
            <Image src={author.avatarUrl} width={80} height={80} alt="user_avatar" />
          </div>
          <div className="flex flex-col gap-8px font-medium">
            <p className="text-base text-text-primary">{author.name}</p>
            <p className="text-xs text-text-note">
              {formattedCreatedTime.formattedDate} {formattedCreatedTime.time}
            </p>
          </div>
        </div>
        {/* Info: (20250903 - Julian) More Button */}
        <div ref={moreRef} className="relative flex flex-col gap-8px">
          <button type="button" onClick={toggleMore} className="p-10px">
            <FiMoreVertical size={24} />
          </button>
          {moreDropdown}
        </div>
      </div>
      {/* Info: (20250903 - Julian) Content */}
      <p className="text-sm font-medium text-text-primary">{content}</p>
      {/* Info: (20250903 - Julian) Likes / Dislikes / Comments / Share */}
      <div className="flex items-center justify-between text-sm font-bold">
        <div className="flex items-center">
          <button
            type="button"
            onClick={handleLike}
            className={`${isLikeActive ? 'text-button-primary' : 'text-text-primary'} flex items-center gap-spacing-3xs py-12px pr-24px hover:text-button-primary-hover`}
          >
            <TbThumbUp size={20} />
            <p>{formatNumberWithCommas(countOfLikes)}</p>
          </button>
          <button
            type="button"
            onClick={handleDislike}
            className={`${isDislikeActive ? 'text-button-primary' : 'text-text-primary'} flex items-center gap-spacing-3xs px-24px py-12px hover:text-button-primary-hover`}
          >
            <TbThumbDown size={20} />
            <p>{formatNumberWithCommas(countOfDislikes)}</p>
          </button>
        </div>

        <div className="flex items-center">
          <button
            type="button"
            className="flex items-center gap-spacing-3xs px-24px py-12px hover:text-button-primary-hover"
          >
            <AiOutlineMessage size={20} />
            <Trans
              i18nKey="business_detail:DISCUSSION_COMMENTS"
              values={{ count: formatNumberWithCommas(countOfComments) }}
            />
          </button>
          <button
            type="button"
            className="flex items-center gap-spacing-3xs py-12px pl-24px hover:text-button-primary-hover"
          >
            <FiShare2 size={20} />
            <p>{t('business_detail:DISCUSSION_SHARE')}</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostItem;

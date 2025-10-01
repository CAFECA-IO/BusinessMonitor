'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaCircleChevronUp, FaChevronDown } from 'react-icons/fa6';
import { FiSearch } from 'react-icons/fi';
import useOuterClick from '@/lib/hooks/use_outer_click';
import { timestampToString } from '@/lib/common';
import InfoBlockLayout from '@/components/business/info_block_layout';
import DiscussionPoster from '@/components/business/discussion_poster';
import PostItem from '@/components/business/post_item';
import Skeleton from '@/components/common/skeleton';
import useApi from '@/lib/hooks/use_api';
import { APIName } from '@/constants/api_connection';
import {
  CommentItem as ICommentItem,
  // AnnouncementItem as IAnnouncementItem,
} from '@/types/company';
import { Paginated as IPaginated } from '@/types/common';
import AnnouncementModal from '@/components/common/announcement_modal';

enum SortOrder {
  NEWEST = 'newest',
  OLDEST = 'oldest',
}

interface IDiscussionTabProps {
  businessId: string;
}

interface IAnnouncementItem {
  id: number;
  title: string;
  date: string;
  content?: string | null;
  imageUrl?: string | null;
  views?: number;
  shares?: number;
  isPinned?: boolean;
}

const AnnouncementItem: React.FC<{ announcement: IAnnouncementItem }> = ({ announcement }) => {
  const { id, date, content } = announcement;

  const timestamp = new Date(date).getTime() / 1000;
  const formatted = timestampToString(timestamp);

  const clickHandler = () => {
    // ToDo: (20250930 - Julian) open announcement modal
  };

  return (
    <button
      type="button"
      key={id}
      onClick={clickHandler}
      className="group flex items-center gap-40px text-sm font-medium"
    >
      <p className="whitespace-nowrap text-text-secondary">{formatted.formattedDate}</p>
      <p className="w-fit truncate whitespace-nowrap text-text-primary group-hover:text-button-link-hover">
        {content}
      </p>
    </button>
  );
};

const SkeletonPostItem: React.FC = () => (
  <div className="flex w-full flex-col gap-32px rounded-radius-l bg-surface-primary px-36px py-24px">
    <div className="flex items-center gap-16px">
      <Skeleton width={80} height={80} rounded />
      <div className="flex flex-col gap-8px">
        <Skeleton width={100} height={15} />
        <Skeleton width={150} height={15} />
      </div>
    </div>
    <div className="flex flex-col gap-8px">
      <Skeleton width={250} height={20} />
      <Skeleton width={300} height={20} />
    </div>

    <div className="flex items-center justify-between">
      <div className="flex items-center gap-40px">
        <Skeleton width={80} height={30} />
        <Skeleton width={80} height={30} />
      </div>
      <div className="flex items-center gap-20px">
        <Skeleton width={120} height={30} />
        <Skeleton width={80} height={30} />
      </div>
    </div>
  </div>
);

const DiscussionTab: React.FC<IDiscussionTabProps> = ({ businessId }) => {
  const { t } = useTranslation(['business_detail']);

  const {
    success: annSuccess,
    payload: annData,
    isLoading: isAnnLoading,
    // ToDo: (20250930 - Julian) interface may change later
  } = useApi<IAnnouncementItem[]>(APIName.GET_ANNOUNCEMENTS_BY_COMPANY_ID, {
    params: { id: businessId },
  });

  const {
    success: postSuccess,
    payload: postData,
    isLoading: isPostLoading,
  } = useApi<IPaginated<ICommentItem>>(APIName.GET_COMMENTS_BY_COMPANY_ID, {
    params: { id: businessId },
  });

  const posts: readonly ICommentItem[] = postData?.items ?? [];
  const announcements: IAnnouncementItem[] = annData ?? [];

  const {
    targetRef: sortRef,
    componentVisible: isSortOpen,
    setComponentVisible: setIsSortOpen,
  } = useOuterClick<HTMLDivElement>(false);

  const [scrollTop, setScrollTop] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<SortOrder>(SortOrder.NEWEST);

  useEffect(() => {
    const handleScroll = () => {
      setScrollTop(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Info: (20250903 - Julian) 在頂部時/沒有 post 資料時隱藏按鈕
  const scrollBtnDisabled = scrollTop === 0 || posts.length === 0;

  const toggleSortDropdown = () => setIsSortOpen((prev) => !prev);

  // Info: (20250903 - Julian) 捲動到頂部
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const sortOptions = Object.values(SortOrder).map((order) => {
    const handleClick = () => {
      setSortOrder(order);
      setIsSortOpen(false);
    };

    return (
      <button
        type="button"
        key={order}
        onClick={handleClick}
        className="p-16px text-left hover:text-text-brand"
      >
        {t(`business_detail:SORT_${order.toUpperCase()}`)}
      </button>
    );
  });

  const annRows = isAnnLoading ? (
    <div className="flex items-center gap-40px">
      <Skeleton width={60} height={20} />
      <Skeleton width={150} height={20} />
    </div>
  ) : annSuccess && announcements.length > 0 ? (
    announcements
      // Info: (20250930 - Julian) 置頂公告排序在前
      .sort((a, b) => (a.isPinned === b.isPinned ? 0 : a.isPinned ? -1 : 1))
      .map((ann) => <AnnouncementItem key={ann.id} announcement={ann} />)
  ) : (
    // ToDo: (20250930 - Julian) no data design
    <div>no data</div>
  );

  const postRows = isPostLoading ? (
    <SkeletonPostItem />
  ) : postSuccess && posts.length > 0 ? (
    posts.map((post) => <PostItem key={post.id} post={post} />)
  ) : (
    // ToDo: (20250930 - Julian) no data design
    <div className="flex items-center justify-center px-36px py-24px">no data</div>
  );

  return (
    <div className="flex gap-24px">
      {/* Info: (20250903 - Julian) Important Announcement Block */}
      <InfoBlockLayout
        title={t('business_detail:IMPORTANT_ANNOUNCEMENT_BLOCK_TITLE')}
        className="flex h-400px w-300px flex-col gap-40px overflow-y-auto"
      >
        {annRows}
      </InfoBlockLayout>

      {/* Info: (20250903 - Julian) Discussion Section */}
      <div className="flex w-full flex-col gap-40px">
        {/* Info: (20250903 - Julian) Scroll to Top Button */}
        <button
          type="button"
          onClick={scrollToTop}
          disabled={scrollBtnDisabled}
          className="fixed right-60px top-1/2 z-50 block overflow-hidden rounded-full bg-white text-button-primary shadow-drop-L disabled:hidden"
        >
          <FaCircleChevronUp size={44} />
        </button>

        {/* Info: (20250903 - Julian) Discussion Poster */}
        <DiscussionPoster />
        {/* Info: (20250903 - Julian) Discussion List */}
        <div className="flex flex-col gap-24px">
          {/* Info: (20250903 - Julian) Filter Section */}
          <div className="flex items-center gap-16px text-base font-normal">
            {/* Info: (20250903 - Julian) Search Box */}
            <div className="flex flex-1 gap-8px rounded-radius-s border border-border-secondary bg-surface-primary p-spacing-2xs text-text-note">
              <FiSearch size={24} />
              <input
                type="text"
                placeholder={t('business_detail:SEARCH_COMMENT_INPUT_PLACEHOLDER')}
                value={searchTerm}
                onChange={handleSearchChange}
                className="flex-1 text-text-primary placeholder:text-text-note"
              />
            </div>
            {/* Info: (20250903 - Julian) Sorting */}
            <div ref={sortRef} className="relative flex w-180px flex-col gap-spacing-3xs">
              <button
                type="button"
                onClick={toggleSortDropdown}
                className={`${
                  isSortOpen
                    ? 'border-border-brand text-text-brand'
                    : 'border-border-secondary text-text-note'
                } flex items-center justify-between gap-8px rounded-radius-s border bg-surface-primary p-spacing-2xs hover:border-border-brand hover:text-text-brand`}
              >
                <p>{t(`business_detail:SORT_${sortOrder.toUpperCase()}`)}</p>
                <FaChevronDown size={24} />
              </button>

              <div
                className={`${
                  isSortOpen ? 'visible opacity-100' : 'invisible opacity-0'
                } absolute top-64px z-10 flex max-h-300px w-full flex-col overflow-y-auto rounded-radius-s bg-surface-primary p-spacing-3xs text-text-note shadow-drop-L transition-all duration-150 ease-in-out`}
              >
                {sortOptions}
              </div>
            </div>
          </div>
          {/* Info: (20250903 - Julian) Discussion Rows */}
          <div className="flex flex-col items-center gap-12px">{postRows}</div>
        </div>
      </div>

      {/* Info: (20251001 - Julian) Announcement Modal */}
      <AnnouncementModal />
    </div>
  );
};

export default DiscussionTab;

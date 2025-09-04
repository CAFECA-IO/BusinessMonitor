'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { FaCircleChevronUp, FaChevronDown } from 'react-icons/fa6';
import { FiSearch } from 'react-icons/fi';
import { PiPaperPlaneTiltBold } from 'react-icons/pi';
import useOuterClick from '@/lib/hooks/use_outer_click';
import { timestampToString } from '@/lib/common';
import { mockAnnouncements } from '@/interfaces/announcement';
import { mockPosts } from '@/interfaces/post';
import InfoBlockLayout from '@/components/business/info_block_layout';
import PostItem from '@/components/business/post_item';

enum SortOrder {
  NEWEST = 'newest',
  OLDEST = 'oldest',
}

const DiscussionTab: React.FC = () => {
  // ToDo: (20250903 - Julian) Fetch real announcements from backend
  const importantAnnouncements = mockAnnouncements;
  const posts = mockPosts;

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

  // Info: (20250903 - Julian) 在頂部時隱藏按鈕
  const scrollBtnDisabled = scrollTop === 0;

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
        {order}
      </button>
    );
  });

  const annRows = importantAnnouncements.map((ann) => (
    // ToDo: (20250903 - Julian) Add onClick to open announcement modal
    <button
      type="button"
      key={ann.id}
      className="group flex items-center gap-40px text-sm font-medium"
    >
      <p className="whitespace-nowrap text-text-secondary">
        {timestampToString(ann.date).formattedDate}
      </p>
      <p className="w-fit truncate whitespace-nowrap text-text-primary group-hover:text-button-link-hover">
        {ann.content}
      </p>
    </button>
  ));

  const postRows = posts.map((post) => <PostItem key={post.id} {...post} />);

  return (
    <div className="flex gap-24px">
      {/* Info: (20250903 - Julian) Important Announcement Block */}
      <InfoBlockLayout
        title="Important Announcement"
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
          className="fixed right-60px top-1/2 z-50 block overflow-hidden rounded-full text-button-primary shadow-drop-L disabled:hidden"
        >
          <FaCircleChevronUp size={44} />
        </button>

        {/* Info: (20250903 - Julian) Discussion Posting */}
        <div className="flex items-center gap-24px rounded-radius-l bg-surface-primary px-40px py-24px">
          {/* Info: (20250903 - Julian) Avatar */}
          <div className="h-80px w-80px shrink-0 overflow-hidden rounded-full">
            <Image
              src={'/fake_avatar/business_img_3.jpg'}
              width={80}
              height={80}
              alt="user_avatar"
            />
          </div>
          {/* Info: (20250903 - Julian) Input Box */}
          <div className="flex flex-1 items-center rounded-radius-s border border-border-secondary p-spacing-2xs">
            <input
              type="text"
              placeholder="Say something"
              className="flex-1 text-base font-normal text-text-primary placeholder:text-text-note"
            />
            <button type="button" className="text-text-note hover:text-button-accent-hover">
              <PiPaperPlaneTiltBold size={20} />
            </button>
          </div>
        </div>
        {/* Info: (20250903 - Julian) Discussion List */}
        <div className="flex flex-col gap-24px">
          {/* Info: (20250903 - Julian) Filter Section */}
          <div className="flex items-center gap-16px text-base font-normal">
            {/* Info: (20250903 - Julian) Search Box */}
            <div className="flex flex-1 gap-8px rounded-radius-s border border-border-secondary bg-surface-primary p-spacing-2xs text-text-note">
              <FiSearch size={24} />
              <input
                type="text"
                placeholder="Search for comment"
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
                <p>{sortOrder}</p>
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
    </div>
  );
};

export default DiscussionTab;

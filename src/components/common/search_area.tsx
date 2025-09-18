'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiSearch } from 'react-icons/fi';
import { BM_URL } from '@/constants/url';

const SearchArea: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ToDo: (20250917 - Julian) Get tags from API
  const dummyTag = [
    'Business',
    'Search',
    'Input',
    'Component',
    'Tag',
    'Generic',
    'Example',
    'Demo',
  ];

  const tagData = dummyTag;

  // Info: (20250917 - Julian) 從 URL 參數取得預設關鍵字，若無則設為空字串
  const keywordFromParams = searchParams.get('keyword') ?? '';

  const [inputValue, setInputValue] = useState<string>(keywordFromParams);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const enterPressHandler = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      // Info: (20250917 - Julian) 轉換關鍵字，避免 URL 出現空格等特殊字元
      const encodedKeyword = encodeURIComponent(inputValue);
      // Info: (20250917 - Julian) 導向搜尋頁並帶入關鍵字與頁碼
      router.push(`${BM_URL.SEARCH}?keyword=${encodedKeyword}&page=1`);
    }
  };

  // Info: (20250917 - Julian) 只顯示前五個 tag
  const tags = tagData.splice(0, 5).map((tag) => {
    // Info: (20250917 - Julian) 關鍵字與 tag 相同時，標記為 active
    const isActive = searchParams.get('keyword')?.toLowerCase() === tag.toLowerCase();
    // Info: (20250917 - Julian) 導向搜尋頁並帶入關鍵字與頁碼
    const href = `${BM_URL.SEARCH}?keyword=${tag}&page=1`;
    // Info: (20250917 - Julian) 將該 tag 設為 inputValue 的值
    const clickHandler = () => setInputValue(tag);

    return (
      <Link
        key={tag}
        href={href}
        className={`${isActive ? 'bg-border-brand text-text-invert' : 'bg-grey-100 text-text-primary hover:bg-button-secondary-hover'} rounded-full px-12px py-2px font-normal`}
        onClick={clickHandler}
      >
        {tag}
      </Link>
    );
  });

  return (
    <div className="flex w-full flex-col items-start gap-16px">
      {/* Info: (20250804 - Julian) Search Input */}
      <div className="flex h-56px w-full items-center gap-8px rounded-radius-s border border-border-secondary bg-surface-primary p-spacing-2xs text-base font-normal text-text-primary">
        <FiSearch size={24} />
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={enterPressHandler}
          className="flex-1 bg-transparent placeholder:text-text-note"
          placeholder="Enter business name or business ID"
        />
      </div>

      {/* Info: (20250804 - Julian) Search Tags */}
      <div className="flex flex-wrap items-center gap-12px">{tags}</div>
    </div>
  );
};

export default SearchArea;

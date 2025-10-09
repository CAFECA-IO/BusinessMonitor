'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { RiArrowLeftSLine, RiArrowRightSLine } from 'react-icons/ri';

interface IPaginationProps {
  selectPage: (page: number) => void;
  totalPages: number;
}

const Pagination: React.FC<IPaginationProps> = ({ selectPage, totalPages }) => {
  const searchParams = useSearchParams();

  // Info: (20250917 - Julian) 從 URL 參數取得當前頁碼，預設為 1
  const activePage = Number(searchParams.get('page')) || 1;

  // Info: (20250917 - Julian) 建立一個包含所有頁碼的陣列
  const pagesArr = Array.from({ length: totalPages }, (_, i) => i + 1);

  // Info: (20250917 - Julian) 判斷是否顯示某頁碼
  const shouldShowPageNumber = (page: number) => {
    // Info: (20250917 - Julian) 總是顯示第一頁和最後一頁
    if (page === 1 || page === totalPages) return true;
    // Info: (20250917 - Julian) 在前 5 頁或後 5 頁時顯示所有這些頁碼
    if (activePage <= 2) {
      return page <= 5;
    }
    if (activePage > totalPages - 3) {
      return page > totalPages - 5;
    }
    // Info: (20250917 - Julian) 其他情況下顯示當前頁面前後兩頁
    return page >= activePage - 2 && page <= activePage + 2;
  };

  const pages = pagesArr.map((page) => {
    let pageBtn;
    if (shouldShowPageNumber(page)) {
      pageBtn = (
        <li key={page} className="flex items-center">
          <button
            onClick={() => selectPage(page)}
            className={`flex size-32px desktop:size-40px items-center justify-center rounded-full ${
              activePage === page
                ? 'bg-button-primary text-text-invert'
                : 'text-text-primary hover:bg-button-primary-hover'
            }`}
          >
            {page}
          </button>
        </li>
      );
    } else if (
      page === activePage - 3 ||
      page === activePage + 3 ||
      (activePage <= 2 && page === 6) ||
      (activePage > totalPages - 3 && page === totalPages - 5)
    ) {
      // Info: (20250917 - Julian) 只在當前頁面前後第三頁顯示省略號
      pageBtn = (
        <li key={page} className="flex items-center">
          <div className="flex size-32px desktop:size-40px items-center justify-center rounded-full">...</div>
        </li>
      );
    }

    return pageBtn;
  });

  const previousBtn = (
    <button
      onClick={() => selectPage(activePage - 1)}
      // Info: (20250917 - Julian) 總頁數為 0 或 當前頁數為第一頁時，按鈕 disabled
      disabled={totalPages === 0 || activePage === 1 ? true : false}
      className="flex items-center size-32px desktop:size-40px text-base text-text-primary hover:text-button-link-hover disabled:text-button-disable"
    >
      <RiArrowLeftSLine size={20} />
    </button>
  );

  const nextBtn = (
    <button
      onClick={() => selectPage(activePage + 1)}
      // Info: (20250917 - Julian) 總頁數為 0 或 當前頁數為最後一頁時，按鈕 disabled
      disabled={totalPages === 0 || activePage === totalPages ? true : false}
      className="flex items-center size-32px desktop:size-40px text-base text-text-primary hover:text-button-link-hover disabled:text-button-disable"
    >
      <RiArrowRightSLine size={20} />
    </button>
  );

  return (
    <ul className="mt-10 flex flex-wrap items-center justify-center gap-1 text-sm font-medium">
      <li>{previousBtn}</li>
      {pages}
      <li>{nextBtn}</li>
    </ul>
  );
};

export default Pagination;

'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { BM_URL } from '@/constants/url';
import SearchArea from '@/components/common/search_area';
import SearchResultList from '@/components/search/search_result_list';
import Layout from '@/components/common/layout';

const SearchResultPageBody: React.FC = () => {
  // Info: (20251007 - Julian) 從 URL 參數取得 keyword
  const searchParams = useSearchParams();
  const keyword = searchParams.get('keyword') ?? '';

  const crumbsItems = [
    { name: 'HOME', link: BM_URL.HOME },
    { name: 'BUSINESS_MONITOR', link: BM_URL.BUSINESS_MONITOR },
    { name: keyword, link: BM_URL.SEARCH }, // Info: (20251007 - Julian) 關鍵字顯示在麵包屑中
  ];

  return (
    <Layout
      crumbsItems={crumbsItems}
      pageBgColor="bg-surface-background"
      className="items-center gap-60px px-80px pb-60px"
    >
      {/* Info: (20250804 - Julian) Search Area */}
      <div className="w-3/4">
        <SearchArea />
      </div>

      {/* Info: (20250804 - Julian) Search Result List */}
      <div className="w-3/4">
        <SearchResultList />
      </div>
    </Layout>
  );
};

export default SearchResultPageBody;

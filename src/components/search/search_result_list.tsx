'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import useApi from '@/lib/hooks/use_api';
import { APIName } from '@/constants/api_connection';
import { Paginated as IPaginated } from '@/types/common';
import { CompanyCard as ICompanyCard } from '@/types/company';
import BusinessDetailCard from '@/components/search/business_detail_card';
import SkeletonCard from '@/components/common/skeleton_card';
import Pagination from '@/components/common/pagination';

const SearchResultList: React.FC = () => {
  const searchParams = useSearchParams();

  // Info: (20250917 - Julian) 從 URL 參數取得 page 與 keyword
  const page = searchParams.get('page') ?? '1';
  const keyword = searchParams.get('keyword') ?? '';

  const [activePage, setActivePage] = useState<number>(Number(page));

  const {
    success,
    payload: searchResult,
    isLoading,
    refetch,
  } = useApi<IPaginated<ICompanyCard>>(APIName.LIST_SEARCHED_BUSINESSES, {
    query: { q: keyword, page: activePage, pageSize: 10 },
  });

  useEffect(() => {
    setActivePage(Number(page));
  }, [page]);

  useEffect(() => {
    refetch();
  }, [keyword, activePage]);

  const totalPages = searchResult ? searchResult.pages : 0;
  const countOfTotal = searchResult ? searchResult.total : 0;
  const currentRow = {
    // Info: (20250917 - Julian) 計算目前顯示的起始與結束筆數
    start: searchResult ? (searchResult.page - 1) * searchResult.pageSize + 1 : 0,
    end: searchResult ? searchResult.page * searchResult.pageSize : 0,
  };

  const resultStr = isLoading
    ? ''
    : searchResult && `Results: ${currentRow.start} - ${currentRow.end} of ${countOfTotal}`;

  const displayedList = isLoading ? (
    <SkeletonCard cardStyle="detailed" />
  ) : success && searchResult && searchResult.items.length > 0 ? (
    searchResult.items.map((business) => (
      <BusinessDetailCard key={business.id} business={business} />
    ))
  ) : (
    // ToDo: (20250916 - Julian) 設計 no data 畫面
    <p className="text-center text-sm font-normal text-text-secondary">No results found.</p>
  );

  return (
    <div className="flex flex-col items-stretch gap-8px">
      {/* Info: (20250805 - Julian) Count of Total / Current Row */}
      <p className="text-right text-sm font-normal text-text-secondary">{resultStr}</p>

      {displayedList}

      <Pagination activePage={activePage} setActivePage={setActivePage} totalPages={totalPages} />
    </div>
  );
};

export default SearchResultList;

'use client';

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useApi from '@/lib/hooks/use_api';
import { APIName } from '@/constants/api_connection';
import { Paginated as IPaginated } from '@/types/common';
import { CompanyCard as ICompanyCard } from '@/types/company';
import BusinessDetailCard from '@/components/search/business_detail_card';
import SkeletonCard from '@/components/common/skeleton_card';
import Pagination from '@/components/common/pagination';

const SearchResultList: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Info: (20250917 - Julian) 從 URL 參數取得 page 與 keyword
  const page = searchParams.get('page') ?? '1';
  const keyword = searchParams.get('keyword') ?? '';

  const isKeywordEmpty = keyword.trim() === '';

  const apiQuery = { q: keyword, page: page, pageSize: 10 };

  const {
    success,
    payload: searchResult,
    isLoading,
    trigger,
  } = useApi<IPaginated<ICompanyCard>>(APIName.LIST_SEARCHED_BUSINESSES, {
    query: apiQuery,
  });

  // Info: (20250917 - Julian) 點擊按鈕時更新當前頁面，並寫入 URL 參數
  const selectPage = (page: number) => {
    // Info: (20250917 - Julian) 保留現有 query
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    // Info: (20250917 - Julian) 更新 URL
    router.push(`?${params.toString()}`);
  };

  useEffect(() => {
    // Info: (20250917 - Julian) 當 keyword 或 page 改變時，重新取得資料
    trigger({ query: apiQuery });
  }, [keyword, page]);

  const totalPages = searchResult ? searchResult.pages : 0;
  const countOfTotal = searchResult ? searchResult.total : 0;
  const currentRow = {
    // Info: (20250917 - Julian) 計算目前顯示的起始與結束筆數
    start: searchResult ? (searchResult.page - 1) * searchResult.pageSize + 1 : 0,
    end: searchResult ? searchResult.page * searchResult.pageSize : 0,
  };

  const isShowing = !isLoading && success && searchResult && searchResult.items.length > 0;

  const displayedResultStr = isShowing && (
    <p className="text-right text-sm font-normal text-text-secondary">{`Results: ${currentRow.start} - ${currentRow.end} of ${countOfTotal}`}</p>
  );

  const displayedList = isLoading ? (
    <SkeletonCard cardStyle="detailed" />
  ) : isShowing ? (
    searchResult.items.map((business) => (
      <BusinessDetailCard key={business.id} business={business} />
    ))
  ) : (
    // ToDo: (20250916 - Julian) 設計 no data 畫面
    <p className="text-center text-sm font-normal text-text-secondary">No results found.</p>
  );

  const displayedPagination = isShowing && totalPages > 1 && (
    <Pagination selectPage={selectPage} totalPages={totalPages} />
  );

  const content = isKeywordEmpty ? (
    // ToDo: (20250917 - Julian) 設計請輸入關鍵字畫面
    <div className="font-bold text-text-error">Please enter a keyword to search.</div>
  ) : (
    <>
      {displayedResultStr}
      {displayedList}
      {displayedPagination}
    </>
  );

  return (
    <div className="flex flex-col items-stretch gap-8px">
      {/* Info: (20250805 - Julian) Count of Total / Current Row */}
      {content}
    </div>
  );
};

export default SearchResultList;

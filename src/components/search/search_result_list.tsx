'use client';

import React from 'react';
import { mockBusinesses } from '@/interfaces/business';
import useApi from '@/lib/hooks/use_api';
import { APIName } from '@/constants/api_connection';
import { Paginated as IPaginated } from '@/types/common';
import { CompanyCard as ICompanyCard } from '@/types/company';
import BusinessDetailCard from '@/components/search/business_detail_card';
import SkeletonCard from '@/components/common/skeleton_card';

const SearchResultList: React.FC = () => {
  const dummyData = {
    businesses: mockBusinesses,
    countOfTotal: 234,
    currentRow: { start: 1, end: 10 },
  };

  const { countOfTotal, currentRow } = dummyData;

  const {
    success,
    payload: searchResult,
    isLoading,
  } = useApi<IPaginated<ICompanyCard>>(APIName.LIST_SEARCHED_BUSINESSES, {
    query: { q: '1', page: 1, pageSize: 10 },
  });

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
      <p className="text-right text-sm font-normal text-text-secondary">
        Results: {currentRow.start} - {currentRow.end} of {countOfTotal}
      </p>

      {displayedList}
    </div>
  );
};

export default SearchResultList;

import React from 'react';
import { IBusinessDetail } from '@/interfaces/business';
import BusinessDetailCard from '@/components/search/business_detail_card';

interface ISearchResultListProps {
  countOfTotal: number;
  currentRow: {
    start: number;
    end: number;
  };
  list: IBusinessDetail[];
}

const SearchResultList: React.FC<ISearchResultListProps> = ({ countOfTotal, currentRow, list }) => {
  const displayedList =
    list.length > 0 ? (
      list.map((business) => <BusinessDetailCard key={business.id} business={business} />)
    ) : (
      <p className="text-center text-sm font-normal text-text-secondary">No results found.</p>
    );

  return (
    <div className="flex w-3/4 flex-col items-stretch gap-8px">
      {/* Info: (20250805 - Julian) Count of Total / Current Row */}
      <p className="text-right text-sm font-normal text-text-secondary">
        Results: {currentRow.start} - {currentRow.end} of {countOfTotal}
      </p>
      {displayedList}
    </div>
  );
};

export default SearchResultList;

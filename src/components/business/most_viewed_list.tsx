import React from 'react';
import BusinessBriefCard from '@/components/business/business_brief_card';
import { IBusinessBrief } from '@/interfaces/business';

interface IMostViewedListProps {
  businessList: IBusinessBrief[];
}

const MostViewedList: React.FC<IMostViewedListProps> = ({ businessList }) => {
  return (
    <div className="flex flex-col items-start gap-16px">
      <p className="text-h6 font-bold text-text-secondary">Most Viewed</p>
      <div className="grid grid-cols-3 gap-12px desktop:grid-cols-5">
        {businessList.map((business) => (
          <BusinessBriefCard key={business.id} business={business} />
        ))}
      </div>
    </div>
  );
};

export default MostViewedList;

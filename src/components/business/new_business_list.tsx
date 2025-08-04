import React from 'react';
import BusinessBriefCard from '@/components/business/business_brief_card';
import { IBusinessBrief } from '@/interfaces/business';

interface INewBusinessListProps {
  businessList: IBusinessBrief[];
}

const NewBusinessList: React.FC<INewBusinessListProps> = ({ businessList }) => {
  return (
    <div className="flex flex-col items-start gap-16px">
      <p className="text-h6 font-bold text-text-secondary">New Businesses</p>
      <div className="grid grid-cols-5 gap-12px">
        {businessList.map((business) => (
          <BusinessBriefCard key={business.id} business={business} />
        ))}
      </div>
    </div>
  );
};

export default NewBusinessList;

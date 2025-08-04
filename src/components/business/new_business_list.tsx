import React from 'react';
import BusinessBriefCard from '@/components/business/business_brief_card';

const NewBusinessList: React.FC = () => {
  return (
    <div className="flex flex-col items-start gap-16px">
      <p className="text-h6 font-bold text-text-secondary">New Businesses</p>
      <div className="grid grid-cols-5 gap-12px">
        {Array.from({ length: 5 }).map((_, index) => (
          <BusinessBriefCard key={index} />
        ))}
      </div>
    </div>
  );
};

export default NewBusinessList;

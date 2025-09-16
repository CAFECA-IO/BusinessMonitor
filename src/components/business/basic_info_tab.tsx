import React from 'react';
import BasicInfoBlock from '@/components/business/basic_info_block';
import InvestorBlock from '@/components/business/investor_block';
import BusinessScopeBlock from '@/components/business/business_scope_block';
import HistoryBlock from '@/components/business/history_block';
import RelatedCompaniesBlock from '@/components/business/related_companies_block';
import { CompanyBasicResponse as IBasicResponse } from '@/types/company';
import Skeleton from '@/components/common/skeleton';
import useApi from '@/lib/hooks/use_api';
import { APIName } from '@/constants/api_connection';

interface IBasicInfoTabProps {
  businessId: string;
}

interface ISkeletonBlockProps {
  className?: string;
}

const SkeletonBlock: React.FC<ISkeletonBlockProps> = ({ className }) => {
  return (
    <div
      className={`${className} flex h-420px flex-col gap-40px rounded-radius-l bg-white px-60px py-40px`}
    >
      <p className="text-h5 font-bold text-text-brand">--</p>
      <hr className="border-border-secondary" />
      {/* Info: (20250915 - Julian) Content */}
      <div className="flex flex-col gap-20px">
        <Skeleton width={400} height={30} />
        <Skeleton width={350} height={30} />
        <Skeleton width={300} height={30} />
        <Skeleton width={250} height={30} />
        <Skeleton width={200} height={30} />
      </div>
    </div>
  );
};

const BasicInfoTab: React.FC<IBasicInfoTabProps> = ({ businessId }) => {
  const {
    payload: companyData,
    isLoading,
    // ToDo: (20250915 - Julian) interface may change later
  } = useApi<IBasicResponse>(APIName.GET_BASIC_INFO_BY_COMPANY_ID, {
    params: { id: businessId },
  });

  const isShowSkeleton = isLoading || !companyData;

  return (
    <div className="grid grid-cols-2 gap-x-60px gap-y-40px">
      {/* Info: (20250812 - Julian) Basic Info Block */}
      {isShowSkeleton ? (
        <SkeletonBlock className="col-span-2" />
      ) : (
        <BasicInfoBlock basicData={companyData.card} />
      )}

      {/* Info: (20250813 - Julian) Investor Block */}
      {isShowSkeleton ? <SkeletonBlock /> : <InvestorBlock investors={companyData.investors} />}

      {/* Info: (20250813 - Julian) Business Scope Block */}
      {isShowSkeleton ? (
        <SkeletonBlock />
      ) : (
        <BusinessScopeBlock scopes={companyData.businessScopes} />
      )}

      {/* Info: (20250813 - Julian) History Block */}
      {isShowSkeleton ? <SkeletonBlock /> : <HistoryBlock history={companyData.history} />}

      {/* Info: (20250813 - Julian) Related Companies Block */}
      {isShowSkeleton ? (
        <SkeletonBlock />
      ) : (
        <RelatedCompaniesBlock relatedCompanies={companyData.related} />
      )}
    </div>
  );
};

export default BasicInfoTab;

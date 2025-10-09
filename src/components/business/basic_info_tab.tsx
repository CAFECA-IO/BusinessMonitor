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
      className={`${className} flex h-420px flex-col gap-24px rounded-radius-l bg-white p-20px desktop:px-60px desktop:py-36px`}
    >
      <p className="text-base font-bold text-text-brand desktop:text-h5">--</p>
      <hr className="border-border-secondary" />
      {/* Info: (20250915 - Julian) Content */}
      <div className="hidden flex-col gap-20px desktop:flex">
        <Skeleton width={350} height={30} />
        <Skeleton width={300} height={30} />
        <Skeleton width={250} height={30} />
        <Skeleton width={200} height={30} />
        <Skeleton width={150} height={30} />
      </div>
      <div className="flex flex-col gap-20px desktop:hidden">
        <Skeleton width={250} height={30} />
        <Skeleton width={200} height={30} />
        <Skeleton width={150} height={30} />
      </div>
    </div>
  );
};

const BasicInfoTab: React.FC<IBasicInfoTabProps> = ({ businessId }) => {
  const { payload: companyData, isLoading } = useApi<IBasicResponse>(
    APIName.GET_BASIC_INFO_BY_COMPANY_ID,
    { params: { id: businessId } }
  );

  const isShowSkeleton = isLoading || !companyData;

  return (
    <div className="grid grid-cols-1 gap-x-60px gap-y-40px desktop:grid-cols-2">
      {/* Info: (20250812 - Julian) Basic Info Block */}
      {isShowSkeleton ? (
        <SkeletonBlock className="desktop:col-span-2" />
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

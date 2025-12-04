'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { IPeriod } from '@/interfaces/period';
import DatePicker, { DatePickerType } from '@/components/common/date_picker';
import dynamic from 'next/dynamic';

const InvestmentAdvisoryReportViewer = dynamic(
  () => import('@/components/business/investment_advisory_report_viewer'),
  { ssr: false }
);

const BalanceSheetViewer: React.FC<{ businessId: string; activePeriod: IPeriod }> = () => {
  return <div>No Balance Sheet Data</div>;
};

const CashFlowStatementViewer: React.FC<{ businessId: string; activePeriod: IPeriod }> = () => {
  return <div>No Cash Flow Statement Data</div>;
};

const IncomeStatementViewer: React.FC<{ businessId: string; activePeriod: IPeriod }> = () => {
  return <div>No Income Statement Data</div>;
};

const ProfitabilityAnalysisReportViewer: React.FC<{
  businessId: string;
  activePeriod: IPeriod;
}> = () => {
  return <div>No Profitability Analysis Report Data</div>;
};

const SolvencyAnalysisReportViewer: React.FC<{
  businessId: string;
  activePeriod: IPeriod;
}> = () => {
  return <div>No Solvency Analysis Report Data</div>;
};

enum FinancialReportType {
  BALANCE_SHEET = 'Balance Sheet',
  CASH_FLOW = 'Cash Flow Statement',
  INCOME_STATEMENT = 'Income Statement',
  PROFITABILITY = 'Profitability Analysis Report',
  INVESTMENT = 'Investment Advisory Report',
  SOLVENCY = 'Solvency Analysis Report',
}

interface IFinancialReportTabProps {
  businessId: string;
}

const FinancialReportTab: React.FC<IFinancialReportTabProps> = ({ businessId }) => {
  const { t } = useTranslation(['business_detail']);

  const [selectedPeriod, setSelectedPeriod] = useState<IPeriod>({
    startTimestamp: 0,
    endTimestamp: 0,
  });
  const [currentTab, setCurrentTab] = useState<FinancialReportType>(
    FinancialReportType.BALANCE_SHEET
  );

  const reportKeys = Object.keys(FinancialReportType);
  const reportOptions = Object.values(FinancialReportType);

  const reportSelections = reportOptions.map((report) => {
    const reportStr = report.toLowerCase().replace(/\s+/g, '_');

    // Info: (20250905 - Julian) i18n key mapping
    const reportKey = reportKeys[reportOptions.indexOf(report)];
    const reportTransCode = `REPORT_${reportKey}`;

    const isSelected = report === currentTab;

    const imgSrc = isSelected
      ? `/report_icon/${reportStr}_active.svg`
      : `/report_icon/${reportStr}_default.svg`;

    const handleClick = () => setCurrentTab(report);

    return (
      <button
        key={report}
        type="button"
        onClick={handleClick}
        disabled={isSelected}
        className={`${isSelected ? 'border-text-brand text-text-brand' : 'border-text-secondary text-text-secondary'} group flex h-100px flex-col items-center gap-4px rounded-radius-m border p-10px text-xs font-medium hover:border-button-primary-hover hover:text-button-primary-hover desktop:h-180px desktop:gap-16px desktop:px-40px desktop:py-24px desktop:text-sm`}
      >
        <div className="relative size-40px shrink-0 grow desktop:size-80px">
          <Image
            src={`/report_icon/${reportStr}_hover.svg`}
            alt="hover_icon"
            fill
            objectFit="contain"
            className={`absolute z-10 hidden group-hover:block`}
          />
          <Image src={imgSrc} alt={`${reportStr}_icon`} fill objectFit="contain" />
        </div>
        <p>{t(`business_detail:${reportTransCode}`)}</p>
      </button>
    );
  });

  const reportContent =
    currentTab === FinancialReportType.BALANCE_SHEET ? (
      <BalanceSheetViewer businessId={businessId} activePeriod={selectedPeriod} />
    ) : currentTab === FinancialReportType.CASH_FLOW ? (
      <CashFlowStatementViewer businessId={businessId} activePeriod={selectedPeriod} />
    ) : currentTab === FinancialReportType.INCOME_STATEMENT ? (
      <IncomeStatementViewer businessId={businessId} activePeriod={selectedPeriod} />
    ) : currentTab === FinancialReportType.PROFITABILITY ? (
      <ProfitabilityAnalysisReportViewer businessId={businessId} activePeriod={selectedPeriod} />
    ) : currentTab === FinancialReportType.INVESTMENT ? (
      <InvestmentAdvisoryReportViewer businessId={businessId} activePeriod={selectedPeriod} />
    ) : currentTab === FinancialReportType.SOLVENCY ? (
      <SolvencyAnalysisReportViewer businessId={businessId} activePeriod={selectedPeriod} />
    ) : null;

  return (
    <div className="flex flex-col gap-x-60px gap-y-40px">
      {/* Info: (20250901 - Julian) Report Tabs */}
      <div className="grid grid-cols-3 gap-8px desktop:grid-cols-6">{reportSelections}</div>

      {/* Info: (20251007 - Julian) Date Picker */}
      <DatePicker
        label={t('business_detail:REPORT_PERIOD')}
        pickerType={DatePickerType.PERIOD}
        selectedPeriod={selectedPeriod}
        setSelectedPeriod={setSelectedPeriod}
      />

      {/* ToDo: (20250901 - Julian) Report Content */}
      {reportContent}
    </div>
  );
};

export default FinancialReportTab;

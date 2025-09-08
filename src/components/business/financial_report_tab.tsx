'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { IPeriod } from '@/interfaces/period';
import DatePicker, { DatePickerType } from '@/components/common/date_picker';

enum FinancialReportType {
  BALANCE_SHEET = 'Balance Sheet',
  CASH_FLOW = 'Cash Flow Statement',
  INCOME_STATEMENT = 'Income Statement',
  PROFITABILITY = 'Profitability Analysis Report',
  INVESTMENT = 'Investment Advisory Report',
  SOLVENCY = 'Solvency Analysis Report',
}

const FinancialReportTab: React.FC = () => {
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
        className={`${isSelected ? 'border-text-brand text-text-brand' : 'border-text-secondary text-text-secondary'} px-70px group flex flex-col items-center gap-16px rounded-radius-m border py-24px text-sm font-medium hover:border-button-primary-hover hover:text-button-primary-hover`}
      >
        <div className="relative shrink-0">
          <Image
            src={`/report_icon/${reportStr}_hover.svg`}
            alt="hover_icon"
            width={80}
            height={80}
            className={`absolute z-10 hidden group-hover:block`}
          />
          <Image src={imgSrc} alt={`${reportStr}_icon`} width={80} height={80} />
        </div>
        <p>{t(`business_detail:${reportTransCode}`)}</p>
      </button>
    );
  });

  const reportContent =
    currentTab === FinancialReportType.BALANCE_SHEET ? (
      <div>Balance Sheet Content</div>
    ) : currentTab === FinancialReportType.CASH_FLOW ? (
      <div>Cash Flow Statement Content</div>
    ) : currentTab === FinancialReportType.INCOME_STATEMENT ? (
      <div>Income Statement Content</div>
    ) : currentTab === FinancialReportType.PROFITABILITY ? (
      <div>Profitability Analysis Report Content</div>
    ) : currentTab === FinancialReportType.INVESTMENT ? (
      <div>Investment Advisory Report Content</div>
    ) : currentTab === FinancialReportType.SOLVENCY ? (
      <div>Solvency Analysis Report Content</div>
    ) : null;

  return (
    <div className="flex flex-col gap-60px">
      {/* Info: (20250901 - Julian) Report Tabs */}
      <div className="grid grid-cols-6 gap-8px">{reportSelections}</div>

      {/* ToDo: (20250901 - Julian) Developing */}
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

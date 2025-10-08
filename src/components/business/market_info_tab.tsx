'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { IoTriangle } from 'react-icons/io5';
import { FaChevronRight } from 'react-icons/fa6';
import useApi from '@/lib/hooks/use_api';
import { APIName } from '@/constants/api_connection';
import { Paginated as IPaginated } from '@/types/common';
import { CompanyBasicCard as IBasicInfo } from '@/types/company';
import { INews } from '@/interfaces/news';
// import {NewsItem as INews} from '@/types/news';
import { IMarketInfo } from '@/interfaces/market';
import { ChartRange } from '@/constants/chart_range';
import CandlestickChartSection from '@/components/business/candlestick_chart_section';
import NewsItem from '@/components/business/news_item';
import Skeleton from '@/components/common/skeleton';
import { formatNumberWithCommas } from '@/lib/common';

interface IMarketInfoTabProps {
  businessId: string;
}

const MarketInfoTab: React.FC<IMarketInfoTabProps> = ({ businessId }) => {
  const { t } = useTranslation(['business_detail']);

  const [currentRange, setCurrentRange] = useState<ChartRange>(ChartRange['1M']);
  const switchRange = (range: ChartRange) => {
    setCurrentRange(range);
  };

  // Info: (20251008 - Julian) 企業基本資料
  const {
    success: companySuccess,
    payload: companyData,
    isLoading: companyIsLoading,
  } = useApi<IBasicInfo>(APIName.GET_BUSINESS_BY_COMPANY_ID, {
    params: { id: businessId },
  });

  // Info: (20251008 - Julian) 企業相關新聞
  const {
    success: newsSuccess,
    payload: newsData,
    isLoading: newsIsLoading,
  } = useApi<IPaginated<INews>>(APIName.GET_NEWS_BY_COMPANY_ID, {
    params: { id: businessId },
  });

  // Info: (20251008 - Julian) 企業市場資訊
  const {
    success: marketSuccess,
    payload: marketData,
    trigger: getMarketData,
    isLoading: marketIsLoading,
  } = useApi<IMarketInfo>(APIName.GET_MARKET_INFO_BY_COMPANY_ID, {
    params: { id: businessId },
    query: { timeframe: ChartRange['1M'] },
  });

  // Info: (20251008 - Julian) 切換時間區間時，重新取得資料
  useEffect(() => {
    switch (currentRange) {
      case ChartRange['1D']:
        getMarketData({ params: { id: businessId }, query: { timeframe: ChartRange['1D'] } });
        break;
      case ChartRange['1W']:
        getMarketData({ params: { id: businessId }, query: { timeframe: ChartRange['1W'] } });
        break;
      case ChartRange['1M']:
        getMarketData({ params: { id: businessId }, query: { timeframe: ChartRange['1M'] } });
        break;
      default:
        break;
    }
  }, [currentRange]);

  const marketInfo =
    marketSuccess && marketData
      ? marketData.summary
      : {
          open: 0,
          low: 0,
          high: 0,
          fiftyTwoWeekHigh: 0,
          fiftyTwoWeekLow: 0,
          avgVolume3Month: '0',
          sharesOutstanding: '0',
          mktCap: null,
          divYield: null,
        };

  const {
    open,
    low,
    high,
    fiftyTwoWeekHigh,
    fiftyTwoWeekLow,
    avgVolume3Month,
    sharesOutstanding,
    mktCap,
    divYield,
  } = marketInfo;

  // ToDo: (20251008 - Julian) Fetch real data
  const close = 0;
  const volume = 0;

  // Info: (20251008 - Julian) 收盤價 - 開盤價 = 漲跌幅
  const change = close - open;
  const changePercent = open !== 0 ? ((change / open) * 100).toFixed(2) : '0.00';

  const rangeOption = Object.values(ChartRange);

  const pulseStyle = marketIsLoading ? 'animate-pulse' : '';

  const stockColor =
    change > 0 ? 'text-text-success' : change < 0 ? 'text-text-error' : 'text-text-secondary';
  const stockSymbol =
    change > 0 ? (
      <IoTriangle size={10} />
    ) : change < 0 ? (
      <IoTriangle size={10} className="rotate-180" />
    ) : (
      ''
    );

  const formatNumberUnit = (num: number | string | null) => {
    // Info: (20251008 - Julian) 無資料或非數字顯示 N/A
    if (num === null || isNaN(Number(num))) return 'N/A';

    // Info: (20251008 - Julian) 數字格式化
    const numParsed = typeof num === 'string' ? parseFloat(num) : num;

    // Info: (20251008 - Julian) 處理數字格式，超過百萬顯示 M，十億顯示 B，兆顯示 T
    if (numParsed >= 1e12) return (numParsed / 1e12).toFixed(2) + 'T';
    if (numParsed >= 1e9) return (numParsed / 1e9).toFixed(2) + 'B';
    if (numParsed >= 1e6) return (numParsed / 1e6).toFixed(2) + 'M';

    // Info: (20251008 - Julian) 其他數字顯示兩位小數
    return numParsed.toFixed(2);
  };

  const rangeButtons = rangeOption.map((range) => {
    const isActive = currentRange === range;
    const clickHandler = () => switchRange(range);

    return (
      <button
        type="button"
        key={range}
        onClick={clickHandler}
        disabled={isActive}
        className={`${
          isActive
            ? 'bg-surface-brand text-text-invert'
            : 'bg-transparent text-text-primary enabled:hover:bg-grey-100 disabled:cursor-progress disabled:text-button-disable'
        } w-60px rounded-full px-12px py-2px text-sm`}
      >
        {t(`business_detail:GRAPH_${range.toUpperCase()}_BTN`)}
      </button>
    );
  });

  const displayedBusinessName = companyIsLoading ? (
    <Skeleton width={250} height={30} />
  ) : companySuccess && companyData && companyData.name.length > 0 ? (
    <h3>{companyData.name}</h3>
  ) : (
    <h3>N/A</h3>
  );

  const displayedChartSection = marketIsLoading ? (
    // ToDo: (20251008 - Julian) 設計 loading 畫面
    <div className="flex flex-col items-center justify-center p-80px">Loading...</div>
  ) : marketSuccess && marketData ? (
    <>
      {/* Info: (20251008 - Julian) chart meta data */}
      <div className="absolute left-24px top-24px z-50 flex items-center gap-16px bg-surface-background px-4px text-sm font-medium text-text-secondary">
        <p>
          {t('business_detail:GRAPH_OPEN')}{' '}
          <span className={stockColor}>{formatNumberWithCommas(open, true)}</span>
        </p>
        <p>
          {t('business_detail:GRAPH_HIGH')}{' '}
          <span className={stockColor}>{formatNumberWithCommas(high, true)}</span>
        </p>
        <p>
          {t('business_detail:GRAPH_LOW')}{' '}
          <span className={stockColor}>{formatNumberWithCommas(low, true)}</span>
        </p>
        <p>
          {t('business_detail:GRAPH_CLOSE')}{' '}
          <span className={stockColor}>{formatNumberWithCommas(close, true)}</span>
        </p>
        <div className={`flex items-center gap-4px ${stockColor}`}>
          {stockSymbol}
          <p>
            {change} ({changePercent}%)
          </p>
        </div>
        <p>
          {t('business_detail:GRAPH_VOLUME')}{' '}
          <span className={stockColor}>{formatNumberWithCommas(volume)}</span>
        </p>
      </div>

      {/* Info: (20251008 - Julian) candlestick chart */}
      <CandlestickChartSection chartPoints={marketData.data} />
    </>
  ) : (
    // ToDo: (20251008 - Julian) 設計 no data 畫面
    <div className="flex flex-col items-center justify-center p-80px">No Data</div>
  );

  const displayedNews = newsIsLoading ? (
    <Skeleton width={200} height={150} />
  ) : newsSuccess && newsData && newsData.items.length > 0 ? (
    <>
      <div className="flex flex-col gap-24px">
        {newsData.items.map((news) => (
          <NewsItem key={news.id} news={news} />
        ))}
      </div>
      {/* ToDo: (20250826 - Julian) Link to news page */}
      <Link
        href={'/'}
        className="flex items-center justify-center gap-8px text-base font-normal text-button-link hover:underline"
      >
        <p>{t('business_detail:NEWS_SEE_MORE')}</p>
        <FaChevronRight size={18} />
      </Link>
    </>
  ) : (
    // ToDo: (20250912 - Julian) 設計 no data 畫面
    <div>no news</div>
  );

  return (
    <div className="flex flex-col gap-60px">
      {/* Info: (20250826 - Julian) Chart Part */}
      <div className="flex flex-col gap-24px">
        {/* Info: (20250826 - Julian) Business Name */}
        <div className="flex items-center gap-4px whitespace-nowrap text-h3 font-bold text-text-primary">
          <Image src="/icons/verified.svg" width={32} height={32} alt="verified_icon" />
          {displayedBusinessName}
        </div>
        {/* Info: (20250826 - Julian) Stock Info */}
        <div className="flex items-center justify-between gap-60px px-24px py-12px">
          {/* Info: (20250826 - Julian) Left Part: Close, Change */}
          <div className={`${stockColor} ${pulseStyle} flex flex-col gap-8px`}>
            <p className="text-h3 font-bold">{formatNumberWithCommas(close, true)}</p>
            <div className="flex items-center gap-4px font-medium">
              {stockSymbol}
              <p className="text-lg">
                {formatNumberWithCommas(change, true)} (
                {formatNumberWithCommas(changePercent, true)}%)
              </p>
            </div>
          </div>
          {/* Info: (20250826 - Julian) Right Part: Other Stock Info */}
          <div className="grid flex-1 grid-cols-2 gap-40px text-sm">
            <div className="flex flex-col gap-4px">
              <div className="flex items-center justify-between">
                <p className="font-normal text-text-secondary">
                  {t('business_detail:MARKET_INFO_OPEN')}
                </p>
                <p className={`${stockColor} ${pulseStyle} font-medium`}>
                  {formatNumberWithCommas(open, true)}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <p className="font-normal text-text-secondary">
                  {t('business_detail:MARKET_INFO_LOW')}
                </p>
                <p className={`${pulseStyle} font-medium text-text-error`}>
                  {formatNumberWithCommas(low, true)}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <p className="font-normal text-text-secondary">
                  {t('business_detail:MARKET_INFO_HIGH')}
                </p>
                <p className={`${pulseStyle} font-medium text-text-success`}>
                  {formatNumberWithCommas(high, true)}
                </p>
              </div>
              <div className="flex items-center justify-between text-text-secondary">
                <p className="font-normal">
                  {t('business_detail:MARKET_INFO_FIFTY_TWO_WEEK_HIGH')}
                </p>
                <p className={`${pulseStyle} font-medium`}>
                  {formatNumberWithCommas(fiftyTwoWeekHigh, true)}
                </p>
              </div>
              <div className="flex items-center justify-between text-text-secondary">
                <p className="font-normal">{t('business_detail:MARKET_INFO_FIFTY_TWO_WEEK_LOW')}</p>
                <p className={`${pulseStyle} font-medium`}>
                  {formatNumberWithCommas(fiftyTwoWeekLow, true)}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-4px">
              <div className="flex items-center justify-between text-text-secondary">
                <p className="font-normal">
                  {t('business_detail:MARKET_INFO_AVG_VOLUME_THREE_MONTH')}
                </p>
                <p className={`${pulseStyle} font-medium`}>{formatNumberUnit(avgVolume3Month)}</p>
              </div>
              <div className="flex items-center justify-between text-text-secondary">
                <p className="font-normal">{t('business_detail:MARKET_INFO_SHARES_OUTSTANDING')}</p>
                <p className={`${pulseStyle} font-medium`}>{formatNumberUnit(sharesOutstanding)}</p>
              </div>
              <div className="flex items-center justify-between text-text-secondary">
                <p className="font-normal">{t('business_detail:MARKET_INFO_MKT_CAP')}</p>
                <p className={`${pulseStyle} font-medium`}>{formatNumberUnit(mktCap)}</p>
              </div>
              <div className="flex items-center justify-between text-text-secondary">
                <p className="font-normal">{t('business_detail:MARKET_INFO_DIV_YIELD')}</p>
                <p className={`${pulseStyle} font-medium`}>{formatNumberWithCommas(divYield)}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Info: (20251008 - Julian) Stock Chart */}
        <div className="relative flex w-full flex-col">
          {displayedChartSection}

          {/* Info: (20251008 - Julian) chart range button */}
          <div className="flex items-center justify-end gap-5px py-12px">{rangeButtons}</div>
        </div>

        {/* ToDo: (20251007 - Julian) 目前沒有資料，先隱藏 */}
        {/* Info: (20250826 - Julian) Traders’ Sentiment */}
        {/* <div className="flex flex-col gap-24px">
          <p className="font-medium text-text-secondary">
            {t('business_detail:TRADERS_SENTIMENT_TITLE')}
          </p>
          <div className="flex flex-col gap-8px">
            <div className="flex items-center justify-between text-base font-medium">
              <p className="text-text-success">
                {sellersPercent}% {t('business_detail:TRADERS_SENTIMENT_SELLERS')}
              </p>
              <p className="text-text-error">
                {buyersPercent}% {t('business_detail:TRADERS_SENTIMENT_BUYERS')}
              </p>
            </div>
            <div className="relative h-10px w-full overflow-hidden rounded-full bg-text-error py-4px">
              <span
                className="absolute left-0 top-0 h-full bg-text-success"
                style={{ width: `${sellersPercent}%` }} // Info: (20250826 - Julian) 動態設定 sellers 長度
              ></span>
            </div>
          </div>
        </div> */}
      </div>

      {/* Info: (20250826 - Julian) News Part */}
      <div className="flex flex-col gap-40px">
        <p className="text-h5 font-bold text-text-brand">{t('business_detail:NEWS_TITLE')}</p>
        <hr className="h-px border-border-secondary" />
        {displayedNews}
      </div>
    </div>
  );
};

export default MarketInfoTab;

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { IoTriangle } from 'react-icons/io5';
import { FaChevronRight } from 'react-icons/fa6';
import { INews, mockNews } from '@/interfaces/news';
import { mockMarketInfo } from '@/interfaces/market';

interface INewsItemProps {
  news: INews;
}

const NewsItem: React.FC<INewsItemProps> = ({ news }) => {
  const { title, content, imageUrl } = news;

  return (
    // ToDo: (20250826 - Julian) Link to news detail page
    <Link href={'/'} className="flex items-center gap-40px">
      <div className="relative h-150px w-200px shrink-0 overflow-hidden object-cover">
        <Image src={imageUrl} width={218} height={145} alt="news_thumbnail" />
      </div>
      <div className="flex flex-col gap-24px text-text-primary">
        <p className="text-lg font-bold">{title}</p>
        <p className="line-clamp-3 text-sm">{content}</p>
      </div>
    </Link>
  );
};

const MarketInfoTab: React.FC = () => {
  // ToDo: (20250826 - Julian) Fetch real stock & news data
  const {
    price,
    change,
    changePercent,
    open,
    low,
    high,
    fiftyTwoWeekHigh,
    fiftyTwoWeekLow,
    avgVolume3Month,
    sharesOutstanding,
    mktCap,
    divYield,
    // volume,
    sellersPercent,
    buyersPercent,
  } = mockMarketInfo;
  const newsData = mockNews;

  const formatNumber = (num: number) => {
    const numAbs = Math.abs(num);

    if (numAbs >= 1e12) return (numAbs / 1e12).toFixed(2) + 'T';
    if (numAbs >= 1e9) return (numAbs / 1e9).toFixed(2) + 'B';
    if (numAbs >= 1e6) return (numAbs / 1e6).toFixed(2) + 'M';

    return numAbs.toFixed(2);
  };

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

  const newsList = newsData.map((news) => <NewsItem key={news.id} news={news} />);

  return (
    <div className="flex flex-col gap-60px">
      {/* Info: (20250826 - Julian) Chart Part */}
      <div className="flex flex-col gap-24px">
        {/* Info: (20250826 - Julian) Business Name */}
        <div className="flex items-center gap-4px whitespace-nowrap text-h3 font-bold text-text-primary">
          <Image src="/icons/verified.svg" width={32} height={32} alt="verified_icon" />
          <h3>Im Business Name</h3>
        </div>
        {/* Info: (20250826 - Julian) Stock Info */}
        <div className="flex items-center justify-between gap-60px px-24px py-12px">
          {/* Info: (20250826 - Julian) Left Part: Price, Change */}
          <div className={`flex flex-col gap-8px ${stockColor}`}>
            <p className="text-h3 font-bold">{formatNumber(price)}</p>
            <div className="flex items-center gap-4px font-medium">
              {stockSymbol}
              <p className="text-lg">
                {formatNumber(change)} ({formatNumber(changePercent)}%)
              </p>
            </div>
          </div>
          {/* Info: (20250826 - Julian) Right Part: Other Stock Info */}
          <div className="grid flex-1 grid-cols-2 gap-40px text-sm">
            <div className="flex flex-col gap-4px">
              <div className="flex items-center justify-between">
                <p className="font-normal text-text-secondary">Open</p>
                <p className={`${stockColor} font-medium`}>{formatNumber(open)}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="font-normal text-text-secondary">Low</p>
                <p className="font-medium text-text-error">{formatNumber(low)}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="font-normal text-text-secondary">High</p>
                <p className="font-medium text-text-success">{formatNumber(high)}</p>
              </div>
              <div className="flex items-center justify-between text-text-secondary">
                <p className="font-normal">52 wk high</p>
                <p className="font-medium">{formatNumber(fiftyTwoWeekHigh)}</p>
              </div>
              <div className="flex items-center justify-between text-text-secondary">
                <p className="font-normal">52 wk low</p>
                <p className="font-medium">{formatNumber(fiftyTwoWeekLow)}</p>
              </div>
            </div>
            <div className="flex flex-col gap-4px">
              <div className="flex items-center justify-between text-text-secondary">
                <p className="font-normal">Avg Vol (3M)</p>
                <p className="font-medium">{formatNumber(avgVolume3Month)}</p>
              </div>
              <div className="flex items-center justify-between text-text-secondary">
                <p className="font-normal">Shares Outstanding</p>
                <p className="font-medium">{formatNumber(sharesOutstanding)}</p>
              </div>
              <div className="flex items-center justify-between text-text-secondary">
                <p className="font-normal">Mkt Cap</p>
                <p className="font-medium">{formatNumber(mktCap)}</p>
              </div>
              <div className="flex items-center justify-between text-text-secondary">
                <p className="font-normal">Div Yield</p>
                <p className="font-medium">{formatNumber(divYield)}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* ToDo: (20250826 - Julian) Stock Chart */}
        <div className="h-500px w-full bg-purple-400"></div>

        {/* Info: (20250826 - Julian) Traders’ Sentiment */}
        <div className="flex flex-col gap-24px">
          <p className="font-medium text-text-secondary">Traders’ Sentiment</p>
          <div className="flex flex-col gap-8px">
            <div className="flex items-center justify-between text-base font-medium">
              <p className="text-text-success">{sellersPercent}% Sellers</p>
              <p className="text-text-error">{buyersPercent}% Buyers</p>
            </div>
            <div className="relative h-10px w-full overflow-hidden rounded-full bg-text-error py-4px">
              <span
                className="absolute left-0 top-0 h-full bg-text-success"
                style={{ width: `${sellersPercent}%` }} // Info: (20250826 - Julian) 動態設定 sellers 長度
              ></span>
            </div>
          </div>
        </div>
      </div>

      {/* Info: (20250826 - Julian) News Part */}
      <div className="flex flex-col gap-40px">
        <p className="text-h5 font-bold text-text-brand">News</p>
        <hr className="h-px border-border-secondary" />
        <div className="flex flex-col gap-24px">{newsList}</div>
        {/* ToDo: (20250826 - Julian) Link to news page */}
        <Link
          href={'/'}
          className="flex items-center justify-center gap-8px text-base font-normal text-button-link hover:underline"
        >
          <p>See More</p>
          <FaChevronRight size={18} />
        </Link>
      </div>
    </div>
  );
};

export default MarketInfoTab;

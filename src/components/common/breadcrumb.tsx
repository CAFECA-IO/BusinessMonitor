'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { FaChevronRight } from 'react-icons/fa6';
import { IBreadcrumbItem } from '@/interfaces/breadcrumb';
import Skeleton from '@/components/common/skeleton';

interface IBreadcrumbProps {
  items: IBreadcrumbItem[];
}

const Breadcrumb: React.FC<IBreadcrumbProps> = ({ items }) => {
  const { t } = useTranslation(['breadcrumb']);

  const crumbs = items.map((item, index) => {
    // Info: (20250805 - Julian) 最後一項為當前頁面
    const isActive = index === items.length - 1;
    // Info: (20250923 - Julian) 還沒取得資料前，顯示 loading 狀態
    const isLoading = item.name === '-';

    // Info: (20250805 - Julian) 當前頁面不需要連結
    const isLink = isLoading ? (
      <Skeleton width={120} height={24} />
    ) : isActive ? (
      <div className="text-text-brand">{t(`breadcrumb:${item.name}`)}</div>
    ) : (
      <Link href={item.link} className="hover:text-text-brand">
        {t(`breadcrumb:${item.name}`)}
      </Link>
    );
    // Info: (20250805 - Julian) 最後一項不需要顯示箭頭
    const isChevron = isActive ? null : <FaChevronRight size={20} />;

    return (
      <li key={index} className="flex items-center gap-8px text-text-secondary">
        {isLink}
        {isChevron}
      </li>
    );
  });

  return (
    <ol className="flex w-full items-center gap-8px text-sm font-normal desktop:text-base">
      {crumbs}
    </ol>
  );
};

export default Breadcrumb;

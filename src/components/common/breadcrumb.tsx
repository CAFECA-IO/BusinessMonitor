import React from 'react';
import Link from 'next/link';
import { FaChevronRight } from 'react-icons/fa6';

interface IBreadcrumbProps {
  items: {
    name: string;
    link: string;
  }[];
}

const Breadcrumb: React.FC<IBreadcrumbProps> = ({ items }) => {
  const crumbs = items.map((item, index) => {
    // Info: (20250805 - Julian) 最後一項為當前頁面
    const isActive = index === items.length - 1;

    // Info: (20250805 - Julian) 當前頁面不需要連結
    const isLink = isActive ? (
      <div className="text-text-brand">{item.name}</div>
    ) : (
      <Link href={item.link} className="hover:text-text-brand">
        {item.name}
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

  return <ol className="flex w-full items-center gap-8px font-normal">{crumbs}</ol>;
};

export default Breadcrumb;

'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { INews } from '@/interfaces/news';

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

export default NewsItem;

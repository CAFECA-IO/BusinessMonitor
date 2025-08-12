'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import Button from '@/components/common/button';
import { AiOutlineGlobal } from 'react-icons/ai';
import useOuterClick from '@/lib/hooks/use_outer_click';

const I18n: React.FC = () => {
  const langOptions = [
    { label: 'English', value: 'en' },
    { label: '繁體中文', value: 'tw' },
    { label: '简体中文', value: 'cn' },
  ];

  const { targetRef, componentVisible, setComponentVisible } = useOuterClick<HTMLDivElement>(false);
  const router = useRouter();
  const pathname = usePathname();

  const toggleLangMenu = () => setComponentVisible((prev) => !prev);

  const langs = langOptions.map((lang) => {
    // Info: (20250808 - Julian) 移除路徑中的語言部分，再添加目標語言前綴
    const currentPath = pathname.replace(/^\/(en|tw|cn)/, '');
    const currentHref = `/${lang.value}${currentPath}`;

    const switchLang = () => {
      setComponentVisible(false);
      router.push(currentHref);
    };

    return (
      <button
        key={lang.value}
        onClick={switchLang}
        className="p-16px text-left hover:bg-surface-secondary"
      >
        {lang.label}
      </button>
    );
  });

  return (
    <div ref={targetRef} className="relative">
      {/* Info: (20250807 - Julian) i18n Button */}
      <Button type="button" variant="secondaryBorderless" size="icon" onClick={toggleLangMenu}>
        <AiOutlineGlobal size={24} />
      </Button>

      <div
        className={`absolute right-0 z-10 flex w-220px flex-col whitespace-nowrap rounded-radius-s bg-white p-8px shadow-drop-L ${componentVisible ? 'visible opacity-100' : 'invisible opacity-0'} transition-all duration-300 ease-in-out`}
      >
        {langs}
      </div>
    </div>
  );
};

export default I18n;

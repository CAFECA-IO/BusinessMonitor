'use client';

import React, { useState } from 'react';
import { FaChevronRight, FaChevronLeft } from 'react-icons/fa6';
import { FiSearch } from 'react-icons/fi';
import useOuterClick from '@/lib/hooks/use_outer_click';

interface IFaq {
  id: number;
  question: string;
  answer: string;
}

const faqs: IFaq[] = [
  {
    id: 1,
    question: 'How do I add new device?',
    answer: `To successfully add a new device, it is essential to have your recovery key readily available. This key plays a vital role in restoring your Digital Identity and ensuring a smooth transition between devices. Follow these comprehensive steps to complete the process effectively:\n\n1. Ensure that your recovery key is stored in a safe and easily accessible location before you start the process.\n2. Open the app on your new device and select the 'Add Device' option from the main menu.\n3. When prompted, carefully input your recovery key to confirm your identity and proceed.\n4. Follow the on-screen instructions, which will guide you through the remaining setup steps, ensuring that everything is configured correctly.\n\nIt is crucial to keep your recovery key in a secure place and never share it with anyone. Losing this key could lead to losing access to your identity and all associated services, so handle it with the utmost care. If you have any questions or require further assistance, please do not hesitate to refer to our help center for more detailed information and support. We are here to help you navigate through any challenges you may encounter.`,
  },
  {
    id: 2,
    question: 'What if I lost or change my device?',
    answer: ``,
  },
  {
    id: 3,
    question: 'Can I transfer data from my old device to a new one?',
    answer: ``,
  },
  {
    id: 4,
    question: 'What are the steps to reset my device?',
    answer: ``,
  },
  {
    id: 5,
    question: 'How do I update the software on my device?',
    answer: ``,
  },
];

const HelpCenterTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentQueId, setCurrentQueId] = useState<number>(0);

  const currentFaq = faqs.find((faq) => faq.id === currentQueId) || {
    id: 0,
    question: '',
    answer: '',
  };

  const {
    targetRef: ansRef,
    componentVisible: isAnsOpen,
    setComponentVisible: setIsAnsOpen,
  } = useOuterClick<HTMLDivElement>(false);

  const changeSearchQuery = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const closeAns = () => setIsAnsOpen(false);

  const faqList = faqs.map((faq) => {
    const clickHandler = () => {
      setCurrentQueId(faq.id);
      setIsAnsOpen(true);
    };

    return (
      <button
        key={faq.id}
        type="button"
        onClick={clickHandler}
        className="flex items-center justify-between py-16px text-left text-base font-medium text-text-primary"
      >
        <p>{faq.question}</p>
        <FaChevronRight size={24} />
      </button>
    );
  });

  const answerLines = currentFaq.answer.split('\n').map((line, index) => (
    <p key={index} className="mb-8px last:mb-0">
      {line}
    </p>
  ));

  return (
    <>
      {/* Info:(20251028 - Julian) Main FAQ Content */}
      <div className="flex flex-col gap-24px px-16px pb-20px pt-40px">
        {/* Info: (20251028 - Julian) Search FAQ */}
        <div className="flex items-center gap-8px rounded-radius-s border border-border-secondary bg-surface-primary p-spacing-2xs">
          <FiSearch size={24} />
          <input
            type="text"
            value={searchQuery}
            onChange={changeSearchQuery}
            placeholder="Search topic"
            className="bg-transparent text-text-primary outline-none placeholder:text-text-note"
          />
        </div>

        {/* Info: (20251028 - Julian) FAQ List */}
        <h2 className="text-center text-lg font-bold text-text-brand">FAQ</h2>
        <hr className="border-border-secondary" />
        <div className="flex max-h-270px flex-col gap-16px overflow-y-auto">{faqList}</div>
      </div>

      {/* Info:(20251028 - Julian) Answer Tab */}
      <div
        ref={ansRef}
        className={`${isAnsOpen ? 'translate-x-0' : 'translate-x-full'} absolute left-0 top-0 flex size-full flex-col bg-surface-background p-16px transition-all duration-300 ease-in-out`}
      >
        {/* Info: (20251028 - Julian) Answer Title */}
        <div className="flex h-56px items-center gap-8px">
          <button type="button" className="p-10px" onClick={closeAns}>
            <FaChevronLeft size={24} />
          </button>
          <p className="flex-1 font-bold text-text-primary">FAQ</p>
        </div>
        {/* Info: (20251028 - Julian) Answer Content */}
        <div className="flex flex-col items-center gap-24px py-16px">
          <p className="text-center text-lg font-bold text-text-brand">{currentFaq.question}</p>
          <div className="flex max-h-400px flex-col overflow-y-auto px-16px py-12px text-sm font-medium text-text-secondary">
            {answerLines}
          </div>
        </div>
      </div>
    </>
  );
};

export default HelpCenterTab;

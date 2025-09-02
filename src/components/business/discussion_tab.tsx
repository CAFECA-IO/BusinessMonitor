import React from 'react';
import Image from 'next/image';
import { PiPaperPlaneTiltBold } from 'react-icons/pi';
// import { TbThumbUp,TbThumbDown } from "react-icons/tb";
import { timestampToString } from '@/lib/common';
import InfoBlockLayout from '@/components/business/info_block_layout';

interface IAnnouncement {
  id: string;
  date: number;
  content: string;
}

const mockAnnouncements: IAnnouncement[] = [
  {
    id: 'ANN-001',
    date: 1696118400,
    content: 'We are excited to announce the launch of our new feature!',
  },
  {
    id: 'ANN-002',
    date: 1696204800,
    content: 'Scheduled maintenance will occur on September 15th from 1 AM to 3 AM UTC.',
  },
  {
    id: 'ANN-003',
    date: 1696291200,
    content: 'Our team has expanded! Welcome our new members joining this month.',
  },
  {
    id: 'ANN-004',
    date: 1696377600,
    content:
      'We have updated our privacy policy. Please review the changes at your earliest convenience.',
  },
];

const DiscussionTab: React.FC = () => {
  // ToDo: (20250902 - Julian) Fetch real announcements from backend
  const importantAnnouncements = mockAnnouncements;

  const annRows = importantAnnouncements.map((ann) => (
    // ToDo: (20250902 - Julian) Add onClick to open announcement modal
    <button
      type="button"
      key={ann.id}
      className="group flex items-center gap-40px text-sm font-medium"
    >
      <p className="whitespace-nowrap text-text-secondary">
        {timestampToString(ann.date).formattedDate}
      </p>
      <p className="w-fit truncate whitespace-nowrap text-text-primary group-hover:text-button-link-hover">
        {ann.content}
      </p>
    </button>
  ));

  return (
    <div className="flex gap-24px">
      {/* Info: (20250902 - Julian) Important Announcement Block */}
      <InfoBlockLayout
        title="Important Announcement"
        className="flex h-400px w-300px flex-col gap-40px overflow-y-auto"
      >
        {annRows}
      </InfoBlockLayout>

      {/* Info: (20250902 - Julian) Discussion Section */}
      <div className="flex w-full flex-col gap-40px">
        {/* Info: (20250902 - Julian) Discussion Posting */}
        <div className="flex items-center gap-24px rounded-radius-l bg-surface-primary px-40px py-24px">
          {/* Info: (20250902 - Julian) Avatar */}
          <div className="h-80px w-80px shrink-0 overflow-hidden rounded-full">
            <Image
              src={'/fake_avatar/business_img_3.jpg'}
              width={80}
              height={80}
              alt="user_avatar"
            />
          </div>
          {/* Info: (20250902 - Julian) Input Box */}
          <div className="flex flex-1 items-center rounded-radius-s border border-border-secondary p-spacing-2xs">
            <input
              type="text"
              placeholder="Say something"
              className="flex-1 text-base font-normal text-text-primary placeholder:text-text-note"
            />
            <button type="button" className="text-text-note hover:text-button-accent-hover">
              <PiPaperPlaneTiltBold size={20} />
            </button>
          </div>
        </div>
        {/* Info: (20250902 - Julian) Discussion List */}
        <div className="flex flex-col gap-24px">
          {/* Info: (20250902 - Julian) Filter Section */}
          <div className="flex items-center gap-16px"></div>
          {/* Info: (20250902 - Julian) Discussion Rows */}
          <div className="flex flex-col gap-32px rounded-radius-l bg-surface-primary px-36px py-24px">
            {/* Info: (20250902 - Julian) Content */}
            <p className="text-sm font-medium text-text-primary">
              This is an excellent chance for you to express your opinions! Im really curious to
              hear your thoughts on the recent updates. How do you feel about the changes that have
              been made? Lets dive into a discussion!
            </p>
            {/* Info: (20250902 - Julian) Likes / Dislikes / Comments / Share */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button type="button" className="flex">
                  <p></p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscussionTab;

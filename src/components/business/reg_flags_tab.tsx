'use client';

import React from 'react';
import Link from 'next/link';
import { timestampToString } from '@/lib/common';
import InfoBlockLayout from '@/components/business/info_block_layout';
import { FlagType } from '@/constants/flag';
import { mockFlags, IFlags } from '@/interfaces/flag';

const FlagItem: React.FC<IFlags> = ({ id, flagType, date, eventTitle, level }) => {
  const flagColor = flagType === FlagType.RED ? 'text-text-error' : 'text-text-success';
  const readMoreLink = `/flags/${id}`;

  return (
    <>
      <p className="col-span-2">{timestampToString(date).formattedDate}</p>
      <p className="col-span-3">{eventTitle}</p>
      <p className={`col-span-1 text-center font-medium ${flagColor}`}>{level}</p>
      <div className="col-span-2 text-center">
        <Link href={readMoreLink} className="text-button-link hover:text-button-primary-hover">
          Read More
        </Link>
      </div>
    </>
  );
};

const RedFlagsTab: React.FC = () => {
  // ToDo: (20250902 - Julian) Replace with actual data fetching logic
  const lastUpdateTime = 173289600;
  const flagData = mockFlags;

  // Info: (20250902 - Julian) Separate red and green flags
  const redFlags = flagData.filter((flag) => flag.flagType === FlagType.RED);
  const greenFlags = flagData.filter((flag) => flag.flagType === FlagType.GREEN);

  const redFlagRow = redFlags.map((flag) => <FlagItem key={flag.id} {...flag} />);
  const greenFlagRow = greenFlags.map((flag) => <FlagItem key={flag.id} {...flag} />);

  return (
    <div className="flex flex-col gap-16px">
      <p className="text-right">{timestampToString(lastUpdateTime).formattedDate}</p>
      <div className="grid grid-cols-2 gap-60px">
        {/* Info: (20250902 - Julian) Red Flags Block */}
        <InfoBlockLayout
          title="Red Flags"
          tooltipContent="tooltip content"
          className="flex flex-col gap-40px"
        >
          <div className="grid grid-cols-8 gap-40px font-medium text-text-note">
            <p className="col-span-2">Date</p>
            <p className="col-span-3">Events</p>
            <p className="col-span-1 text-center">Level</p>
            <p className="col-span-2"></p>
          </div>
          <div className="grid grid-cols-8 gap-40px overflow-y-auto text-base font-normal">
            {redFlagRow}
          </div>
        </InfoBlockLayout>
        {/* Info: (20250902 - Julian) Green Flags Block */}
        <InfoBlockLayout
          title="Green Flags"
          tooltipContent="tooltip content"
          className="flex flex-col gap-40px"
        >
          <div className="grid grid-cols-8 gap-40px font-medium text-text-note">
            <p className="col-span-2">Date</p>
            <p className="col-span-3">Events</p>
            <p className="col-span-1 text-center">Level</p>
            <p className="col-span-2"></p>
          </div>
          <div className="grid grid-cols-8 gap-40px overflow-y-auto text-base font-normal">
            {greenFlagRow}
          </div>
        </InfoBlockLayout>
      </div>
    </div>
  );
};

export default RedFlagsTab;

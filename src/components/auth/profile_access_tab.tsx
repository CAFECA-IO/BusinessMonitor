import React from 'react';
import Image from 'next/image';
import { PiSignOut } from 'react-icons/pi';
import { DEFAULT_USER_AVATAR } from '@/constants/display';
import { timestampToString } from '@/lib/common';

const AccessItem: React.FC = () => {
  const platformPic = DEFAULT_USER_AVATAR;
  const platformName = 'iSunFA Web';
  const loginDevice = 'iPhone 12';
  const loginTimestamp = 1728473800;

  const loginTimeStr = timestampToString(loginTimestamp);
  const formattedLoginTime = `Login Time: ${loginTimeStr.formattedDate} ${loginTimeStr.time}`;

  // ToDo: (20251031 - Julian) Implement actual logout functionality
  const handleLogout = () => {
    console.log(`Logout from ${platformName} on ${loginDevice}`);
  };

  return (
    <div className="flex items-center gap-16px py-12px">
      <div className="relative size-44px overflow-hidden rounded-full">
        <Image src={platformPic} fill objectFit="contain" alt="platform_pic" />
      </div>
      <div className="flex flex-1 flex-col">
        <div className="flex items-center gap-8px text-base font-bold">
          <p className="text-text-primary">{platformName}</p>
          <p className="text-text-secondary">{loginDevice}</p>
        </div>
        <p className="whitespace-nowrap text-sm font-medium text-text-secondary">
          {formattedLoginTime}
        </p>
      </div>
      <button type="button" onClick={handleLogout} className="p-10px text-text-primary">
        <PiSignOut size={24} />
      </button>
    </div>
  );
};

const ProfileAccessTab: React.FC = () => {
  return (
    <div className="flex size-full flex-1 flex-col items-stretch gap-16px py-16px">
      <div className="flex flex-col gap-24px px-16px">
        <h2 className="text-lg font-bold text-text-primary">Access</h2>
        {/* Info: (20251031 - Julian) Logged in platforms info box */}
        <div className="flex flex-col gap-8px rounded-radius-s bg-surface-secondary px-16px py-12px">
          <p className="text-sm font-medium text-text-primary">
            You&apos;re currently logged in on <span className="text-text-brand">6</span> platforms
          </p>
          <p className="text-xs text-text-secondary">
            Manage your sessions below. Logging out will revoke access immediately.
          </p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-8px px-16px">
        <button
          type="button"
          className="text-base font-normal text-button-link hover:text-button-link-hover"
        >
          Logout All
        </button>
        <div className="flex max-h-360px w-full flex-1 flex-col gap-16px overflow-y-auto pb-40px">
          <AccessItem />
          <AccessItem />
          <AccessItem />
          <AccessItem />
          <AccessItem />
        </div>
      </div>
    </div>
  );
};

export default ProfileAccessTab;

'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { PiSignOut } from 'react-icons/pi';
import { DEFAULT_USER_AVATAR } from '@/constants/display';
import { timestampToString } from '@/lib/common';
import LogoutAccessModal from '@/components/auth/logout_access_modal';
import { IAuthenticator } from '@/interfaces/auth';

const AccessItem: React.FC<{
  device: IAuthenticator;
  logoutHandler: () => void;
}> = ({ device, logoutHandler }) => {
  const {
    // id,
    // credentialID,
    // credentialPublicKey,
    label,
    createdAt,
    // counter,
    // verificationStatus
  } = device;

  const platformImgSrc = DEFAULT_USER_AVATAR;

  const loginTimestamp = new Date(createdAt).getTime() / 1000;
  const loginTimeStr = timestampToString(loginTimestamp);
  const formattedLoginTime = `Login Time: ${loginTimeStr.formattedDate} ${loginTimeStr.time}`;

  return (
    <div className="flex items-center gap-16px py-12px">
      <div className="relative size-44px overflow-hidden rounded-full">
        <Image src={platformImgSrc} fill objectFit="contain" alt="platform_pic" />
      </div>
      <div className="flex flex-1 flex-col">
        <div className="flex max-w-220px items-center gap-8px text-base font-bold">
          <p className="whitespace-nowrap text-text-primary">{label}</p>
          {/* <p className="truncate whitespace-nowrap text-text-secondary">{credentialID}</p> */}
        </div>
        <p className="whitespace-nowrap text-sm font-medium text-text-secondary">
          {formattedLoginTime}
        </p>
      </div>
      <button type="button" onClick={logoutHandler} className="p-10px text-text-primary">
        <PiSignOut size={24} />
      </button>
    </div>
  );
};

const ProfileAccessTab: React.FC<{
  devices?: IAuthenticator[];
  handleRemoveDevice?: (device: IAuthenticator) => Promise<void>;
}> = ({ devices, handleRemoveDevice }) => {
  const [preLogoutDevice, setPreLogoutDevice] = useState<IAuthenticator | null>(null);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState<boolean>(false);

  const loginAccessCount = devices ? devices.length : 0;
  const isShowList = loginAccessCount > 0;

  const toggleLogoutModal = () => setIsLogoutModalOpen((prev) => !prev);

  const clickLogoutAll = () => {
    setIsLogoutModalOpen(true);
  };

  const accessList =
    devices && isShowList ? (
      devices.map((device) => {
        const logoutHandler = () => {
          setPreLogoutDevice(device); // Info: (20251031 - Julian) 設定要 logout 的 access
          setIsLogoutModalOpen(true);
        };
        return <AccessItem key={device.id} device={device} logoutHandler={logoutHandler} />;
      })
    ) : (
      <div className="flex items-center justify-center text-text-secondary">
        No active sessions found.
      </div>
    );

  return (
    <>
      <div className="flex size-full flex-1 flex-col items-stretch gap-16px py-16px">
        <div className="flex flex-col gap-24px px-16px">
          <h2 className="text-lg font-bold text-text-primary">Access</h2>
          {/* Info: (20251031 - Julian) Logged in platforms info box */}
          <div className="flex flex-col gap-8px rounded-radius-s bg-surface-secondary px-16px py-12px">
            <p className="text-sm font-medium text-text-primary">
              You&apos;re currently logged in on{' '}
              <span className="text-text-brand">{loginAccessCount}</span> platforms
            </p>
            <p className="text-xs text-text-secondary">
              Manage your sessions below. Logging out will revoke access immediately.
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-8px px-16px">
          {isShowList && (
            <button
              type="button"
              onClick={clickLogoutAll}
              className="text-base font-normal text-button-link hover:text-button-link-hover"
            >
              Logout All
            </button>
          )}
          <div className="flex max-h-360px w-full flex-1 flex-col gap-16px overflow-y-auto pb-40px">
            {accessList}
          </div>
        </div>
      </div>

      {isLogoutModalOpen && handleRemoveDevice && (
        <LogoutAccessModal
          preLogoutDevice={preLogoutDevice}
          handleRemoveDevice={handleRemoveDevice}
          onClose={toggleLogoutModal}
        />
      )}
    </>
  );
};

export default ProfileAccessTab;

'use client';

import React, { useState, useEffect } from 'react';
import { HiOutlineDeviceTablet } from 'react-icons/hi';
import { IoGlobeOutline } from 'react-icons/io5';
import Button from '@/components/common/button';
import AnimationModal, { AnimationType } from '@/components/common/animation_modal';
import { IAuthenticator } from '@/interfaces/auth';

const LogoutAccessModal: React.FC<{
  preLogoutDevice: IAuthenticator | null;
  // ToDo: (20251208 - Julian) Maybe need to move to context file
  handleRemoveDevice: (device: IAuthenticator) => Promise<void>;
  onClose: () => void;
}> = ({ preLogoutDevice,handleRemoveDevice, onClose }) => {
  const [logoutSuccess, setLogoutSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (logoutSuccess) {
      const timer = setTimeout(() => {
        setLogoutSuccess(false);
        onClose();
      }, 2000); // Info: (20251031 - Julian) 2 秒後關閉 modal

      return () => clearTimeout(timer); // Info: (20251031 - Julian) 清除計時器
    }
  }, [logoutSuccess]);

  // ToDo: (20251031 - Julian) Implement actual logout functionality
  const handleLogoutSingle = () => {
    if (!preLogoutDevice) return;
    handleRemoveDevice(preLogoutDevice);
    // console.log(`Logout from ${preLogoutDevice.credentialID} on ${preLogoutDevice.label}`);
    // setLogoutSuccess(true);
  };
  const handleLogoutAll = () => {
    // ToDo: (20251208 - Julian) Implement actual logout from all functionality
    // setLogoutSuccess(true);
  };

  const modalContent = preLogoutDevice ? (
    <>
      <p className="text-base font-medium text-text-secondary">Logging out from:</p>
      <div className="flex flex-col gap-24px text-sm font-medium text-text-primary">
        <div className="flex items-center justify-between gap-20px">
          <div className="flex items-center gap-4px">
            <IoGlobeOutline size={20} />
            {/* <p>Platform:</p> */}
            <p className="whitespace-nowrap">Credential ID:</p>
          </div>
          <p className="break-all">{preLogoutDevice.credentialID}</p>
        </div>
        <div className="flex items-center justify-between gap-20px">
          <div className="flex items-center gap-4px">
            <HiOutlineDeviceTablet size={20} />
            <p>Device Info:</p>
          </div>
          <p className="w-150px text-right">{preLogoutDevice.label}</p>
        </div>
      </div>
    </>
  ) : (
    <>
      <p className="font-medium text-text-secondary">
        Do you want to log out from all of the services?
      </p>
    </>
  );

  const logoutBtn = preLogoutDevice ? (
    <Button type="button" variant="primary" onClick={handleLogoutSingle}>
      Log out
    </Button>
  ) : (
    <Button type="button" variant="primary" onClick={handleLogoutAll}>
      Yes, log out all
    </Button>
  );

  return (
    <>
      {/* Info: (20251031 - Julian) Main Modal */}
      <div className="fixed left-0 top-0 z-10 flex size-full items-center justify-center bg-black/50 p-20px">
        <div className="flex w-full flex-col items-stretch gap-24px rounded-radius-m bg-white px-24px pb-24px pt-40px">
          {/* Info: (20251031 - Julian) Modal Title */}
          <h2 className="text-center text-lg font-bold">Log out</h2>
          {/* Info: (20251031 - Julian) Modal Content */}
          {modalContent}
          {/* Info: (20251031 - Julian) Buttons */}
          <div className="grid grid-cols-2 gap-8px">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            {logoutBtn}
          </div>
        </div>
      </div>

      {/* Info: (20251031 - Julian) Animation Modal */}
      {logoutSuccess && <AnimationModal anim={AnimationType.SUCCESS} text="Logged out" />}
    </>
  );
};

export default LogoutAccessModal;

'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { FaChevronRight, FaChevronLeft } from 'react-icons/fa6';
import { FiTrash2 } from 'react-icons/fi';
import useOuterClick from '@/lib/hooks/use_outer_click';
import { useAuth } from '@/contexts/auth_context';
import { DEFAULT_USER_AVATAR } from '@/constants/display';
import ToggleSwitch from '@/components/common/toggle_switch';
import LoginDeviceTab from '@/components/auth/profile_login_device_tab';
import { ILoginDevice, mockDevices } from '@/interfaces/device';

enum SettingTab {
  GENERAL = 'General',
  LOGIN_DEVICE = 'Login & Device Management',
  SECURITY = 'Security & Verification',
  HELP_CENTER = 'Help Center',
}

enum LanguageOption {
  TW = 'Traditional Chinese',
  CN = 'Simplified Chinese',
  US = 'English',
}

const ProfileSettingTab: React.FC = () => {
  const { user } = useAuth();

  // ToDo: (20251027 - Julian) mock user title
  const userTitle = 'Digital Citizen';

  const userImg = user?.photo ?? DEFAULT_USER_AVATAR;

  const {
    targetRef: tabRef,
    componentVisible: isTabOpen,
    setComponentVisible: setIsTabOpen,
  } = useOuterClick<HTMLDivElement>(false);

  const [currentTab, setCurrentTab] = useState<SettingTab>(SettingTab.GENERAL);
  // Info: (20251027 - Julian) General Tab States
  const [isLoginAlertOn, setIsLoginAlertOn] = useState<boolean>(true);
  const [isNewMessageOn, setIsNewMessageOn] = useState<boolean>(true);
  const [isSystemAnnouncementOn, setIsSystemAnnouncementOn] = useState<boolean>(true);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageOption>(LanguageOption.US);
  // Info: (20251027 - Julian) Login Device Tab States
  // ToDo: (20251027 - Julian) Replace mock data with real data from API
  const [deviceData] = useState<ILoginDevice[]>(mockDevices);

  const openGeneralTab = () => {
    setCurrentTab(SettingTab.GENERAL);
    setIsTabOpen(true);
  };
  const openLoginDeviceTab = () => {
    setCurrentTab(SettingTab.LOGIN_DEVICE);
    setIsTabOpen(true);
  };
  const openSecurityTab = () => {
    setCurrentTab(SettingTab.SECURITY);
    setIsTabOpen(true);
  };
  const openHelpCenterTab = () => {
    setCurrentTab(SettingTab.HELP_CENTER);
    setIsTabOpen(true);
  };

  const closeTab = () => setIsTabOpen(false);

  const toggleLoginAlert = () => setIsLoginAlertOn((prev) => !prev);
  const toggleNewMessage = () => setIsNewMessageOn((prev) => !prev);
  const toggleSystemAnnouncement = () => setIsSystemAnnouncementOn((prev) => !prev);

  const mainContent = (
    <div className="flex flex-col gap-24px">
      <h2 className="text-lg font-bold text-text-primary">Setting</h2>
      <div className="flex h-450px flex-col gap-16px">
        {/* Info: (20251022 - Julian) Profile */}
        <div className="flex items-center gap-16px py-12px">
          <div className="size-66px overflow-hidden rounded-full">
            <Image src={userImg} width={66} height={66} alt="user_avatar" />
          </div>
          <p className="text-base font-bold text-text-primary">{user?.name ?? '-'}</p>
          <div className="rounded-radius-s bg-surface-brand px-12px py-6px text-xs font-medium text-text-invert">
            {userTitle}
          </div>
        </div>
        {/* Info: (20251022 - Julian) Divider */}
        <hr className="border-t border-border-secondary" />

        <div
          onClick={openGeneralTab}
          className="flex items-center gap-8px p-16px text-base font-medium text-text-primary hover:cursor-pointer"
        >
          <p className="flex-1">General</p>
          <FaChevronRight size={20} />
        </div>

        <div
          onClick={openLoginDeviceTab}
          className="flex items-center gap-8px p-16px text-base font-medium text-text-primary hover:cursor-pointer"
        >
          <p className="flex-1">Login & Device Management</p>
          <FaChevronRight size={20} />
        </div>

        <div
          onClick={openSecurityTab}
          className="flex items-center gap-8px p-16px text-base font-medium text-text-primary hover:cursor-pointer"
        >
          <p className="flex-1">Security & Verification</p>
          <FaChevronRight size={20} />
        </div>

        <div
          onClick={openHelpCenterTab}
          className="flex items-center gap-8px p-16px text-base font-medium text-text-primary hover:cursor-pointer"
        >
          <p className="flex-1">Help Center</p>
          <FaChevronRight size={20} />
        </div>

        <button
          type="button"
          className="flex items-center gap-8px p-16px text-base font-medium text-text-error"
        >
          <FiTrash2 size={20} />
          <p className="flex-1 text-left">Delete Account</p>
        </button>
      </div>
    </div>
  );

  const langOptions = Object.values(LanguageOption).map((lang) => {
    const imgSrc =
      lang === LanguageOption.TW
        ? '/countries/tw.svg'
        : lang === LanguageOption.CN
          ? '/countries/cn.svg'
          : '/countries/us.svg';

    const isSelected = selectedLanguage === lang;

    const onClick = () => {
      setSelectedLanguage(lang);
    };

    return (
      <button
        key={lang}
        type="button"
        disabled // Info: (20251027 - Julian) 暫不開放
        className={`${isSelected ? 'ring-4' : 'ring-0'} relative size-48px overflow-hidden rounded-full ring-button-primary-hover disabled:opacity-50`}
        onClick={onClick}
      >
        <Image src={imgSrc} fill objectFit="cover" alt={`${lang}_flag`} />
      </button>
    );
  });

  // Info: (20251027 - Julian) ================== General Tab Content ==================
  const generalTab = (
    <div className="flex gap-40px overflow-y-auto px-16px py-24px">
      <div className="flex w-full flex-col gap-24px">
        {/* Info: (20251027 - Julian) Profile Section */}
        <p className="text-lg font-bold text-text-brand">Profile</p>
        <div className="flex items-center justify-between">
          <div className="relative size-66px">
            <Image src={userImg} width={66} height={66} alt="user_avatar" />
          </div>
          <button
            type="button"
            disabled // ToDo: (20251027 - Julian) 暫不開放
            className="text-base font-normal text-button-link hover:text-button-link-hover disabled:text-button-disable"
          >
            Change
          </button>
        </div>
        {/* Info: (20251027 - Julian) Notifications Section */}
        <div className="flex flex-col gap-24px">
          <p className="text-lg font-bold text-text-brand">Notifications</p>
          <ToggleSwitch
            isOn={isLoginAlertOn}
            handleToggle={toggleLoginAlert}
            label="Login alerts"
            disabled // ToDo: (20251027 - Julian) 暫不開放
          />
          <ToggleSwitch
            isOn={isNewMessageOn}
            handleToggle={toggleNewMessage}
            label="New message"
            disabled // ToDo: (20251027 - Julian) 暫不開放
          />
          <ToggleSwitch
            isOn={isSystemAnnouncementOn}
            handleToggle={toggleSystemAnnouncement}
            label="System announcement"
            disabled // ToDo: (20251027 - Julian) 暫不開放
          />
        </div>
        {/* Info: (20251027 - Julian) Language Section */}
        <div className="flex flex-col gap-24px">
          <p className="text-lg font-bold text-text-brand">Language</p>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-text-primary">Language</p>
            <div className="flex items-center gap-24px">{langOptions}</div>
          </div>
        </div>
      </div>
    </div>
  );

  const displayedTab =
    currentTab === SettingTab.GENERAL ? (
      generalTab
    ) : currentTab === SettingTab.LOGIN_DEVICE ? (
      <LoginDeviceTab devices={deviceData} />
    ) : (
      <div></div>
    );

  return (
    <div className="relative flex w-full flex-1 flex-col gap-16px p-16px">
      {/* Info:(20251027 - Julian) Main Content */}
      {mainContent}

      <div
        ref={tabRef}
        className={`${isTabOpen ? 'translate-x-0' : 'translate-x-full'} absolute left-0 top-0 flex size-full flex-col bg-surface-background pt-16px transition-all duration-300 ease-in-out`}
      >
        {/* Info: (20251027 - Julian) Tab Title */}
        <div className="flex h-56px items-center gap-8px px-16px">
          <button type="button" className="p-10px" onClick={closeTab}>
            <FaChevronLeft size={24} />
          </button>
          <p className="font-bold text-text-primary">{currentTab}</p>
        </div>
        {/* Info: (20251027 - Julian) Tab Content */}
        {displayedTab}
      </div>
    </div>
  );
};

export default ProfileSettingTab;

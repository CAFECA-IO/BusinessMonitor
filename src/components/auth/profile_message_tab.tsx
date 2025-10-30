'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { FiSearch } from 'react-icons/fi';
import { DEFAULT_USER_AVATAR } from '@/constants/display';
import { timestampToString } from '@/lib/common';

const ChatRoom: React.FC = () => {
  // Info: (20251030 - Julian) 取得今天的 00:00 時間戳記
  const todayStartTimestamp = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);

  const chatRoomName = 'iSunFA';
  const lastMessage = 'I am on my way, hold on. Please be patient.';
  const chatRoomPic = DEFAULT_USER_AVATAR;
  const isMuted = true;
  const lastMessageTimestamp = 1761796100; // 1749290102;
  const unreadMessageCount = 0;

  // Info: (20251030 - Julian) 檢查最後訊息是否為今天
  const isToday = lastMessageTimestamp >= todayStartTimestamp;

  // Info: (20251030 - Julian) 今天的訊息 -> 顯示時間；今天之前的訊息 -> 顯示日期
  const formattedTime = isToday
    ? timestampToString(lastMessageTimestamp).timeWithAMorPM
    : timestampToString(lastMessageTimestamp).formattedDate;

  const formattedUnreadCount = unreadMessageCount > 99 ? '99+' : unreadMessageCount;

  const isShowBellIcon = isMuted && (
    <div className="shrink-0">
      <Image src="/icons/bell_off.svg" width={16} height={16} alt="muted_icon" />
    </div>
  );

  const isShowUnreadCount = unreadMessageCount > 0 && (
    <div className="flex size-24px items-center justify-center rounded-full bg-button-primary text-xs font-medium text-white">
      {formattedUnreadCount}
    </div>
  );

  return (
    <div className="flex items-center gap-16px">
      <div className="relative size-66px shrink-0 overflow-hidden rounded-full">
        <Image src={chatRoomPic} fill objectFit="contain" alt="chat_room_pic" />
      </div>
      <div className="flex flex-1 flex-col items-start gap-8px">
        <div className="flex items-center gap-4px">
          <p className="text-base font-bold text-text-primary">{chatRoomName}</p>
          {isShowBellIcon}
        </div>
        <p className="max-w-180px truncate text-sm font-medium text-text-secondary">
          {lastMessage}
        </p>
      </div>
      <div className="flex h-full flex-col items-end justify-start gap-10px">
        <p className="text-xs font-medium text-text-note">{formattedTime}</p>
        {isShowUnreadCount}
      </div>
    </div>
  );
};

const ProfileMessageTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');

  const changeSearchQuery = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="flex w-full flex-1 flex-col items-stretch gap-24px py-16px">
      <div className="flex flex-col gap-24px px-16px">
        <h2 className="text-lg font-bold text-text-primary">Message</h2>
        {/* Info: (20251030 - Julian) Search bar */}
        <div className="flex w-full items-center gap-8px rounded-radius-s border border-border-secondary bg-surface-primary p-spacing-2xs">
          <FiSearch size={24} />
          <input
            type="text"
            value={searchQuery}
            onChange={changeSearchQuery}
            placeholder="Search conversation"
            className="bg-transparent text-text-primary outline-none placeholder:text-text-note"
          />
        </div>
      </div>
      {/* Info: (20251030 - Julian) Chat List */}
      <div className="flex h-400px flex-col gap-16px overflow-x-auto px-16px py-40px">
        <ChatRoom />
        <ChatRoom />
        <ChatRoom />
        <ChatRoom />
        <ChatRoom />
      </div>
    </div>
  );
};

export default ProfileMessageTab;

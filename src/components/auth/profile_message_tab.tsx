'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { FiSearch } from 'react-icons/fi';
import { IoNotificationsOffOutline } from 'react-icons/io5';
import { DEFAULT_USER_AVATAR } from '@/constants/display';
import { timestampToString } from '@/lib/common';
import { IChatRoom } from '@/interfaces/chat';
import ChatRoomTab from '@/components/auth/chat_room_tab';

const ChatRoomItem: React.FC<{ roomData: IChatRoom; openChatRoom: () => void }> = ({
  roomData,
  openChatRoom,
}) => {
  const { name, messages, roomPic, isMuted, unreadMessageCount } = roomData;

  // Info: (20251030 - Julian) 取得今天的 00:00 timestamp
  const todayStartTimestamp = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);

  const chatRoomPic = roomPic ?? DEFAULT_USER_AVATAR;

  const lastMessageContent = messages[messages.length - 1]?.content || '-';
  const lastMessageTimestamp = messages[messages.length - 1]?.timestamp || 0;

  // Info: (20251030 - Julian) 檢查最後訊息是否為今天
  const isToday = lastMessageTimestamp >= todayStartTimestamp;

  // Info: (20251030 - Julian) 今天的訊息 -> 顯示時間；今天之前的訊息 -> 顯示日期
  const formattedTime = isToday
    ? timestampToString(lastMessageTimestamp).timeWithAMorPM
    : timestampToString(lastMessageTimestamp).formattedDate;

  const formattedUnreadCount = unreadMessageCount > 99 ? '99+' : unreadMessageCount;

  const isShowBellIcon = isMuted && (
    <IoNotificationsOffOutline size={20} className="text-text-note" />
  );

  const isShowUnreadCount = unreadMessageCount > 0 && (
    <div className="flex size-24px items-center justify-center rounded-full bg-button-primary text-xs font-medium text-white">
      {formattedUnreadCount}
    </div>
  );

  return (
    <div onClick={openChatRoom} className="flex cursor-pointer items-center gap-16px">
      <div className="relative size-66px shrink-0 overflow-hidden rounded-full">
        <Image src={chatRoomPic} fill objectFit="contain" alt="chat_room_pic" />
      </div>
      <div className="flex flex-1 flex-col items-start gap-8px">
        <div className="flex items-center gap-4px">
          <p className="text-base font-bold text-text-primary">{name}</p>
          {isShowBellIcon}
        </div>
        <p className="max-w-180px truncate text-sm font-medium text-text-secondary">
          {lastMessageContent}
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
  // ToDo: (20251030 - Julian) Get chat rooms from API
  const [chatRooms /* setChatRooms */] = useState<IChatRoom[]>([]);
  const [isShowChatRoom, setIsShowChatRoom] = useState<boolean>(false);
  const [currentChatRoomId, setCurrentChatRoomId] = useState<string>('');

  const changeSearchQuery = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const closeChatRoom = () => {
    setCurrentChatRoomId('');
    setIsShowChatRoom(false);
  };

  const chatList =
    chatRooms.length > 0 ? (
      chatRooms.map((room) => {
        const openChatRoom = () => {
          setCurrentChatRoomId(room.id);
          setIsShowChatRoom(true);
        };
        return <ChatRoomItem key={room.id} roomData={room} openChatRoom={openChatRoom} />;
      })
    ) : (
      <div className="flex items-center justify-center text-text-secondary">No Message</div>
    );

  return (
    <>
      {/* Info: (20251030 - Julian) Main Message Tab */}
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
        <div className="flex max-h-400px flex-col gap-16px overflow-x-auto px-16px py-40px">
          {chatList}
        </div>
      </div>

      {/* Info: (20251030 - Julian) Chat Room */}
      <ChatRoomTab
        isShowChatRoom={isShowChatRoom}
        chatRoomList={chatRooms}
        closeChatRoom={closeChatRoom}
        currentChatRoomId={currentChatRoomId}
      />
    </>
  );
};

export default ProfileMessageTab;

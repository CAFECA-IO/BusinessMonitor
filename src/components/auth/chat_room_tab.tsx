'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import useOuterClick from '@/lib/hooks/use_outer_click';
import { FaChevronLeft } from 'react-icons/fa6';
import { FiSearch } from 'react-icons/fi';
import { IoNotificationsOffOutline } from 'react-icons/io5';
import { PiPaperPlaneTiltBold } from 'react-icons/pi';
import { RxCross2 } from 'react-icons/rx';
import { DEFAULT_USER_AVATAR } from '@/constants/display';
import { mockChatRooms } from '@/interfaces/chat';

const MessageBubble: React.FC<{
  senderAvatar: string | null;
  messageContent: string;
  isFromMe?: boolean;
}> = ({ senderAvatar, messageContent, isFromMe }) => {
  const senderImg = senderAvatar ?? DEFAULT_USER_AVATAR;

  const messageLines = messageContent.split('\n').map((line, index) => (
    <p key={index} className="text-sm">
      {line}
      <br />
    </p>
  ));

  return (
    <div className={`${isFromMe ? 'flex-row-reverse' : 'flex-row'} flex items-start gap-8px`}>
      {/* Info: (20251030 - Julian) User Avatar */}
      <div className="relative size-40px overflow-hidden rounded-full">
        <Image src={senderImg} fill objectFit="contain" alt="user_avatar" />
      </div>
      {/* Info: (20251030 - Julian) Message Bubble */}
      <div
        className={`${isFromMe ? 'border-surface-brand bg-surface-brand font-medium text-text-invert' : 'border-border-secondary bg-surface-primary font-normal text-text-primary'} flex w-full flex-1 flex-col gap-16px rounded-radius-s border p-12px`}
      >
        {messageLines}
      </div>
    </div>
  );
};

const ChatRoomTab: React.FC<{
  isShowChatRoom: boolean;
  currentChatRoomId: string;
  closeChatRoom: () => void;
}> = ({ isShowChatRoom, currentChatRoomId, closeChatRoom }) => {
  const {
    targetRef: searchBarRef,
    componentVisible: isShowSearchBar,
    setComponentVisible: setIsShowSearchBar,
  } = useOuterClick<HTMLDivElement>(false);

  const [messageInput, setMessageInput] = useState<string>('');
  const [searchInput, setSearchInput] = useState<string>('');

  const chatRoomData = mockChatRooms.find((room) => room.id === currentChatRoomId);

  const chatRoomName = chatRoomData?.name ?? '-';
  const messages = chatRoomData?.messages ?? [];

  const userId = 123; // ToDo: (20251030 - Julian) Get current user ID from auth context or API

  const sendDisabled = messageInput.trim() === '';

  const openSearchBar = () => setIsShowSearchBar(true);
  const closeSearchBar = () => setIsShowSearchBar(false);

  const clickMute = () => {
    // ToDo: (20251030 - Julian) Mute chat room via API
    console.log('Mute Chat Room');
  };

  const changeSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
  };

  const handleSendMessage = () => {
    // ToDo: (20251030 - Julian) Send message via API
    console.log('Send Message:', messageInput);
  };

  const header = isShowSearchBar ? (
    <div className="flex flex-1 items-center gap-8px rounded-radius-s border border-border-secondary bg-surface-primary p-spacing-2xs">
      <div className="shrink-0">
        <FiSearch size={24} className="text-text-primary" />
      </div>
      <input
        type="text"
        value={searchInput}
        onChange={changeSearchInput}
        className="flex-1 bg-transparent text-text-primary outline-none placeholder:text-text-note"
        placeholder="Search in chat"
      />
      <button type="button" onClick={closeSearchBar} className="shrink-0">
        <RxCross2 size={24} className="text-text-primary" />
      </button>
    </div>
  ) : (
    <>
      <div className="flex-1 text-lg font-bold text-text-primary">{chatRoomName}</div>
      <div className="flex items-center">
        <button type="button" onClick={clickMute} className="p-10px text-text-primary">
          <IoNotificationsOffOutline size={24} />
        </button>
        <button type="button" onClick={openSearchBar} className="p-10px text-text-primary">
          <FiSearch size={24} />
        </button>
      </div>
    </>
  );

  const messageBubbles = messages.map((msg) => (
    <MessageBubble
      key={msg.id}
      senderAvatar={chatRoomData?.roomPic || null}
      messageContent={msg.content}
      isFromMe={msg.senderId === userId}
    />
  ));

  const tabContent = chatRoomData ? (
    <>
      {/* Info: (20251030 - Julian) Message Bubbles */}
      <div className="flex h-500px flex-1 flex-col gap-24px overflow-y-auto px-16px py-40px">
        {messageBubbles}
      </div>

      {/* Info: (20251030 - Julian) Input Box */}
      <div className="px-16px">
        <div className="flex items-center gap-8px rounded-radius-s border border-border-secondary bg-surface-primary p-spacing-2xs">
          <input
            type="text"
            value={messageInput}
            onChange={handleInputChange}
            className="flex-1 bg-transparent text-text-primary outline-none placeholder:text-text-note"
            placeholder="Enter Message"
          />
          <button
            type="button"
            onClick={handleSendMessage}
            disabled={sendDisabled}
            className="text-text-brand disabled:text-text-note"
          >
            <PiPaperPlaneTiltBold size={20} />
          </button>
        </div>
      </div>
    </>
  ) : (
    <div className="flex items-center justify-center">Loading...</div>
  );

  return (
    <div
      className={`${isShowChatRoom ? 'translate-x-0' : 'translate-x-full'} absolute left-0 top-0 z-10 flex size-full flex-col gap-8px bg-surface-background py-16px transition-all duration-300 ease-in-out`}
    >
      {/* Info: (20251030 - Julian) Chat Header */}
      <div ref={searchBarRef} className="flex items-center gap-8px px-16px">
        <button type="button" onClick={closeChatRoom} className="p-10px text-text-primary">
          <FaChevronLeft size={24} />
        </button>
        {header}
      </div>

      {tabContent}
    </div>
  );
};

export default ChatRoomTab;

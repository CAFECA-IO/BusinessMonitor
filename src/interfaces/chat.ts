export interface IMessage {
  id: string;
  senderId: number;
  content: string;
  timestamp: number;
  read: boolean;
}

export interface IChatRoom {
  id: string;
  name: string;
  messages: IMessage[];
  roomPic: string | null;
  isMuted: boolean;
  unreadMessageCount: number;
}

export const mockChatRooms: IChatRoom[] = [
  {
    id: 'room-001',
    name: 'iSunFA',
    messages: [
      {
        id: 'msg-000',
        senderId: 1,
        content: 'Welcome to iSunFA!',
        timestamp: 1761796100,
        read: true,
      },
      {
        id: 'msg-001',
        senderId: 123,
        content: 'Hello! I have some questions about your services.',
        timestamp: 1761800000,
        read: true,
      },
      {
        id: 'msg-002',
        senderId: 1,
        content: 'Sure! How can I assist you today?',
        timestamp: 1761803600,
        read: true,
      },
    ],
    roomPic: null,
    isMuted: false,
    unreadMessageCount: 0,
  },
  {
    id: 'room-002',
    name: 'iSunFB',
    messages: [
      {
        id: 'msg-001',
        senderId: 2,
        content: 'Hello, how are you?',
        timestamp: 1761709700,
        read: false,
      },
    ],
    roomPic: '/fake_avatar/business_img_1.jpg',
    isMuted: false,
    unreadMessageCount: 5,
  },
  {
    id: 'room-003',
    name: 'iSunFC',
    messages: [
      {
        id: 'msg-002',
        senderId: 3,
        content: 'Meeting at 3 PM.',
        timestamp: 1761623300,
        read: true,
      },
    ],
    roomPic: '/fake_avatar/business_img_3.jpg',
    isMuted: true,
    unreadMessageCount: 120,
  },
  {
    id: 'room-004',
    name: 'iSunFD',
    messages: [],
    roomPic: null,
    isMuted: true,
    unreadMessageCount: 0,
  },
  {
    id: 'room-005',
    name: 'iSunFE',
    messages: [
      {
        id: 'msg-003',
        senderId: 4,
        content: 'Thanks for waiting, let’s go inside!',
        timestamp: 1761623300,
        read: true,
      },
    ],
    roomPic: null,
    isMuted: true,
    unreadMessageCount: 23,
  },
];

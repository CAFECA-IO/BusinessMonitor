export interface ILoginDevice {
  deviceName: string;
  position: string;
  lastActiveTime: number;
  status: 'Online' | 'Offline';
}

// ToDo: (20251027 - Julian) Mock data for UI testing
export const mockDevices: ILoginDevice[] = [
  {
    deviceName: 'iPhone 12',
    position: 'Taipei, Taiwan',
    lastActiveTime: 1698412800,
    status: 'Online',
  },
  {
    deviceName: 'MacBook Pro',
    position: 'New Taipei, Taiwan',
    lastActiveTime: 1698326400,
    status: 'Offline',
  },
  {
    deviceName: 'iPad Air',
    position: 'Kaohsiung, Taiwan',
    lastActiveTime: 1698240000,
    status: 'Offline',
  },
];

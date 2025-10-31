export interface IAccess {
  id: string;
  platformName: string;
  platformPic: string | null;
  loginDevice: string;
  loginTimestamp: number;
}

export const mockAccessData: IAccess[] = [
  {
    id: '1',
    platformName: 'iSunFA Web',
    platformPic: null,
    loginDevice: 'iPhone 12',
    loginTimestamp: 1728473800,
  },
  {
    id: '2',
    platformName: 'Pinterest',
    platformPic: null,
    loginDevice: 'MacBook Pro',
    loginTimestamp: 1728397400,
  },
  {
    id: '3',
    platformName: 'Github Web ',
    platformPic: null,
    loginDevice: 'Samsung Galaxy S21',
    loginTimestamp: 1728311000,
  },
  {
    id: '4',
    platformName: 'Twitter',
    platformPic: null,
    loginDevice: 'iPad Air',
    loginTimestamp: 1728224600,
  },
  {
    id: '5',
    platformName: 'LinkedIn',
    platformPic: null,
    loginDevice: 'Dell XPS 13',
    loginTimestamp: 1728138200,
  },
];

export interface IBusinessHistory {
  id: string;
  date: number;
  description: string;
}

export const mockBusinessHistory: IBusinessHistory[] = [
  {
    id: '1',
    date: 1718044800,
    description: 'Increased Registered Capital to $1,200,000 for expansion.',
  },
  {
    id: '2',
    date: 1717984000,
    description: 'Raised Registered Capital to $1,200,000 for new projects.',
  },
  {
    id: '3',
    date: 1520979200,
    description: 'Purchased new equipment to enhance production capabilities.',
  },
  {
    id: '4',
    date: 1320969600,
    description: 'Elevated Registered Capital to $1,200,000 for market growth.',
  },
];

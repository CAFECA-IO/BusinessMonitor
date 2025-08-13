export interface IInvestor {
  id: string;
  name: string;
  position: string;
  sharesHeld: number;
  representative: string;
}

export const mockInvestors: IInvestor[] = [
  {
    id: '1',
    name: 'Joyce Wu',
    position: 'Chairman',
    sharesHeld: 0.0003,
    representative: 'InfoTech Software Services',
  },
  {
    id: '2',
    name: 'John Doe',
    position: 'CEO',
    sharesHeld: 0.05,
    representative: 'Tech Innovations Inc.',
  },
  {
    id: '3',
    name: 'Alice Smith',
    position: 'CFO',
    sharesHeld: 0.012,
    representative: 'Global Ventures Ltd.',
  },
  {
    id: '4',
    name: 'Bob Johnson',
    position: 'CTO',
    sharesHeld: 0.004,
    representative: 'NextGen Solutions',
  },
  {
    id: '5',
    name: 'Charlie Brown',
    position: 'COO',
    sharesHeld: 0.001,
    representative: 'Innovative Tech Corp.',
  },
];

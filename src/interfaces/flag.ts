import { FlagType } from '@/constants/flag';

export interface IFlags {
  id: string;
  flagType: FlagType;
  date: number;
  eventTitle: string;
  level: number;
}

export const mockFlags: IFlags[] = [
  {
    id: 'RF-001',
    flagType: FlagType.RED,
    date: 1622505600,
    eventTitle: 'Labor dispute',
    level: 4,
  },
  {
    id: 'RF-002',
    flagType: FlagType.RED,
    date: 1625097600,
    eventTitle: 'Regulatory investigation',
    level: 5,
  },
  {
    id: 'RF-003',
    flagType: FlagType.RED,
    date: 1633046400,
    eventTitle: 'Data breach incident',
    level: 3,
  },
  {
    id: 'RF-004',
    flagType: FlagType.RED,
    date: 1635724800,
    eventTitle: 'Product recall',
    level: 4,
  },
  {
    id: 'GF-001',
    flagType: FlagType.GREEN,
    date: 1627776000,
    eventTitle: 'Positive earnings report',
    level: 1,
  },
  {
    id: 'GF-002',
    flagType: FlagType.GREEN,
    date: 1630454400,
    eventTitle: 'New product launch',
    level: 2,
  },
  {
    id: 'GF-003',
    flagType: FlagType.GREEN,
    date: 1638316800,
    eventTitle: 'Strategic partnership',
    level: 1,
  },
  {
    id: 'GF-004',
    flagType: FlagType.GREEN,
    date: 1640995200,
    eventTitle: 'Market expansion',
    level: 2,
  },
];

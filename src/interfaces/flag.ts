import { FlagType } from '@/constants/flag';

export interface IFlags {
  id: string;
  flagType: FlagType;
  date: number;
  eventTitle: string;
  level: number;
}

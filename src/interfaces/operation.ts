import { PoliticalEventType } from '@/constants/operation';

export interface IImportAndExportData {
  id: string;
  year: string;
  month: string;
  totalImportAmount: number;
  totalExportAmount: number;
}

export interface IGovernmentTender {
  id: string;
  projectTitle: string;
  agencyName: string;
  awardDate: number;
  awardAmount: number;
  awarded: boolean;
}

export interface ITrademark {
  id: string;
  trademarkTitle: string;
  imageUrl: string;
}

export interface IPatent {
  id: string;
  patentTitle: string;
}

export interface IPoliticalEvent {
  id: string;
  eventType: PoliticalEventType;
  eventTitle: string;
  amount: number;
}

export interface IPoliticalActivities {
  contribution: {
    events: IPoliticalEvent[];
    totalAmount: number;
  };
  donation: {
    events: IPoliticalEvent[];
    totalAmount: number;
  };
}

export interface IOperations {
  lastUpdateTime: number;
  importAndExportData: IImportAndExportData[];
  governmentTenders: IGovernmentTender[];
  trademarks: ITrademark[];
  patents: IPatent[];
  politicalActivities: IPoliticalActivities;
}

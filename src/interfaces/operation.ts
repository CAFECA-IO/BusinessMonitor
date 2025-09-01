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

export enum PoliticalEventType {
  CONTRIBUTION = 'Contribution',
  DONATION = 'Donation',
}

export interface IPoliticalActivities {
  id: string;
  eventType: PoliticalEventType;
  eventTitle: string;
  amount: number;
}

export interface IOperations {
  lastUpdateTime: number;
  importAndExportData: IImportAndExportData[];
  governmentTenders: IGovernmentTender[];
  trademarks: ITrademark[];
  patents: IPatent[];
}

export const mockData: IOperations = {
  lastUpdateTime: 1762590640,
  importAndExportData: [
    {
      id: '1',
      year: '2023',
      month: 'Mar. to Apr.',
      totalImportAmount: 10000,
      totalExportAmount: 15000,
    },
    {
      id: '2',
      year: '2023',
      month: 'May to Jun.',
      totalImportAmount: 20000,
      totalExportAmount: 25000,
    },
    {
      id: '3',
      year: '2023',
      month: 'Jul. to Aug.',
      totalImportAmount: 30000,
      totalExportAmount: 35000,
    },
    {
      id: '4',
      year: '2023',
      month: 'Sep. to Oct.',
      totalImportAmount: 40000,
      totalExportAmount: 45000,
    },
    {
      id: '5',
      year: '2023',
      month: 'Nov. to Dec.',
      totalImportAmount: 50000,
      totalExportAmount: 55000,
    },
    {
      id: '6',
      year: '2024',
      month: 'Jan. to Feb.',
      totalImportAmount: 60000,
      totalExportAmount: 65000,
    },
    {
      id: '7',
      year: '2024',
      month: 'Mar. to Apr.',
      totalImportAmount: 70000,
      totalExportAmount: 75000,
    },
    {
      id: '8',
      year: '2024',
      month: 'May to Jun.',
      totalImportAmount: 80000,
      totalExportAmount: 85000,
    },
    {
      id: '9',
      year: '2024',
      month: 'Jul. to Aug.',
      totalImportAmount: 90000,
      totalExportAmount: 95000,
    },
    {
      id: '10',
      year: '2024',
      month: 'Sep. to Oct.',
      totalImportAmount: 100000,
      totalExportAmount: 105000,
    },
    {
      id: '11',
      year: '2024',
      month: 'Nov. to Dec.',
      totalImportAmount: 110000,
      totalExportAmount: 115000,
    },
    {
      id: '12',
      year: '2025',
      month: 'Jan. to Feb.',
      totalImportAmount: 120000,
      totalExportAmount: 125000,
    },
  ],
  governmentTenders: [
    {
      id: '1',
      projectTitle:
        'Professional Service Project for Establishing Kaohsiung City Road Safety Audit and Decision Support System',
      agencyName: 'Kaohsiung City Government Transportation Bureau',
      awardDate: 1762590640,
      awardAmount: 100000,
      awarded: true,
    },
    {
      id: '2',
      projectTitle: 'Taipei City Smart Streetlight System Deployment Project',
      agencyName: 'Taipei City Government Department of IT',
      awardDate: 1762590640,
      awardAmount: 200000,
      awarded: false,
    },
    {
      id: '3',
      projectTitle: 'Taoyuan City Water Resource Management Cloud Platform Service Project',
      agencyName: 'Taoyuan City Government Water Resources Department',
      awardDate: 1762590640,
      awardAmount: 300000,
      awarded: true,
    },
    {
      id: '4',
      projectTitle: 'New Taipei City Integrated Disaster Early Warning System Planning Project',
      agencyName: 'New Taipei City Government Fire Department',
      awardDate: 1762590640,
      awardAmount: 400000,
      awarded: false,
    },
  ],
  trademarks: [
    {
      id: '1',
      trademarkTitle: 'FontForge Creative Hub',
      imageUrl: '/fake_avatar/business_img_2.png',
    },
    {
      id: '2',
      trademarkTitle: 'TypeSmith Typography Services',
      imageUrl: '/fake_avatar/business_img_3.jpg',
    },
    {
      id: '3',
      trademarkTitle: 'GlyphWorks Design Studio',
      imageUrl: '/fake_avatar/business_img_1.jpg',
    },
    {
      id: '4',
      trademarkTitle: 'Fontastic Design Studio',
      imageUrl: '/fake_avatar/business_img_2.png',
    },
    {
      id: '5',
      trademarkTitle: 'LetterCraft Foundry',
      imageUrl: '/fake_avatar/business_img_3.jpg',
    },
  ],
  patents: [
    {
      id: '1',
      patentTitle: 'Next-Gen Architecture for Contextual Language Processing in IoT Devices',
    },
    {
      id: '2',
      patentTitle: 'Tailored Shock Absorption Mechanism for Electric Scooters',
    },
    {
      id: '3',
      patentTitle: 'Versatile Shock Absorption Technology for E-Scooters',
    },
    {
      id: '4',
      patentTitle: 'Adjustable Impact Mitigation System for E-Scooters',
    },
    {
      id: '5',
      patentTitle: 'Personalized Impact Resistance Framework for E-Scooters',
    },
    {
      id: '6',
      patentTitle: 'Adaptive Shock Absorption Solution for Electric Scooters',
    },
  ],
};

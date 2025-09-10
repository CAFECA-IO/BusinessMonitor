import { ILineGraphNode } from '@/interfaces/chart';

export interface IRelatedCompany {
  id: string;
  name: string;
  businessTaxId: string;
}

export interface IBusinessBrief extends IRelatedCompany {
  imgSrc: string;
  countOfGreenFlags: number;
  countOfRedFlags: number;
  stockPrice: number;
  stockPriceChange: number;
  lineGraphData: ILineGraphNode[];
}

export interface IBusinessDetail extends IBusinessBrief {
  // Info: (20250812 - Julian) Basic Info
  address: string;
  isVerified: boolean;
  officialWebLink: string;
  companyRepresentative: string; // Info: (20250812 - Julian) 公司代表人
  countryOfRegistration: string; // Info: (20250812 - Julian) 註冊國家
  dateOfEstablishment: number; // Info: (20250812 - Julian) 成立日期
  registeredCapital: number; // Info: (20250812 - Julian) 註冊資本
  paidInCapital: number; // Info: (20250812 - Julian) 實收資本
  capitalRanking: number; // Info: (20250812 - Julian) 資本排名

  updatedAt: number; // Info: (20250813 - Julian) 更新時間
}

export const mockBusinesses: IBusinessDetail[] = [
  {
    id: 'BS-001',
    name: 'Business Name here with second line',
    imgSrc: '/fake_avatar/business_img_1.jpg',
    businessTaxId: '1234567890',
    countOfGreenFlags: 5,
    countOfRedFlags: 2,
    stockPrice: 150.75,
    stockPriceChange: 0.0043, // Info: (20250804 - Julian) 0.43%
    address: '123 Business St, Business City, BC 12345',
    isVerified: true,
    officialWebLink: 'https://mermer.com.tw/',
    companyRepresentative: 'Wang Xiao Ming',
    countryOfRegistration: 'Taiwan',
    dateOfEstablishment: 1714986328,
    registeredCapital: 1000000,
    paidInCapital: 800000,
    capitalRanking: 1,
    updatedAt: 1723299420,
    lineGraphData: [
      { x: 1672502400, y: 420.85 },
      { x: 1672588800, y: 320.95 },
      { x: 1672675200, y: 388.48 },
      { x: 1672848000, y: 450.23 },
      { x: 1672934400, y: 670.12 },
      { x: 1673020800, y: 430.56 },
      { x: 1673107200, y: 580.34 },
      { x: 1673193600, y: 600.45 },
      { x: 1673280000, y: 520.65 },
      { x: 1673366400, y: 720.78 },
      { x: 1673452800, y: 650.89 },
      { x: 1673539200, y: 480.23 },
      { x: 1673625600, y: 530.45 },
      { x: 1673712000, y: 610.67 },
      { x: 1673798400, y: 590.34 },
      { x: 1673884800, y: 620.12 },
      { x: 1673971200, y: 700.56 },
      { x: 1674057600, y: 680.45 },
    ],
  },
  {
    id: 'BS-002',
    name: 'Another Business Name',
    imgSrc: '/fake_avatar/business_img_2.png',
    businessTaxId: '0987654321',
    countOfGreenFlags: 3,
    countOfRedFlags: 1,
    stockPrice: 200.5,
    stockPriceChange: -0.0021, // Info: (20250804 - Julian) -0.21%
    address: '456 Another Ave, Another City, AC 67890',
    isVerified: false,
    officialWebLink: 'https://mermer.com.tw/',
    companyRepresentative: 'Li Si Ming',
    countryOfRegistration: 'Taiwan',
    dateOfEstablishment: 1724986328,
    registeredCapital: 2000000,
    paidInCapital: 1500000,
    capitalRanking: 2,
    updatedAt: 1729823819,
    lineGraphData: [
      { x: 1672502400, y: 234.23 },
      { x: 1672588800, y: 424.13 },
      { x: 1672675200, y: 623.41 },
      { x: 1672848000, y: 234.53 },
      { x: 1672934400, y: 435.15 },
      { x: 1673020800, y: 524.13 },
      { x: 1673107200, y: 573.15 },
      { x: 1673193600, y: 691.84 },
      { x: 1673280000, y: 728.23 },
      { x: 1673366400, y: 658.91 },
      { x: 1673452800, y: 448.24 },
      { x: 1673539200, y: 749.63 },
    ],
  },
  {
    id: 'BS-003',
    name: 'Third Business Example',
    imgSrc: '/fake_avatar/business_img_3.jpg',
    businessTaxId: '1122334455',
    countOfGreenFlags: 10,
    countOfRedFlags: 0,
    stockPrice: 75.0,
    stockPriceChange: 0.005, // Info: (20250804 - Julian) 0.50%
    address: '789 Third Blvd, Third City, TC 11223',
    isVerified: true,
    officialWebLink: 'https://mermer.com.tw/',
    companyRepresentative: 'June Liu',
    countryOfRegistration: 'Taiwan',
    dateOfEstablishment: 1714986328,
    registeredCapital: 1500000,
    paidInCapital: 1200000,
    capitalRanking: 3,
    updatedAt: 1728329042,
    lineGraphData: [
      { x: 1672502400, y: 838.12 },
      { x: 1672588800, y: 451.23 },
      { x: 1672675200, y: 642.78 },
      { x: 1672848000, y: 523.23 },
      { x: 1672934400, y: 725.12 },
      { x: 1673020800, y: 634.85 },
      { x: 1673107200, y: 523.45 },
      { x: 1673193600, y: 743.26 },
      { x: 1673280000, y: 617.51 },
      { x: 1673366400, y: 592.28 },
      { x: 1673452800, y: 658.9 },
      { x: 1673539200, y: 719.83 },
    ],
  },
  {
    id: 'BS-004',
    name: 'Fourth Business Example',
    imgSrc: '/fake_avatar/business_img_1.jpg',
    businessTaxId: '6677889900',
    countOfGreenFlags: 7,
    countOfRedFlags: 3,
    stockPrice: 120.25,
    stockPriceChange: -0.0035, // Info: (20250804 - Julian) -0.35%
    address: '321 Fourth St, Fourth City, FC 44556',
    isVerified: false,
    officialWebLink: 'https://mermer.com.tw/',
    companyRepresentative: 'Chen Wei',
    countryOfRegistration: 'Taiwan',
    dateOfEstablishment: 1704986328,
    registeredCapital: 1800000,
    paidInCapital: 1600000,
    capitalRanking: 4,
    updatedAt: 1727329042,
    lineGraphData: [
      { x: 1672502400, y: 812.46 },
      { x: 1672588800, y: 738.23 },
      { x: 1672675200, y: 627.94 },
      { x: 1672848000, y: 727.49 },
      { x: 1672934400, y: 658.07 },
      { x: 1673020800, y: 377.29 },
      { x: 1673107200, y: 628.92 },
      { x: 1673193600, y: 859.24 },
      { x: 1673280000, y: 736.02 },
      { x: 1673366400, y: 718.48 },
      { x: 1673452800, y: 823.89 },
      { x: 1673539200, y: 689.28 },
    ],
  },
];

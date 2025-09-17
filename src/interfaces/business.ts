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

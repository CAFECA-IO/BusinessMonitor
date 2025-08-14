import { TrendPoint } from '@/types/trend_point';
import { Paginated } from '@/types/pagination';

export type CompanyCard = {
  id: number; // Info: (20250814 - Tzuhan) 公司資料表主鍵（內部用）
  name: string; // Info: (20250814 - Tzuhan) 公司名稱
  registrationNo: string; // Info: (20250814 - Tzuhan) 統一編號（或註冊編號）
  logoUrl: string | null; // Info: (20250814 - Tzuhan) 公司 Logo 圖片 URL
  status: string | null; // Info: (20250814 - Tzuhan) 公司狀態
  foreignCompanyName: string | null; // Info: (20250814 - Tzuhan) 外國公司名稱（如果有）
  address: string | null;
  flags: { green: number; red: number }; // Info: (20250814 - Tzuhan) 風險旗幟統計
  market: {
    last: string | null; // Info: (20250814 - Tzuhan) 最新收盤價
    change: string | null; // Info: (20250814 - Tzuhan) 與前一筆的漲跌額
    changePct: string | null; // Info: (20250814 - Tzuhan) 漲跌幅百分比（e.g. "0.26" 代表 0.26%）
    sparkline: TrendPoint[]; // Info: (20250814 - Tzuhan) 折線圖資料（通常取近 30 筆）
  };
};

export type CompaniesSearchPayload = Paginated<CompanyCard>;

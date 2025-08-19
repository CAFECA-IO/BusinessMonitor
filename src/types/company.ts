import { DecimalString, Paginated } from '@/types/common';

export type TrendPoint = { date: string; close: DecimalString }; // Info: (20250818 - Tzuhan) 由舊到新

export type Flags = { green: number; red: number };

export type MarketPayload = {
  last: DecimalString | null; // Info: (20250814 - Tzuhan) 最新收盤價
  change: DecimalString | null; // Info: (20250814 - Tzuhan) 與前一筆的漲跌額
  changePct: DecimalString | null; // Info: (20250814 - Tzuhan) 漲跌幅百分比（e.g. "0.26" 代表 0.26%）
  sparkline: Array<TrendPoint>; // Info: (20250814 - Tzuhan) 折線圖資料
};

export type CompanyCard = {
  id: number; // Info: (20250814 - Tzuhan) 公司資料表主鍵（內部用）
  name: string; // Info: (20250814 - Tzuhan) 公司名稱
  registrationNo: string; // Info: (20250814 - Tzuhan) 統一編號（或註冊編號）
  logoUrl: string | null; // Info: (20250814 - Tzuhan) 公司 Logo 圖片 URL
  status: string | null; // Info: (20250814 - Tzuhan) 公司狀態
  foreignCompanyName: string | null; // Info: (20250814 - Tzuhan) 外國公司名稱（如果有）
  address: string | null;
  flags: { green: number; red: number }; // Info: (20250814 - Tzuhan) 風險旗幟統計
  market: MarketPayload;
};

export type CompaniesSearchPayload = Paginated<CompanyCard>;

export type AutocompleteItem = {
  id: number;
  name: string;
  registrationNo: string;
  logoUrl?: string | null;
};

/** Info: (20250818 - Tzuhan) Basic 頁面聚合 */
export type CompanyBasicCard = {
  id: number;
  name: string;
  registrationNo: string;
  logoUrl: string | null;
  representative: string | null;
  registrationCountry: string | null;
  establishedDate: string | null; // Info: (20250818 - Tzuhan) YYYY-MM-DD
  capitalAmount: DecimalString | null;
  paidInCapital: DecimalString | null;
  capitalRanking: number | null;
  address: string | null;
  websiteUrl: string | null;
  status: string | null;
  lastUpdateTime: string; // Info: (20250818 - Tzuhan) ISO-8601
  flags: Flags;
};

export type InvestorItem = {
  name: string;
  position: string | null;
  sharesHeld: DecimalString | null; // Info: (20250818 - Tzuhan) 比例字串，例如 "0.5"
  representativeOfJuridicalPerson: string | null;
};

export type BusinessScopeItem = { code: string; description: string | null };

export type HistoryItem = { date: string; type: string; detail: unknown };

export type RelatedCompanyItem = {
  id: number;
  businessId: string | null;
  name: string;
  relationType: string | null;
  date: string; // Info: (20250818 - Tzuhan) YYYY-MM-DD
};

/** Info: (20250818 - Tzuhan) Operations 區塊 */
export type TradeRow = {
  year: number;
  month: string; // Info: (20250818 - Tzuhan) e.g. "2025-03"
  totalImportUSD: DecimalString;
  totalExportUSD: DecimalString;
};

export type TenderRow = {
  projectTitle: string;
  agencyName: string;
  awardDate: string; // Info: (20250818 - Tzuhan) YYYY-MM-DD
  awardAmount: DecimalString | null;
  awarded: boolean;
};

export type TrademarkRow = {
  name: string;
  applicationNo: string;
  status: string;
  imageUrl: string | null;
};

export type PatentRow = {
  title: string;
  applicationNo: string;
  kind?: string;
  date: string; // Info: (20250818 - Tzuhan) YYYY-MM-DD
  status?: string;
};

export type PoliticalRow = {
  event: string;
  amount: DecimalString;
  date: string; // Info: (20250818 - Tzuhan) YYYY-MM-DD
  recipient?: string;
};

/** Info: (20250818 - Tzuhan) Flags 頁籤 */
export type FlagItem = {
  date: string; // Info: (20250818 - Tzuhan) YYYY-MM-DD
  title: string;
  level: number; // Info: (20250818 - Tzuhan) 1–5
  sourceUrl?: string;
};

/** Info: (20250818 - Tzuhan) Discussion（留言） */
export type AnnouncementItem = {
  date: string; // Info: (20250818 - Tzuhan) YYYY-MM-DD
  title: string;
  url?: string;
};

export type CommentItem = {
  id: number;
  userName: string;
  userAvatar?: string | null;
  content: string;
  createdAt: string; // Info: (20250818 - Tzuhan) ISO-8601
  likes: number;
  comments: number; // Info: (20250818 - Tzuhan) 回覆數
  shares: number;
  // Info: (20250818 - Tzuhan) （可選）是否由本人按讚（若已登入）
  likedByMe?: boolean;
};

export type CreateCommentBody = {
  content: string; // Info: (20250818 - Tzuhan) 1..2000 字
};

export type CreateReplyBody = {
  content: string; // Info: (20250818 - Tzuhan) 1..2000 字
  parentId: number; // Info: (20250818 - Tzuhan) 要回覆的留言 id
};

export type CompanyBasicResponse = {
  card: CompanyBasicCard;
  investors: Array<InvestorItem>;
  businessScopes: Array<BusinessScopeItem>;
  history: Array<HistoryItem>;
  related: Array<RelatedCompanyItem>;
};

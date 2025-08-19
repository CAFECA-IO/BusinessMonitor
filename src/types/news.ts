export type NewsSource = {
  name: string; // Info: (20250819 - Tzuhan) 媒體名稱（如：Bloomberg）
  domain: string; // Info: (20250819 - Tzuhan) 來源網域（如：bloomberg.com）
  logoUrl?: string | null; // Info: (20250819 - Tzuhan) 選填：媒體 Logo
};

export type NewsItem = {
  id: string; // Info: (20250819 - Tzuhan) 穩定識別（建議用 source+url 的 hash）
  title: string;
  summary: string; // Info: (20250819 - Tzuhan) 1~3 段內文摘要（純文字）
  url: string; // Info: (20250819 - Tzuhan) 外部新聞連結
  imageUrl?: string | null; // Info: (20250819 - Tzuhan) 首圖
  source: NewsSource;
  publishedAt: string; // Info: (20250819 - Tzuhan) ISO-8601
  category?: string | null; // Info: (20250819 - Tzuhan) 選填：產業/主題分類
  language?: string; // Info: (20250819 - Tzuhan) 例如 'zh' | 'en'
};

export type SortOrder = 'asc' | 'desc';
export type SortSpec = ReadonlyArray<{ sortBy: string; sortOrder: SortOrder }>;

export type Pagination = {
  page: number; // Info: (20250814 - Tzuhan) 當前頁（1-based）
  pageSize: number; // Info: (20250814 - Tzuhan) 每頁筆數
  total: number; // Info: (20250814 - Tzuhan) 總筆數
  pages: number; // Info: (20250814 - Tzuhan) 總頁數（ceil(total/pageSize)）
  hasNext: boolean; // Info: (20250814 - Tzuhan) 是否有下一頁（page < pages）
  hasPrev: boolean; // Info: (20250814 - Tzuhan) 是否有上一頁（page > 1）
  sort?: SortSpec; // Info: (20250814 - Tzuhan) 目前排序條件（可選）
  note?: string; // Info: (20250814 - Tzuhan) 額外訊息（可選）
};

// Info: (20250814 - Tzuhan) 分頁容器：items 語義比 data 清楚（通常是陣列）
export type Paginated<TItem> = Pagination & {
  items: ReadonlyArray<TItem>;
};

// Info: (20250818 - Tzuhan) 數字以字串回傳以避免 JS 浮點誤差
export type DecimalString = string; // Info: (20250818 - Tzuhan) e.g. "1209.50"
export type BigIntString = string; // Info: (20250818 - Tzuhan) e.g. "9876543210"

export function makePaginated<TItem>(
  items: ReadonlyArray<TItem>,
  total: number,
  page: number,
  pageSize: number,
  sort?: SortSpec,
  note?: string
): Paginated<TItem> {
  const pages = Math.max(1, Math.ceil(total / Math.max(pageSize, 1)));
  const cur = Math.min(Math.max(page, 1), pages);
  return {
    items,
    page: cur,
    pageSize,
    total,
    pages,
    hasNext: cur < pages,
    hasPrev: cur > 1,
    sort,
    note,
  };
}

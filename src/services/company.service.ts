import { findCompanies, countCompanies } from '@/repositories/company.repository';

export async function searchCompanies(q: string, page = 1, pageSize = 20) {
  const offset = (page - 1) * pageSize;
  const [items, total] = await Promise.all([
    findCompanies({ q, limit: pageSize, offset }),
    countCompanies({ q }),
  ]);
  return {
    items,
    pagination: { page, pageSize, total, pages: Math.ceil(total / pageSize) },
  };
}

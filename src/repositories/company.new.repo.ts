import type { Db, CompanyCardBaseRow } from '@/repositories/company.shared.repo';

export async function repoFetchNewCompanies(db: Db, limit: number): Promise<CompanyCardBaseRow[]> {
  return db.$queryRaw<CompanyCardBaseRow[]>`
    SELECT c.id, c.name, c.registration_no, c.status, c.foreign_company_name, c.address, c.logo_url
    FROM company c
    ORDER BY c.updated_at DESC, c.id DESC
    LIMIT ${limit};
  `;
}

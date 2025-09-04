import { prisma } from '@/lib/prisma';
import type { CompanyCard } from '@/validators';
import { repoFetchNewCompanies } from '@/repositories/company.new.repo';
import { hydrateCompanyCards } from '@/services/company.card.service';

export async function listNewCompanies(limit: number): Promise<CompanyCard[]> {
  const rows = await repoFetchNewCompanies(prisma, limit);
  return hydrateCompanyCards(prisma, rows, 30);
}

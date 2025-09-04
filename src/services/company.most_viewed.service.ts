import { prisma } from '@/lib/prisma';
import type { CompanyCard } from '@/validators';
import { findMostViewedCompanies } from '@/repositories/company.most_viewed.repo';
import { hydrateCompanyCards } from '@/services/company.card.service';

export async function listMostViewedCompanies(limit: number): Promise<CompanyCard[]> {
  const rows = await findMostViewedCompanies(prisma, limit);
  return hydrateCompanyCards(prisma, rows, 30);
}

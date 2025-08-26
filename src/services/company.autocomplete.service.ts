import { AppError } from '@/lib/error';
import { ApiCode } from '@/lib/status';
import { analyzeQuery, isImprobableQuery } from '@/lib/utils';
import { prisma } from '@/lib/prisma';
import {
  repoAutocompleteCompanies,
  AutocompleteRow,
} from '@/repositories/company.autocomplete.repo';

export type AutocompleteItem = {
  id: number;
  name: string;
  registrationNo: string;
};

export async function autocompleteCompanies(rawQ: string, limit = 10): Promise<AutocompleteItem[]> {
  if (!rawQ?.trim()) throw new AppError(ApiCode.VALIDATION_ERROR, 'q is required');

  const meta = analyzeQuery(rawQ);
  if (meta.suspicious) {
    throw new AppError(ApiCode.VALIDATION_ERROR, 'Query contains illegal patterns');
  }
  // Info: (20250818 - Tzuhan) 自動完成：對極低機率字串直接回空陣列（避免打 DB 與 404）
  if (isImprobableQuery(meta)) return [];

  const rows: AutocompleteRow[] = await repoAutocompleteCompanies(
    prisma,
    meta,
    Math.min(Math.max(1, limit), 20)
  );
  return rows.map((r) => ({ id: r.id, name: r.name, registrationNo: r.registration_no }));
}

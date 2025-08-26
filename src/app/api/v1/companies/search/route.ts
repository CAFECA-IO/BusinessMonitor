import { NextRequest } from 'next/server';
import { CompaniesSearchQuerySchema, PaginatedCompanyCardSchema } from '@/validators/company';
import { searchCompanies } from '@/services/company.search.service';
import { jsonOk, jsonFail } from '@/lib/response';
import { ApiCode } from '@/lib/status';
import { ZodError } from 'zod';
import { AppError } from '@/lib/error';
import { CompaniesSearchPayload } from '@/types/company';
import { DEFAULT_PAGE_SIZE } from '@/app/constants/common';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const { q, page, pageSize } = CompaniesSearchQuerySchema.parse({
      q: url.searchParams.get('q'),
      page: url.searchParams.get('page') ?? undefined,
      pageSize: url.searchParams.get('pageSize') ?? undefined,
    });

    const dto = await searchCompanies(q, page ?? 1, pageSize ?? DEFAULT_PAGE_SIZE); // Info: (20250812 - Tzuhan) <-- 這裡已經把 cards 組好了

    const payload = dto as CompaniesSearchPayload;

    // Info: (20250812 - Tzuhan) dev 防呆：用 Zod 保證 payload 形狀（上線可關）
    PaginatedCompanyCardSchema.parse(payload);
    return jsonOk(payload, 'List fetched successfully');
  } catch (err) {
    if (err instanceof AppError) {
      return jsonFail(err.code, err.message);
    }
    if (err instanceof ZodError) {
      return jsonFail(ApiCode.VALIDATION_ERROR, err.issues.map((i) => i.message).join('; '));
    }
    const message = err instanceof Error ? err.message : 'Unexpected error';
    return jsonFail(ApiCode.SERVER_ERROR, message);
  }
}

import { NextRequest } from 'next/server';
import { CompaniesSearchQuerySchema, PaginatedCompanyCardSchema } from '@/validators/company';
import { searchCompanies } from '@/services/company.service';
import { jsonOk, jsonFail } from '@/lib/response';
import { ApiCode } from '@/lib/status';
import { ZodError } from 'zod';
import { AppError } from '@/lib/error';
import { CompaniesSearchPayload } from '@/types/company';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const { q, page, pageSize } = CompaniesSearchQuerySchema.parse({
      q: url.searchParams.get('q'),
      page: url.searchParams.get('page'),
      pageSize: url.searchParams.get('pageSize'),
    });

    const dto = await searchCompanies(q, page, pageSize); // Info: (20250812 - Tzuhan) <-- 這裡已經把 cards 組好了

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

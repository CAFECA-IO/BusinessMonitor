import { NextRequest } from 'next/server';
import { CompaniesSearchQuerySchema, CompaniesSearchPayloadSchema } from '@/validators/company';
import { buildCompanyCards, searchCompanies } from '@/services/company.service';
import { jsonOk, jsonFail } from '@/lib/response';
import { ApiCode } from '@/lib/status';
import { ZodError } from 'zod';
import { AppError } from '@/lib/error';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const { q, page, pageSize } = CompaniesSearchQuerySchema.parse({
      q: url.searchParams.get('q'),
      page: url.searchParams.get('page'),
      pageSize: url.searchParams.get('pageSize'),
    });

    const dto = await searchCompanies(q, page, pageSize); // <- 只呼叫 service
    const cards = await buildCompanyCards(dto.items);

    const payload = {
      total: dto.pagination.total,
      page: dto.pagination.page,
      pageSize: dto.pagination.pageSize,
      items: cards,
    };

    // Info: (20250812 - Tzuhan) dev 防呆：用 Zod 保證 payload 形狀（上線可關）
    CompaniesSearchPayloadSchema.parse(payload);

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

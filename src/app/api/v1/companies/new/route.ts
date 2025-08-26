import { NextRequest } from 'next/server';
import { jsonOk, jsonFail, ok } from '@/lib/response';
import { ApiCode } from '@/lib/status';
import { ZodError } from 'zod';
import { AppError } from '@/lib/error';
import { NewCompaniesQuery, NewCompaniesResponse } from '@/validators/company';
import { listNewCompanies } from '@/services/company.new.service';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const { limit } = NewCompaniesQuery.parse({
      limit: url.searchParams.get('limit') ?? undefined,
    });
    const items = await listNewCompanies(limit);

    NewCompaniesResponse.parse(ok(items));

    const res = jsonOk(items, 'OK');
    res.headers.set('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res;
  } catch (err) {
    if (err instanceof AppError) return jsonFail(err.code, err.message);
    if (err instanceof ZodError)
      return jsonFail(ApiCode.VALIDATION_ERROR, err.issues.map((i) => i.message).join('; '));
    return jsonFail(ApiCode.SERVER_ERROR, err instanceof Error ? err.message : 'Unexpected error');
  }
}

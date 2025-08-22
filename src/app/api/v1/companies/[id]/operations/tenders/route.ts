import { NextRequest } from 'next/server';
import { jsonOk, jsonFail } from '@/lib/response';
import { ApiCode } from '@/lib/status';
import { ZodError } from 'zod';
import { AppError } from '@/lib/error';
import { CompanyIdParam } from '@/validators';
import { PageQuery } from '@/validators/common';
import { TenderResponse } from '@/validators/company.operations';
import { listTenders } from '@/services/company.operations.service';

type Ctx = { params: { id: string } };

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = CompanyIdParam.parse(ctx.params);

    const url = new URL(req.url);
    const { page, pageSize } = PageQuery.parse({
      page: url.searchParams.get('page') ?? undefined,
      pageSize: url.searchParams.get('pageSize') ?? undefined,
    });

    const payload = await listTenders(id, page, pageSize);

    // Info: (20250822 - Tzuhan) 開發期型別防呆
    TenderResponse.parse({
      powerby: 'BusinessMonitor api 1.0.0',
      success: true,
      code: 'OK',
      message: 'OK',
      payload,
    });

    const res = jsonOk(payload, 'OK');
    res.headers.set('Cache-Control', 's-maxage=300');
    return res;
  } catch (err) {
    if (err instanceof ZodError) {
      const body = {
        powerby: 'BusinessMonitor api 1.0.0',
        success: false,
        code: 'VALIDATION_ERROR' as const,
        message: err.issues.map((i) => i.message).join('; '),
        payload: null,
      };
      return new Response(JSON.stringify(body), {
        status: 422, // Info: (20250822 - Tzuhan) AC：422
        headers: { 'content-type': 'application/json; charset=utf-8' },
      });
    }
    if (err instanceof AppError) return jsonFail(err.code, err.message);
    return jsonFail(ApiCode.SERVER_ERROR, err instanceof Error ? err.message : 'Unexpected error');
  }
}

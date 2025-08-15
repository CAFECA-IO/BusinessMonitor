import { NextRequest } from 'next/server';
import { jsonOk, jsonFail } from '@/lib/response';
import { AppError } from '@/lib/error';
import { ApiCode } from '@/lib/status';
import { CompanyIdParam } from '@/validators';
import { getCompanyBasic } from '@/services/company.detail.service';

type Ctx = { params: { id: string } };

export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    const { id } = CompanyIdParam.parse(ctx.params);
    const payload = await getCompanyBasic(id);
    return jsonOk(payload);
  } catch (err) {
    if (err instanceof AppError) return jsonFail(err.code, err.message);
    return jsonFail(ApiCode.SERVER_ERROR, 'Internal Server Error');
  }
}

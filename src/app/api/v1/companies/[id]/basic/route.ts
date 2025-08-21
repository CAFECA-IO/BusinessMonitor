import { NextRequest } from 'next/server';
import { jsonOk, jsonFail } from '@/lib/response';
import { AppError } from '@/lib/error';
import { ApiCode } from '@/lib/status';
import { CompanyIdParam } from '@/validators';
import { getCompanyBasic } from '@/services/company.detail.service';
import { withCompanyView } from '@/lib/with_company_view';

type Ctx = { params: { id: string } };

export const GET = withCompanyView(async (_req: NextRequest, ctx: Ctx) => {
  try {
    const { id } = CompanyIdParam.parse(ctx.params);
    const payload = await getCompanyBasic(id);
    return jsonOk(payload);
  } catch (err) {
    if (err instanceof AppError) return jsonFail(err.code, err.message);
    return jsonFail(ApiCode.SERVER_ERROR, 'Internal Server Error');
  }
});

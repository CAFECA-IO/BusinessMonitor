// Deprecated: (20250821 - Tzuhan) 這裡的實作已經不再使用
import { NextRequest, NextResponse } from 'next/server';
import { ApiCode } from '@/lib/status';
import { jsonFail } from '@/lib/response';
import { ZodError } from 'zod';
import { AppError } from '@/lib/error';
import { CompanyIdParam } from '@/validators';
import { recordCompanyView } from '@/services/company.view.service';
import { clientIp, ipUaHash } from '@/lib/request';

type Ctx = { params: { id: string } };

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = CompanyIdParam.parse(ctx.params);
    const ipHash = ipUaHash(clientIp(req), req.headers.get('user-agent'));
    const sessionId = req.headers.get('x-session-id') ?? req.cookies.get('sid')?.value;
    const { created } = await recordCompanyView(id, ipHash, sessionId);

    return NextResponse.json(
      {
        powerby: 'BusinessMonitor api 1.0.0',
        success: true,
        code: 'OK',
        message: created ? 'Created' : 'Already counted',
        payload: { created },
      },
      { status: created ? 201 : 200 }
    );
  } catch (err) {
    if (err instanceof AppError) return jsonFail(err.code, err.message);
    if (err instanceof ZodError)
      return jsonFail(ApiCode.VALIDATION_ERROR, err.issues.map((i) => i.message).join('; '));
    return jsonFail(ApiCode.SERVER_ERROR, err instanceof Error ? err.message : 'Unexpected error');
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/lib/response';
import { AppError } from '@/lib/error';
import { ApiCode } from '@/lib/status';
import { assertAuth } from '@/lib/auth';
import { loggerFromRequest } from '@/lib/logger';
import { withCompanyView } from '@/lib/with_company_view';

const toInt = (v: string): number => {
  const n = Number.parseInt(v, 10);
  if (Number.isNaN(n)) throw new AppError(ApiCode.VALIDATION_ERROR, 'Invalid id');
  return n;
};

export const GET = withCompanyView(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const log = loggerFromRequest({ method: 'GET', url: `/api/v1/companies/${params.id}` });
    try {
      // middleware 現在只檢 Cookie presence；驗章在這裡做
      const user = await assertAuth(req); // ← 加 await
      log.debug('auth ok', { userId: user.id });

      const id = toInt(params.id);
      const company = await prisma.company.findUnique({ where: { id } });
      if (!company) throw new AppError(ApiCode.NOT_FOUND, 'Company not found');

      return NextResponse.json(ok(company));
    } catch (e) {
      const err = e as AppError;
      const status = err.http ?? 500;
      log.error('get company failed', { code: err.code, message: err.message });
      return NextResponse.json(fail(err.code ?? ApiCode.SERVER_ERROR, err.message), { status });
    }
  }
);

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/lib/response';
import { AppError } from '@/lib/error';
import { ApiCode } from '@/lib/status';
import { loggerFromRequest } from '@/lib/logger';
import { withCompanyView } from '@/lib/with_company_view';

const toInt = (v: string): number => {
  const n = Number.parseInt(v, 10);
  if (Number.isNaN(n)) throw new AppError(ApiCode.VALIDATION_ERROR, 'Invalid id');
  return n;
};

const getCompany = async (req: NextRequest, { params }: { params: { id: string } }) => {
  const log = loggerFromRequest({ method: 'GET', url: `/api/v1/companies/${params.id}` });
  try {
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
};

// export const GET = getCompany;
export const GET = withCompanyView(getCompany);

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/lib/response';
import { AppError } from '@/lib/error';
import { ApiCode } from '@/lib/status';
import { loggerFromRequest } from '@/lib/logger';

const toInt = (v: string): number => {
  const n = Number.parseInt(v, 10);
  if (Number.isNaN(n)) throw new AppError(ApiCode.VALIDATION_ERROR, 'Invalid id');
  return n;
};

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const log = loggerFromRequest({ method: 'GET', url: `/api/v1/companies/${params.id}` });
  try {
    const id = toInt(params.id);
    const company = await prisma.company.findUnique({ where: { id } });
    if (!company) throw new AppError(ApiCode.NOT_FOUND, 'Company not found');
    log.info('company found', { id });
    return NextResponse.json(ok(company));
  } catch (e) {
    const err = e as AppError;
    log.error('get company failed', { message: err.message, code: err.code });
    const http = err.http ?? 500;
    return NextResponse.json(fail(err.code ?? ApiCode.SERVER_ERROR, err.message), { status: http });
  }
}

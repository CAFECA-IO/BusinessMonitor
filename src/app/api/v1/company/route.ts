import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok } from '@/lib/response';
import { AppError } from '@/lib/error';
import { ApiCode } from '@/lib/status';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const company = await prisma.company.findUnique({
    where: { id: Number(params.id) },
  });
  if (!company) throw new AppError(ApiCode.NOT_FOUND, 'Company not found');
  return NextResponse.json(ok(company));
}

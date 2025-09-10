import { NextRequest } from 'next/server';
import { jsonOk, jsonFail } from '@/lib/response';
import { AppError } from '@/lib/error';
import { ApiCode } from '@/lib/status';
import { getHandshakeSignature } from '@/lib/sign';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest, { params }: { params: { message: string } }) {
  try {
    const { message } = params;
    const result = getHandshakeSignature(message);
    return jsonOk(result);
  } catch (err) {
    if (err instanceof AppError) return jsonFail(err.code, err.message);
    return jsonFail(ApiCode.SERVER_ERROR, 'Internal Server Error');
  }
}

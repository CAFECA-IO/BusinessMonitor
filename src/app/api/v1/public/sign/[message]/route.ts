import { NextRequest } from 'next/server';
import { jsonOk, jsonFail } from '@/lib/response';
import { AppError } from '@/lib/error';
import { ApiCode } from '@/lib/status';
import { getHandshakeSignature } from '@/lib/sign';

export async function GET(req: NextRequest, { params }: { params: Promise<{ message: string }> }) {
  try {
    const { message } = await params;
    const result = await getHandshakeSignature(message);
    return jsonOk(result);
  } catch (err) {
    if (err instanceof AppError) return jsonFail(err.code, err.message);
    console.error(err);
    return jsonFail(ApiCode.SERVER_ERROR, 'Internal Server Error');
  }
}

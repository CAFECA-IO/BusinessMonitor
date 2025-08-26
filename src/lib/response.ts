import { NextResponse } from 'next/server';
import { ApiCode } from '@/lib/status';

export interface ApiResponse<T> {
  powerby: string;
  success: boolean;
  code: ApiCode;
  message: string;
  payload: T | null;
}

const POWERBY = process.env.NEXT_PUBLIC_API_POWERBY ?? 'BusinessMonitor api 1.0.0';

export const ok = <T>(payload: T, message = 'OK'): ApiResponse<T> => ({
  powerby: POWERBY,
  success: true,
  code: ApiCode.OK,
  message,
  payload,
});

export const fail = (code: ApiCode, message: string): ApiResponse<null> => ({
  powerby: POWERBY,
  success: false,
  code,
  message,
  payload: null,
});

export const jsonOk = <T>(payload: T, message = 'OK', init?: ResponseInit) =>
  NextResponse.json<ApiResponse<T>>(ok(payload, message), init);

export const jsonFail = (code: ApiCode, message: string, init?: ResponseInit) =>
  NextResponse.json<ApiResponse<null>>(fail(code, message), {
    status: httpStatusOf(code),
    ...init,
  });

function httpStatusOf(code: ApiCode): number {
  switch (code) {
    case ApiCode.OK:
      return 200;
    case ApiCode.VALIDATION_ERROR:
      return 400;
    case ApiCode.UNAUTHENTICATED:
      return 401;
    case ApiCode.FORBIDDEN:
      return 403;
    case ApiCode.NOT_FOUND:
      return 404;
    default:
      return 500;
  }
}

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

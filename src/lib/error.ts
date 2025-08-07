import { ApiCode, HttpMap } from './status';
import { fail, ApiResponse } from './response';

export class AppError extends Error {
  readonly code: ApiCode;
  readonly http: number;

  constructor(code: ApiCode, message: string) {
    super(message);
    this.code = code;
    this.http = HttpMap[code] ?? 500;
    Error.captureStackTrace(this, this.constructor);
  }

  mapToResponse(): ApiResponse<null> {
    return fail(this.code, this.message);
  }
}

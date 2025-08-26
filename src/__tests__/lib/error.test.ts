import { AppError } from '@/lib/error';
import { ApiCode } from '@/lib/status';

describe('AppError', () => {
  it('mapToResponse()', () => {
    const err = new AppError(ApiCode.FORBIDDEN, 'no');
    const res = err.mapToResponse();
    expect(res).toEqual({
      powerby: expect.any(String),
      success: false,
      code: ApiCode.FORBIDDEN,
      message: 'no',
      payload: null,
    });
  });
});

import { ok, fail } from '@/lib/response';
import { ApiCode } from '@/lib/status';

describe('ApiResponse helpers', () => {
  it('ok()', () => {
    const res = ok({ foo: 1 });
    expect(res).toMatchObject({
      success: true,
      code: ApiCode.OK,
      payload: { foo: 1 },
    });
  });

  it('fail()', () => {
    const res = fail(ApiCode.NOT_FOUND, 'missing');
    expect(res).toMatchObject({
      success: false,
      code: ApiCode.NOT_FOUND,
      payload: null,
    });
  });
});

import { jsonOk, jsonFail } from '@/lib/response';
import { ApiCode } from '@/lib/status';

describe('lib/response', () => {
  it('jsonOk：預設 200、成功、payload 帶入', async () => {
    const res = jsonOk({ a: 1 });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.code).toBe('OK'); // Info: (20250813 - Tzuhan) 覆蓋 OK 分支
    expect(body.message).toBeTruthy(); // Info: (20250813 - Tzuhan) 預設訊息
    expect(body.payload).toEqual({ a: 1 });
  });

  it('jsonOk：自訂訊息與狀態碼', async () => {
    const res = jsonOk(null, 'created', { status: 201 });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.message).toBe('created'); // Info: (20250813 - Tzuhan) 覆蓋自訂 message 分支
    expect(body.payload).toBeNull(); // Info: (20250813 - Tzuhan) 覆蓋 null payload
  });

  it('jsonFail：預設 500', async () => {
    const res = jsonFail(ApiCode.SERVER_ERROR, 'boom');
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe(ApiCode.SERVER_ERROR); // Info: (20250813 - Tzuhan) 覆蓋錯誤代碼分支
    expect(body.message).toBe('boom');
    expect(body.payload).toBeNull();
  });

  it('jsonFail：自訂 404', async () => {
    const res = jsonFail(ApiCode.NOT_FOUND, 'missing', { status: 404 });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe(ApiCode.NOT_FOUND);
    expect(body.message).toBe('missing');
  });
});

describe('lib/response http status mapping', () => {
  it.each([
    [ApiCode.VALIDATION_ERROR, 400],
    [ApiCode.UNAUTHENTICATED, 401],
    [ApiCode.FORBIDDEN, 403],
    [ApiCode.NOT_FOUND, 404],
    [ApiCode.SERVER_ERROR, 500],
  ])('jsonFail maps %s -> %d', async (code, expected) => {
    const res = jsonFail(code, 'x');
    expect(res.status).toBe(expected);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe(code);
    expect(body.payload).toBeNull();
  });

  it('covers OK branch of httpStatusOf (for coverage only)', async () => {
    // Info: (20250813 - Tzuhan) jsonOk 本身也會是 200，但不會經過 httpStatusOf
    expect(jsonOk(null).status).toBe(200);

    // Info: (20250813 - Tzuhan) 只為覆蓋率：用 jsonFail 觸發 httpStatusOf 的 OK 分支
    const res = jsonFail(ApiCode.OK, 'coverage-only');
    expect(res.status).toBe(200);
  });
});

import { jsonOk, jsonFail } from '@/lib/response';
import { ApiCode } from '@/lib/status';

describe('lib/response', () => {
  it('jsonOk：預設 200、成功、payload 帶入', async () => {
    const res = jsonOk({ a: 1 });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.powerby).toBe('Business Monitor API');
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

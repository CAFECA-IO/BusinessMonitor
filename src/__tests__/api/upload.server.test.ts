import path from 'node:path';
import fs from 'node:fs';
import { getAgent } from '@/__tests__/helpers/agent';
import { routes } from '@/config/api_routes';
import { ApiCode } from '@/lib/status';

const agent = getAgent();
const uploadUrl = routes.upload.file();

describe('POST /api/v1/upload (integration)', () => {
  const testFileName = 'test-image.png';
  const testFilePath = path.join(__dirname, '..', 'fixtures', testFileName);

  beforeAll(() => {
    // Info: (20251023 - Tzuhan) 確保測試檔案存在 (如果不存在，建立一個小的 PNG)
    if (!fs.existsSync(testFilePath)) {
      fs.mkdirSync(path.dirname(testFilePath), { recursive: true });
      const tinyPng = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
        'base64'
      );
      fs.writeFileSync(testFilePath, tinyPng);
      console.log(`Created dummy test file at ${testFilePath}`);
    }
  });

  it.skip('400 Bad Request: 沒有附加檔案', async () => {
    const res = await agent.post(uploadUrl).expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe(ApiCode.VALIDATION_ERROR);
    expect(res.body.message).toContain('No file uploaded');
  });

  it('400 Bad Request: 附加檔案但 field name 不對 (不是 "file")', async () => {
    const res = await agent.post(uploadUrl).attach('wrongFieldName', testFilePath).expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe(ApiCode.VALIDATION_ERROR);
    expect(res.body.message).toContain('incorrect field name');
  });

  // Info: (20251023 - Tzuhan) --- 200 測試案例 (不需登入) ---
  it('200 OK: 成功上傳檔案並回傳 name, size, url (無需登入)', async () => {
    const res = await agent.post(uploadUrl).attach('file', testFilePath).expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.code).toBe(ApiCode.OK);

    // Info: (20251023 - Tzuhan) 驗證 payload 結構 { name, size, url }
    expect(res.body.payload).toHaveProperty('name', testFileName);
    expect(res.body.payload).toHaveProperty('size');
    expect(typeof res.body.payload.size).toBe('string');
    expect(Number(res.body.payload.size)).toBeGreaterThan(0);
    expect(res.body.payload).toHaveProperty('url');
    expect(typeof res.body.payload.url).toBe('string');

    // Info: (20251023 - Tzuhan) 驗證 URL 格式
    const expectedDomain = process.env.STORAGE_DOMAIN;
    const expectedUrlPattern = new RegExp(`^${expectedDomain}/api/v1/file/Qm[a-zA-Z0-9]+$`);
    expect(res.body.payload.url).toMatch(expectedUrlPattern);
  });
});

import http from 'node:http';
import next from 'next';
import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

declare global {
  var __BM_SERVER__: http.Server | undefined;
}

export default async function globalSetup() {
  const app = next({ dev: false });
  await app.prepare();
  const handle = app.getRequestHandler();
  const server = http.createServer((req, res) => handle(req, res));
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Failed to get server address');
  }
  const { port } = address;
  // Info: (20250812 - Tzuhan) 記錄在暫存檔讓測試讀取
  const info = { port };
  writeFileSync(join(tmpdir(), 'bm_next_test.json'), JSON.stringify(info));
  global.__BM_SERVER__ = server; // Info: (20250812 - Tzuhan)teardown 用
}

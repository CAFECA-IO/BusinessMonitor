import http from 'node:http';
import next from 'next';

export async function createNextTestServer() {
  const app = next({ dev: true });
  await app.prepare();
  const handle = app.getRequestHandler();
  const server = http.createServer((req, res) => handle(req, res));
  return server;
}

export default async function globalTeardown() {
  const server = global.__BM_SERVER__ as import('http').Server | undefined;
  if (server) await new Promise<void>((resolve) => server.close(() => resolve()));
}

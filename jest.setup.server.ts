jest.setTimeout(30_000);
process.env.NEXT_TELEMETRY_DISABLED = '1';
process.env.NEXT_PUBLIC_API_POWERBY =
  process.env.NEXT_PUBLIC_API_POWERBY ?? 'BusinessMonitor api 1.0.0-test';

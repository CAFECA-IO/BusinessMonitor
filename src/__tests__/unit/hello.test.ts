import { GET } from '@/app/api/v1/hello/route';
import { NextResponse } from 'next/server';

describe('GET /api/hello', () => {
  it('應回傳 { message: "Hello, world!" } 並帶狀態 200', async () => {
    const res = await GET();
    expect(res).toBeInstanceOf(NextResponse);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toEqual({ message: 'Hello, world!' });
  });
});

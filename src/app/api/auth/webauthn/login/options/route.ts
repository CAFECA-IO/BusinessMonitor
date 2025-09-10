import { NextRequest } from 'next/server';
import { jsonOk } from '@/lib/response';
import { env } from '@/lib/env';
import { issueChallenge } from '@/lib/challenge';
import { z } from 'zod';
export const runtime = 'nodejs';

const Body = z.object({ email: z.string().email().optional() });

export async function POST(req: NextRequest) {
  Body.parse(await req.json().catch(() => ({}))); // 目前走 discoverable，不必強制 email

  const ticket = await issueChallenge('login', 120);
  const options = {
    challenge: ticket.challengeHex,
    rpId: env.RPID,
    timeout: 60_000,
    userVerification: 'required' as const,
    allowCredentials: undefined, // discoverable credential
    challengeTicket: ticket.token, // 自訂欄位
  };
  return jsonOk(options);
}

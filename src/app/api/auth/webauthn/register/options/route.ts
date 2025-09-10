import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { env } from '@/lib/env';
import { issueChallenge } from '@/lib/challenge';
import { ok, fail } from '@/lib/response';
import { ApiCode } from '@/lib/status';
export const runtime = 'nodejs';

const Body = z.object({
  userId: z.string().min(1),
  displayName: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { userId, displayName } = Body.parse(await req.json());
    const ticket = await issueChallenge('register', 180);

    // 傳回「純淨 WebAuthn options」＋「challengeTicket」
    const options = {
      rp: { id: env.RPID, name: 'BusinessMonitor' },
      user: { id: userId, name: userId, displayName: displayName ?? userId },
      challenge: ticket.challengeHex, // 十六進位字串（配合 passwordless-id 客戶端）
      timeout: 60_000,
      attestation: 'none' as const,
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }], // ES256
      authenticatorSelection: {
        userVerification: 'required' as const,
        residentKey: 'preferred' as const,
      },
    };

    return NextResponse.json(ok({ options, challengeTicket: ticket.token }));
  } catch {
    return NextResponse.json(fail(ApiCode.VALIDATION_ERROR, 'Bad Request'), { status: 400 });
  }
}

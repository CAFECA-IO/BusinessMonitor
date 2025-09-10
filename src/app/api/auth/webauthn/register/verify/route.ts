import { NextRequest } from 'next/server';
import { jsonOk, jsonFail } from '@/lib/response';
import { server } from '@passwordless-id/webauthn';
import { prisma } from '@/lib/prisma';
import { env } from '@/lib/env';
import { verifyChallenge } from '@/lib/challenge';
import { z } from 'zod';
import { ApiCode } from '@/lib/status';
export const runtime = 'nodejs';

const Body = z.object({
  userId: z.string().min(1),
  userData: z.any(), // RegistrationJSON（第三方型別，Zod 不好扁平驗）
  challengeTicket: z.string(), // 我們簽過的 ticket
});

export async function POST(req: NextRequest) {
  try {
    const { userId, userData, challengeTicket } = Body.parse(await req.json());
    const challenge = await verifyChallenge('register', challengeTicket);

    const expectedData = {
      challenge,
      origin: env.ORIGIN,
      userVerified: true,
      counter: -1,
    };

    const info = await server.verifyRegistration(userData, expectedData);
    // 持久化 Credential
    await prisma.credential.create({
      data: {
        userId,
        credentialId: info.credential.id,
        publicKey: info.credential.publicKey,
        counter: 0,
      },
    });

    return jsonOk({ ok: true, credentialId: info.credential.id });
  } catch {
    return jsonFail(ApiCode.VALIDATION_ERROR, 'Registration verify failed');
  }
}

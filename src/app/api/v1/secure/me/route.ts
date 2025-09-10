import { NextRequest } from 'next/server';
import { jsonOk } from '@/lib/response';
import { prisma } from '@/lib/prisma';
import { verifyDeWT } from '@/lib/dewt';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return jsonOk({ user: { isGuest: true } });
  }

  const token = authHeader.substring(7);

  try {
    const payload = await verifyDeWT(token);
    if (!payload.sub) {
      return jsonOk({ user: { isGuest: true, reason: 'Token has no subject' } });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true },
    });

    if (!user) {
      return jsonOk({ user: { isGuest: true, reason: 'User not found' } });
    }

    return jsonOk({ user: { ...user, isGuest: false, scope: payload.scope } });
  } catch {
    return jsonOk({ user: { isGuest: true, reason: 'Invalid token' } });
  }
}

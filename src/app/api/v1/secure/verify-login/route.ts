import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getPusherInstance } from '@/lib/pusher';
import { webAuthnRepo } from '@/repositories/webauthn.repo';
import { jsonFail } from '@/lib/response';
import { ApiCode } from '@/lib/status';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const socketId = formData.get('socket_id') as string;
    const channel = formData.get('channel_name') as string;

    const sessionId = channel.substring('private-login-session-'.length);

    if (!socketId || !channel || !sessionId) {
      return jsonFail(
        ApiCode.VALIDATION_ERROR,
        'Bad request: socket_id, channel_name, and a valid sessionId are required.'
      );
    }

    const session = await webAuthnRepo.findPairingSessionById(sessionId);
    if (!session || session.status !== 'PENDING') {
      // Info: (20251001-tzuhan) 找不到對應的 session 或 session 狀態不正確，拒絕授權
      return jsonFail(
        ApiCode.FORBIDDEN,
        'Forbidden: No active pairing session found for this channel.'
      );
    }

    const authData = {
      user_id: `desktop-client-${socketId}`,
    };
    const pusherServer = getPusherInstance();
    const authResponse = pusherServer.authorizeChannel(socketId, channel, authData);

    // Info: (20251001-tzuhan) 成功時的回應格式由 Pusher 客戶端函式庫定義，我們直接回傳其產生的物件
    return NextResponse.json(authResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    logger.error('Pusher auth error', { errorMessage: message });
    return jsonFail(
      ApiCode.SERVER_ERROR,
      'An internal error occurred during Pusher authentication.'
    );
  }
}

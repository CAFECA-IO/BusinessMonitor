import { NextRequest, NextResponse } from 'next/server';
import { getPusherInstance } from '@/lib/pusher';
import { webAuthnRepo } from '@/repositories/webauthn.repo';
import { jsonFail } from '@/lib/response';
import { ApiCode } from '@/lib/status';
import { logger } from '@/lib/logger';

/**
 * Info: (20251001-tzuhan)
 * POST /api/pusher/auth
 *
 * 這個 API 路由是 Pusher 客戶端函式庫專用的授權端點。
 * 當前端嘗試訂閱一個 `private-` 開頭的頻道時，
 * Pusher 客戶端會自動向此端點發送 POST 請求以獲取授權。
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const socketId = formData.get('socket_id') as string;
    const channel = formData.get('channel_name') as string;

    // 從頻道名稱中解析出 sessionId
    const sessionId = channel.substring('private-login-session-'.length);

    if (!socketId || !channel || !sessionId) {
      return jsonFail(
        ApiCode.VALIDATION_ERROR,
        'Bad Request: socket_id and channel_name are required.'
      );
    }

    // 驗證這個 session 是否存在且有效，這是確保安全性的關鍵步驟
    const session = await webAuthnRepo.findPairingSessionById(sessionId);
    if (!session || session.status !== 'PENDING') {
      logger.warn('Pusher auth denied for invalid or non-pending session', { sessionId });
      return jsonFail(ApiCode.FORBIDDEN, 'Forbidden: No active pairing session found.');
    }

    const pusherServer = getPusherInstance();

    // 如果 session 驗證通過，則授權該 socket 訂閱此頻道
    const authResponse = pusherServer.authorizeChannel(socketId, channel);

    return NextResponse.json(authResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    logger.error('Pusher auth error', { errorMessage: message });
    return jsonFail(ApiCode.SERVER_ERROR, 'Pusher authentication failed.');
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getPusherInstance } from '@/lib/pusher';
import { webAuthnRepo } from '@/repositories/webauthn.repo';
import { jsonFail } from '@/lib/response';
import { ApiCode } from '@/lib/status';
import { logger } from '@/lib/logger';
import { AppError } from '@/lib/error';

export async function POST(request: NextRequest) {
  try {
    /**
     * Info: (20251001-tzuhan) 【關鍵修正】
     * Pusher-js 發送的是 x-www-form-urlencoded 格式，不能用 formData() 解析。
     * 我們需要先讀取 body 為文字，再用 URLSearchParams 解析。
     */
    const body = await request.text();
    const params = new URLSearchParams(body);
    const socketId = params.get('socket_id');
    const channelName = params.get('channel_name');

    if (!socketId || !channelName) {
      throw new AppError(ApiCode.VALIDATION_ERROR, 'socket_id and channel_name are required.');
    }

    const sessionId = channelName.substring('private-login-session-'.length);
    if (!sessionId) {
      throw new AppError(ApiCode.VALIDATION_ERROR, 'Invalid channel name, missing session ID.');
    }

    // Info: (20251001-tzuhan) 驗證 session 是否存在且有效
    const session = await webAuthnRepo.findPairingSessionById(sessionId);
    if (!session || session.status !== 'PENDING') {
      return jsonFail(ApiCode.FORBIDDEN, 'Forbidden: No active pairing session found.');
    }

    const userData = {
      user_id: `desktop-client-${socketId}`,
    };

    const pusherServer = getPusherInstance();

    const authResponse = pusherServer.authorizeChannel(socketId, channelName, userData);

    return NextResponse.json(authResponse);
  } catch (error) {
    const isAppError = error instanceof AppError;
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    logger.error('Pusher auth error', { errorMessage: message });

    return jsonFail(
      isAppError ? error.code : ApiCode.SERVER_ERROR,
      `An internal error occurred during Pusher authentication.${isAppError ? ` (${message})` : ''}`
    );
  }
}

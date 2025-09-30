import { WebSocketServer, WebSocket } from 'ws';
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { parse } from 'url';
import { randomBytes } from 'crypto';
import { PrismaClient } from '@prisma/client';
import { signDeWT } from '@/lib/dewt';
import { webAuthnRepo } from '@/repositories/webauthn.repo';
import { logger } from '@/lib/logger';

const prisma = new PrismaClient();
const sessions = new Map<string, WebSocket>();

// Info: (20250930 - Tzuhan) 將 HTTP 請求處理邏輯提取出來
const httpRequestHandler = (req: IncomingMessage, res: ServerResponse) => {
  const { pathname } = parse(req.url || '', true);

  // Info: (20250930 - Tzuhan) 【處理來自 Next.js API 的內部通知請求
  if (req.method === 'POST' && pathname === '/internal/notify-login') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        const { sessionId, identityId } = JSON.parse(body);
        if (!sessionId || !identityId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Missing sessionId or identityId' }));
          return;
        }

        // Info: (20250930 - Tzuhan) 執行登入成功的後續操作
        await completeLoginAndNotify(sessionId, identityId);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Notification received.' }));
      } catch (error) {
        console.error('Internal notification error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Failed to process notification.' }));
      }
    });
  } else {
    // Info: (20250930 - Tzuhan) 對於所有其他 HTTP 請求，直接回應 404
    res.writeHead(404);
    res.end();
  }
};

const server = createServer(httpRequestHandler);
const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (ws: WebSocket) => {
  console.log('WebSocket client connected');

  ws.on('message', async (message: string) => {
    try {
      const data = JSON.parse(message);

      if (data.type === 'REQUEST_QR_CODE') {
        const challenge = randomBytes(32).toString('base64url');
        const expiresAt = new Date(Date.now() + 3 * 60 * 1000); // 3 分鐘後過期

        const session = await prisma.devicePairingSession.create({
          data: {
            challenge,
            expiresAt,
          },
        });

        const sessionId = session.id;
        sessions.set(sessionId, ws); // 追蹤此連線

        ws.send(
          JSON.stringify({
            type: 'QR_CODE_DATA',
            payload: { sessionId, challenge },
          })
        );

        // Info: (20250930 - Tzuhan) 設定計時器，在會話過期時通知客戶端並清理
        setTimeout(() => {
          if (sessions.has(sessionId)) {
            ws.send(
              JSON.stringify({ type: 'LOGIN_ERROR', payload: { message: 'Session expired.' } })
            );
            ws.close();
            sessions.delete(sessionId);
          }
        }, expiresAt.getTime() - Date.now());
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
      ws.send(JSON.stringify({ type: 'ERROR', payload: { message: 'Invalid message format' } }));
    }
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    // Info: (20250930 - Tzuhan) 清理斷開的連線
    for (const [sessionId, clientWs] of sessions.entries()) {
      if (clientWs === ws) {
        sessions.delete(sessionId);
        break;
      }
    }
  });
});

server.on('upgrade', (request, socket, head) => {
  const { pathname } = parse(request.url || '', true);

  if (pathname === '/ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

// Info: (20250930 - Tzuhan) 這個函式現在只在 server.ts 內部使用
async function completeLoginAndNotify(sessionId: string, identityId: string) {
  const ws = sessions.get(sessionId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    const identityAccount = await webAuthnRepo.findIdentityAccountById(identityId);
    if (!identityAccount) {
      throw new Error('Identity account not found after successful FIDO2 verification.');
    }

    const dewt = await signDeWT(identityAccount);

    ws.send(
      JSON.stringify({
        type: 'LOGIN_SUCCESS',
        payload: { dewt },
      })
    );

    // Info: (20250930 - Tzuhan) 任務完成，關閉連線並清理
    ws.close();
    sessions.delete(sessionId);
    await prisma.devicePairingSession.update({
      where: { id: sessionId },
      data: { status: 'COMPLETED', identityId },
    });
    return true;
  }
  // Info: (20250930 - Tzuhan) 如果找不到 WebSocket 連線，也需要更新資料庫狀態
  await prisma.devicePairingSession.update({
    where: { id: sessionId },
    data: { status: 'AUTHORIZED', identityId }, // 標記為已授權，但可能客戶端已斷線
  });
  logger.warn(`WebSocket for session ${sessionId} not found or not open.`);
  return false;
}

const port = process.env.WS_PORT || 3001;
server.listen(port, () => {
  console.log(`WebSocket server is listening on port ${port}`);
});

// Info: (20250930 - Tzuhan) 啟動一個定時任務（每 5 分鐘執行一次），清理資料庫中過期的 session
setInterval(
  async () => {
    const now = new Date();
    await prisma.devicePairingSession.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
        status: 'PENDING',
      },
    });
  },
  5 * 60 * 1000
);

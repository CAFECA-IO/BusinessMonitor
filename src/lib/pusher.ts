import Pusher from 'pusher';

// Info: (20251001-tzuhan) 確保所有必要的環境變數都已設定
if (
  !process.env.PUSHER_APP_ID ||
  !process.env.NEXT_PUBLIC_PUSHER_KEY ||
  !process.env.PUSHER_SECRET ||
  !process.env.NEXT_PUBLIC_PUSHER_CLUSTER
) {
  throw new Error('Pusher environment variables are not fully configured.');
}

// Info: (20251001-tzuhan) 初始化 Pusher 伺服器端實例
// 應為 Singleton，以避免重複建立連線
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
  useTLS: true,
});

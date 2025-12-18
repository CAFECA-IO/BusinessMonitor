import { NextRequest, NextResponse } from 'next/server';

const STORAGE_DOMAIN = process.env.STORAGE_DOMAIN;
const STORAGE_API_GET_BASE_URL = `${STORAGE_DOMAIN}/api/v1/file`;

// Info: (20251218 - Tzuhan) 簡單的 Magic Number 檢測，用於修正 octet-stream 問題
function detectMimeType(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer).subarray(0, 4);
  const header = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();

  if (header.startsWith('89504E47')) return 'image/png';
  if (header.startsWith('FFD8FF')) return 'image/jpeg'; // JPEG
  if (header.startsWith('47494638')) return 'image/gif'; // GIF
  if (header.startsWith('424D')) return 'image/bmp'; // BMP
  if (header.startsWith('52494646') && header.endsWith('57454250')) return 'image/webp'; // WebP (需更複雜判斷，這裡簡化)

  return 'application/octet-stream'; // 無法識別，維持原樣
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ hash: string }> }) {
  const { hash } = await params;

  if (!hash) {
    return new NextResponse('Missing hash', { status: 400 });
  }

  const targetUrl = `${STORAGE_API_GET_BASE_URL}/${hash}`;

  try {
    // Info: (20251218 - Tzuhan) 1. 向 Storage Server 請求檔案
    const response = await fetch(targetUrl);

    if (!response.ok) {
      return new NextResponse('File not found or storage error', { status: response.status });
    }

    // 1. 取得 Storage 回傳的 Content-Type
    let contentType = response.headers.get('content-type') || 'application/octet-stream';

    // 2. 如果是通用格式，嘗試讀取檔案內容來修正 Content-Type
    // Info: 因為是用於頭像顯示，檔案通常不大，讀入記憶體處理是可接受的
    const arrayBuffer = await response.arrayBuffer();

    if (contentType === 'application/octet-stream' || contentType === 'binary/octet-stream') {
      const detectedType = detectMimeType(arrayBuffer);
      if (detectedType !== 'application/octet-stream') {
        console.log(`[View Proxy] Correcting MIME type from ${contentType} to ${detectedType}`);
        contentType = detectedType;
      }
    }

    // 3. 回傳修正後的 Response
    return new NextResponse(arrayBuffer, {
      status: response.status,
      statusText: response.statusText,
      headers: new Headers({
        'Content-Type': contentType, // 設定正確的圖片類型 (如 image/png)
        'Content-Disposition': 'inline', // 強制在瀏覽器內顯示
        'Cache-Control': 'public, max-age=31536000, immutable',
      }),
    });
  } catch (error) {
    console.error('Proxy view error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

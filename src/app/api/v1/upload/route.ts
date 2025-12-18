import { NextRequest } from 'next/server';
import { jsonOk, jsonFail } from '@/lib/response';
import { ApiCode } from '@/lib/status';
import { AppError } from '@/lib/error';
import { loggerFromRequest } from '@/lib/logger';

const STORAGE_DOMAIN = process.env.STORAGE_DOMAIN;
if (!STORAGE_DOMAIN) {
  // Info: (20251023 - Tzuhan) 嚴重錯誤，紀錄下來，讓服務無法正常啟動或明確報錯
  console.error('FATAL: STORAGE_DOMAIN environment variable is not set.');
  // throw new Error("STORAGE_DOMAIN environment variable is not set.");
}
const STORAGE_API_UPLOAD_URL = `${STORAGE_DOMAIN}/api/v1/file`;
const STORAGE_API_GET_BASE_URL = `${STORAGE_DOMAIN}/api/v1/file`;

export async function POST(req: NextRequest) {
  const log = loggerFromRequest(req);
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      throw new AppError(
        ApiCode.VALIDATION_ERROR,
        'No file uploaded or incorrect field name (expected "file")'
      );
    }
    log.info('Received file', { fileName: file.name, fileSize: file.size, fileType: file.type });

    const storageFormData = new FormData();
    storageFormData.append('file', file, file.name);

    log.info('Forwarding file to storage API', { url: STORAGE_API_UPLOAD_URL });
    const storageRes = await fetch(STORAGE_API_UPLOAD_URL, {
      method: 'POST',
      body: storageFormData,
    });

    const storageData = await storageRes.json();

    if (!storageRes.ok || !storageData.success) {
      log.error('Storage API returned error', { status: storageRes.status, response: storageData });
      throw new AppError(
        ApiCode.SERVER_ERROR,
        `Storage service error: ${storageData.message || 'Failed to upload file'}`
      );
    }

    log.info('File uploaded successfully via storage API', { response: storageData });

    const { hash, name, size } = storageData.payload;
    if (!hash) {
      log.error('Storage API response missing hash in payload', { response: storageData });
      throw new AppError(
        ApiCode.SERVER_ERROR,
        'Storage service returned invalid response (missing hash)'
      );
    }

    const viewUrl = `${STORAGE_API_GET_BASE_URL}/${hash}`;
    // const viewUrl = `/api/v1/view/${hash}`;

    return jsonOk({
      name,
      size,
      url: viewUrl,
    });
  } catch (err) {
    log.error('Upload API failed', {
      errorMessage: err instanceof Error ? err.message : 'Unknown error',
      code: err instanceof AppError ? err.code : ApiCode.SERVER_ERROR,
    });
    if (err instanceof AppError) {
      return jsonFail(err.code, err.message);
    }
    return jsonFail(
      ApiCode.SERVER_ERROR,
      err instanceof Error ? err.message : 'Unexpected server error'
    );
  }
}

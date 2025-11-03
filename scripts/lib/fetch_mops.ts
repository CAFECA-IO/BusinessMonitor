import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// Info: (20251030 - Tzuhan) 設定 MOPS 緩存資料夾
const CACHE_DIR = path.resolve(process.cwd(), 'private/data/mops');
// Info: (20251030 - Tzuhan) 確保資料夾存在
fs.mkdirSync(CACHE_DIR, { recursive: true });

/**
 * 清理 MOPS 傳回的字串（移除 &nbsp; 和 －）
 */
function cleanString(str: string | undefined | null): string | null {
  if (!str) return null;
  const cleaned = str.replace(/&nbsp;/g, '').trim();
  return cleaned === '' || cleaned === '－' ? null : cleaned;
}

/**
 * Info: (20251030 - Tzuhan)
 * 將民國日期（例如 107/06/20）轉換為 Date 物件
 */
function rocDateToDate(rocStr: string | null): Date | null {
  if (!rocStr) return null;
  const parts = rocStr.match(/(\d+)\/(\d+)\/(\d+)/);
  if (!parts) return null;

  try {
    const year = parseInt(parts[1], 10) + 1911;
    const month = parseInt(parts[2], 10) - 1; // Info: (20251030 - Tzuhan) JS 月份從 0 開始
    const day = parseInt(parts[3], 10);
    return new Date(Date.UTC(year, month, day));
  } catch {
    return null;
  }
}

/**
 * Info: (20251030 - Tzuhan)
 * 將資本額字串（例如 810,024,170元）轉換為 Decimal
 */
function parseCapitalToDecimal(capStr: string | null): Prisma.Decimal | null {
  if (!capStr) return null;
  try {
    const numStr = capStr.replace(/[元,]/g, '').trim();
    if (numStr === '') return null;
    return new Decimal(numStr);
  } catch {
    return null;
  }
}

/**
 * Info: (20251030 - Tzuhan)
 * (Helper) 從 JSON 緩存中「再水合」資料類型
 */
function rehydrateCacheData(cachedData: unknown): Prisma.CompanyCreateInput | null {
  if (cachedData === null || typeof cachedData !== 'object' || cachedData === undefined) {
    return null;
  }
  const data = cachedData as Record<string, unknown>;
  return {
    ...data,
    establishedDate: data.establishedDate ? new Date(data.establishedDate as string) : null,
    capitalAmount: data.capitalAmount ? new Decimal(data.capitalAmount as string) : null,
  } as Prisma.CompanyCreateInput;
}

/**
 * Info: (20251030 - Tzuhan)
 * 爬取 MOPS (公開資訊觀測站) 的公司基本資料
 * @param symbol 股票代號
 * @returns 適用於 Prisma.CompanyCreateInput 的物件，或 null
 */
export async function fetchCompanyDataBySymbol(
  symbol: string
): Promise<Prisma.CompanyCreateInput | null> {
  const cachePath = path.join(CACHE_DIR, `${symbol}.json`);

  // Info: (20251030 - Tzuhan) --- 步驟 1: 檢查緩存 ---
  if (fs.existsSync(cachePath)) {
    try {
      const cachedRaw = fs.readFileSync(cachePath, 'utf-8');
      const cachedData = JSON.parse(cachedRaw);
      console.log(`[INFO] MOPS-CACHE: 讀取 ${symbol} 的緩存資料成功。`);
      // Info: (20251030 - Tzuhan) 重新水合 Date / Decimal
      return rehydrateCacheData(cachedData);
    } catch (e) {
      console.warn(`[WARN] MOPS-CACHE: 讀取 ${symbol} 緩存失敗，將重新爬取...`, e);
    }
  }

  // Info: (20251030 - Tzuhan) --- 步驟 2: (無緩存) 執行網路爬取 ---
  const url = 'https://mopsov.twse.com.tw/mops/web/ajax_t05st03';
  const payload = new URLSearchParams({
    encodeURIComponent: '1',
    step: '1',
    firstin: '1',
    off: '1',
    keyword4: '',
    code1: '',
    TYPEK2: '',
    checkbtn: '',
    queryName: 'co_id',
    inpuType: 'co_id',
    TYPEK: 'all',
    co_id: symbol,
  });

  try {
    const res = await axios.post(url, payload.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Host: 'mopsov.twse.com.tw',
        Origin: 'https://mopsov.twse.com.tw',
        Referer: 'https://mopsov.twse.com.tw/mops/web/t05st03',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36',
      },
    });

    const $ = cheerio.load(res.data);
    let companyInfo: Prisma.CompanyCreateInput | null = null;

    const pageTitle = $('table.noBorder .compName b').text();
    if (pageTitle && pageTitle.includes('公司提供')) {
      const registrationNo = cleanString($("th:contains('營利事業統一編號')").next('td').text());
      const name =
        cleanString($("th:contains('公司名稱')").next('td').text()) || `${symbol}-UNKNOWN`;

      if (registrationNo) {
        // Info: (20251030 - Tzuhan) 成功爬取到公司資料
        companyInfo = {
          name: name,
          registrationNo: registrationNo,
          representative: cleanString($("th:contains('董事長')").next('td').text()),
          address: cleanString($("th:contains('地址')").next('td').text()),
          establishedDate: rocDateToDate(
            cleanString($("th:contains('公司成立日期')").next('td').text())
          ),
          capitalAmount: parseCapitalToDecimal(
            cleanString($("th:contains('實收資本額')").next('td').text())
          ),
          websiteUrl: cleanString($("th:contains('公司網址')").next('td').find('a').attr('href')),
          registrationCountry: 'Taiwan',
        };
        console.log(`[INFO] MOPS: 成功爬取 ${symbol} -> ${registrationNo} (${name})`);
      } else {
        console.warn(`[WARN] MOPS: ${symbol} (${name}) 爬取成功，但找不到統一編號。`);
      }
    } else {
      console.log(`[INFO] MOPS: 股票代號 ${symbol} 查無公司資料 (可能為 ETF 或權證)。`);
      // Info: (20251030 - Tzuhan) companyInfo 保持 null
    }

    // Info: (20251030 - Tzuhan) --- 步驟 3: 寫入緩存 (無論成功或失敗) ---
    // Info: (20251030 - Tzuhan) (我們將 null 也寫入，避免重複爬取 ETF)
    fs.writeFileSync(cachePath, JSON.stringify(companyInfo));
    console.log(`[INFO] MOPS-CACHE: 已將 ${symbol} 的爬取結果寫入緩存。`);

    return companyInfo;
  } catch (error) {
    console.error(`[FAIL] 爬取 MOPS 代號 ${symbol} 資料時發生網路錯誤:`, error);
    return null;
  }
}

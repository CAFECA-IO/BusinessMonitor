import { NextRequest } from 'next/server';
import { jsonOk, jsonFail } from '@/lib/response';
import { AppError } from '@/lib/error';
import { ApiCode } from '@/lib/status';
import { AutocompleteQuery } from '@/validators';
import { autocompleteCompanies } from '@/services/company.autocomplete.service';

export async function GET(req: NextRequest) {
  try {
    const qs = Object.fromEntries(new URL(req.url).searchParams);
    const { q, limit } = AutocompleteQuery.parse(qs);
    const items = await autocompleteCompanies(q, limit);
    // Info: (20250818 - Tzuhan) 自動完成：就算查不到也回 200 + 空陣列
    return jsonOk({ items });
  } catch (err) {
    if (err instanceof AppError) return jsonFail(err.code, err.message);
    return jsonFail(ApiCode.SERVER_ERROR, 'Internal Server Error');
  }
}

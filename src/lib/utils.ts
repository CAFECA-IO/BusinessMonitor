export const stripZeroWidth = (s: string) => s.replace(/[\u200B-\u200D\u2060\uFEFF]/g, '');
export const toHalfWidth = (s: string) =>
  s.replace(/[！-～]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0));
export const stripCompanySuffix = (s: string) => s.replace(/(股份有限公?司|有限公?司|公司)$/g, '');
export const escapeLike = (s: string) =>
  s.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_');

export type QueryMeta = {
  normalized: string;
  digitsOnly: boolean;
  regNoCandidate: string | undefined;
  hasChinese: boolean;
  isShort: boolean;
  isLikelyRegNo: boolean;
  suspicious: boolean;
};

export function analyzeQuery(raw: string): QueryMeta {
  const clean0 = stripZeroWidth(raw);
  const clean = stripCompanySuffix(toHalfWidth(clean0.trim().replace(/^["']+|["']+$/g, '')));
  const digitsOnly = /^\d+$/.test(clean);
  const meta: QueryMeta = {
    normalized: clean,
    digitsOnly,
    regNoCandidate: digitsOnly ? clean : undefined,
    hasChinese: /[\u4e00-\u9fa5]/.test(clean),
    isShort: clean.length < 2,
    isLikelyRegNo: /^\d{8}$/.test(clean),
    suspicious: /(\x00|--|\/\*|\*\/|;|=|\bOR\b|\bAND\b|\|\||&&)/i.test(clean),
  };
  return meta;
}

export function isImprobableQuery(meta: QueryMeta): boolean {
  const s = meta.normalized;
  return !meta.hasChinese && !meta.digitsOnly && s.length >= 24 && /\d{6,}/.test(s);
}

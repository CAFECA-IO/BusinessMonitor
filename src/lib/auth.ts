import jwt, { SignOptions, VerifyOptions, JwtPayload as RawJwtPayload } from 'jsonwebtoken';
import { z } from 'zod';
import { AppError } from '@/lib/error';
import { ApiCode } from '@/lib/status';

export type Provider = 'google' | 'apple' | 'facebook' | 'did';

// payload 以 sub 作為 user id，保留你要求的 provider 聯登型別
export const JwtPayloadSchema = z.object({
  sub: z.string().min(1), // user id
  email: z.string().email(),
  name: z.string().min(1),
  avatar: z.url().optional().default(''),
  provider: z.union([
    z.literal('google'),
    z.literal('apple'),
    z.literal('facebook'),
    z.literal('did'),
  ]),
  roles: z.array(z.string()).optional(), // 如不需要可不放
  iat: z.number().optional(),
  exp: z.number().optional(),
});

export type JwtPayload = z.infer<typeof JwtPayloadSchema>;

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  provider: Provider;
  roles?: string[];
};

// -- 金鑰自動切換：優先使用非對稱（public/private），否則使用對稱（secret）
const SECRET = process.env.JWT_SECRET ?? process.env.AUTH_JWT_SECRET ?? '';
const PUBLIC_KEY = process.env.JWT_PUBLIC_KEY ?? process.env.AUTH_JWT_PUBLIC_KEY ?? '';
const PRIVATE_KEY = process.env.JWT_PRIVATE_KEY ?? process.env.AUTH_JWT_PRIVATE_KEY ?? '';

const signAlgorithm = PRIVATE_KEY ? ('RS256' as const) : ('HS256' as const);

export const signJwt = (
  payload: Omit<JwtPayload, 'iat' | 'exp'>,
  options: SignOptions = { expiresIn: '15m', algorithm: signAlgorithm }
): string => {
  if (PRIVATE_KEY) return jwt.sign(payload, PRIVATE_KEY, { ...options, algorithm: 'RS256' });
  if (!SECRET) throw new Error('JWT_SECRET or JWT_PRIVATE_KEY is required to sign JWT');
  return jwt.sign(payload, SECRET, { ...options, algorithm: 'HS256' });
};

const verifyOptions: VerifyOptions = PRIVATE_KEY
  ? { algorithms: ['RS256'] }
  : { algorithms: ['HS256'] };

export const verifyJwt = (token: string): JwtPayload => {
  try {
    const raw = PRIVATE_KEY
      ? (jwt.verify(token, PUBLIC_KEY || PRIVATE_KEY, verifyOptions) as RawJwtPayload)
      : (jwt.verify(token, SECRET, verifyOptions) as RawJwtPayload);
    const parsed = JwtPayloadSchema.safeParse(raw);
    if (!parsed.success) throw new AppError(ApiCode.UNAUTHENTICATED, 'Invalid token payload');
    return parsed.data;
  } catch (err: unknown) {
    // expired / invalid 都歸類 UNAUTHENTICATED
    throw new AppError(ApiCode.UNAUTHENTICATED, 'Invalid or expired token');
  }
};

// 供 API handler 直接使用的斷言：取出 Authorization: Bearer <token>，驗證並回傳 AuthUser
export const assertAuth = (req: Request): AuthUser => {
  const auth = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer '))
    throw new AppError(ApiCode.UNAUTHENTICATED, 'Missing Authorization header');

  const token = auth.slice('Bearer '.length).trim();
  const payload = verifyJwt(token);
  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name,
    avatar: payload.avatar,
    provider: payload.provider,
    roles: payload.roles,
  };
};

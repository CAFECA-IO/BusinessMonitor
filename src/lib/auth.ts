import jwt, { SignOptions } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET ?? 'change-me-now';

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  avatar: string;
  provider: 'google' | 'apple' | 'facebook' | 'did';
  iat?: number;
  exp?: number;
}

export const signJwt = (
  payload: Omit<JwtPayload, 'iat' | 'exp'>,
  options: SignOptions = { expiresIn: '15m' }
) => jwt.sign(payload, JWT_SECRET, options);

export const verifyJwt = (token: string): JwtPayload => jwt.verify(token, JWT_SECRET) as JwtPayload;

import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const SESSION_LIFETIME_MINUTES = parseInt(process.env.SESSION_LIFETIME_MINUTES || '60', 10);
const COOKIE_NAME = 'session';

interface JWTPayload {
  sub: string;
}

export function set(res: Response, userId: string): void {
  const token = jwt.sign({ sub: userId }, JWT_SECRET, {
    expiresIn: `${SESSION_LIFETIME_MINUTES}m`,
  });

  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    maxAge: SESSION_LIFETIME_MINUTES * 60 * 1000,
  });
}

export function readUserId(req: Request): string | null {
  try {
    const token = req.cookies?.[COOKIE_NAME];

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded.sub || null;
  } catch (error) {
    return null;
  }
}

export function clear(res: Response): void {
  const isProduction = process.env.NODE_ENV === 'production';

  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
  });
}
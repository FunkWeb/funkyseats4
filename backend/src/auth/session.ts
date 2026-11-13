import type { CookieOptions, Request, Response } from 'express'
import jwt from 'jsonwebtoken'

const COOKIE_NAME = 'session'
const ALGORITHM = 'HS256'

interface SessionDeps {
  secret: string
  lifetimeMinutes: number
  secure: boolean
}

export interface SessionIdentity {
  userId: number
  sessionVersion: number
}

export const createSession = ({ secret, lifetimeMinutes, secure }: SessionDeps) => {
  const baseCookieOptions: CookieOptions = { httpOnly: true, sameSite: 'lax', secure }

  const verifiedIdentity = (token: string): SessionIdentity | null => {
    try {
      const payload = jwt.verify(token, secret, { algorithms: [ALGORITHM] })
      if (typeof payload === 'string') return null
      const userId = Number(payload.sub)
      const sessionVersion: unknown = payload.ver
      return Number.isInteger(userId) && Number.isInteger(sessionVersion)
        ? { userId, sessionVersion: sessionVersion as number }
        : null
    } catch {
      return null
    }
  }

  const readIdentity = (req: Request): SessionIdentity | null => {
    const token: string | undefined = req.cookies[COOKIE_NAME]
    return token ? verifiedIdentity(token) : null
  }

  return {
    setSessionCookie: (res: Response, { userId, sessionVersion }: SessionIdentity): void => {
      const token = jwt.sign({ sub: String(userId), ver: sessionVersion }, secret, {
        algorithm: ALGORITHM,
        expiresIn: `${lifetimeMinutes}m`,
      })
      res.cookie(COOKIE_NAME, token, { ...baseCookieOptions, maxAge: lifetimeMinutes * 60_000 })
    },

    clearSessionCookie: (res: Response): void => {
      res.clearCookie(COOKIE_NAME, baseCookieOptions)
    },

    readIdentity,

    readUserId: (req: Request): number | null => readIdentity(req)?.userId ?? null,
  }
}

export type Session = ReturnType<typeof createSession>

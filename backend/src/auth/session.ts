import type { CookieOptions, Request, Response } from 'express'
import jwt from 'jsonwebtoken'

const COOKIE_NAME = 'session'
const ALGORITHM = 'HS256'

interface SessionDeps {
  secret: string
  lifetimeMinutes: number
  secure: boolean
}

export const createSession = ({ secret, lifetimeMinutes, secure }: SessionDeps) => {
  const baseCookieOptions: CookieOptions = { httpOnly: true, sameSite: 'lax', secure }

  const verifiedUserId = (token: string): number | null => {
    try {
      const payload = jwt.verify(token, secret, { algorithms: [ALGORITHM] })
      const userId = typeof payload === 'string' ? NaN : Number(payload.sub)
      return Number.isInteger(userId) ? userId : null
    } catch {
      return null
    }
  }

  return {
    setSessionCookie: (res: Response, userId: number): void => {
      const token = jwt.sign({ sub: String(userId) }, secret, {
        algorithm: ALGORITHM,
        expiresIn: `${lifetimeMinutes}m`,
      })
      res.cookie(COOKIE_NAME, token, { ...baseCookieOptions, maxAge: lifetimeMinutes * 60_000 })
    },

    clearSessionCookie: (res: Response): void => {
      res.clearCookie(COOKIE_NAME, baseCookieOptions)
    },

    readUserId: (req: Request): number | null => {
      const token: string | undefined = req.cookies[COOKIE_NAME]
      return token ? verifiedUserId(token) : null
    },
  }
}

export type Session = ReturnType<typeof createSession>

import { OAuth2Client } from 'google-auth-library'
import { config } from '../config/index.js'
import { ForbiddenError } from '../errors/appErrors.js'

export interface GoogleProfile {
  googleId: string
  name: string
  email: string
  avatarPath: string | null
}

const client = new OAuth2Client(
  config.google.clientId,
  config.google.clientSecret,
  config.google.callbackUrl,
)

export const buildGoogleAuthUrl = (state: string) =>
  client.generateAuthUrl({ scope: ['openid', 'email', 'profile'], state })

export const fetchGoogleProfile = async (code: string): Promise<GoogleProfile> => {
  const { tokens } = await client.getToken(code)
  if (!tokens.id_token) throw new ForbiddenError('Google returned no ID token')

  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: config.google.clientId,
  })
  const payload = ticket.getPayload()
  if (!payload?.email || !payload.email_verified)
    throw new ForbiddenError('Google email is not verified')

  return {
    googleId: payload.sub,
    name: payload.name ?? payload.email,
    email: payload.email,
    avatarPath: payload.picture ?? null,
  }
}

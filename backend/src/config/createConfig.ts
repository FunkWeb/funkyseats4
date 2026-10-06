type EnvSource = Record<string, string | undefined>

export const createConfig = (source: EnvSource) => {
  const requireEnv = (name: string): string => {
    const value = source[name]
    if (!value) throw new Error(`Missing environment variable: ${name}`)
    return value
  }

  const optionalPort = (name: string, fallback: number): number => {
    const raw = source[name]
    if (!raw) return fallback

    const value = Number(raw)
    if (!Number.isInteger(value) || value < 1 || value > 65535) {
      throw new Error(`Environment variable ${name} must be a port number`)
    }
    return value
  }

  return {
    port: optionalPort('PORT', 3000),
    db: {
      host: requireEnv('DB_HOST'),
      port: optionalPort('DB_PORT', 3306),
      user: requireEnv('DB_USER'),
      password: requireEnv('DB_PASSWORD'),
      database: requireEnv('DB_NAME'),
    },
    google: {
      clientId: requireEnv('GOOGLE_CLIENT_ID'),
      clientSecret: requireEnv('GOOGLE_CLIENT_SECRET'),
    },
  } as const
}

type EnvSource = Record<string, string | undefined>

export const createConfig = (source: EnvSource) => {
  const requireEnv = (name: string): string => {
    const value = source[name]
    if (!value) throw new Error(`Missing environment variable: ${name}`)
    return value
  }

  const optionalNumber = (name: string, fallback: number): number => {
    const raw = source[name]
    if (!raw) return fallback

    const value = Number(raw)
    if (Number.isNaN(value)) throw new Error(`Environment variable ${name} must be a number`)
    return value
  }

  return {
    port: optionalNumber('PORT', 3000),
    db: {
      host: requireEnv('DB_HOST'),
      port: optionalNumber('DB_PORT', 3306),
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

export const config = createConfig(process.env)

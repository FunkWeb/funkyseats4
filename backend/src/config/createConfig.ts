export type EnvSource = Record<string, string | undefined>

export const requireEnv = (source: EnvSource, name: string): string => {
  const value = source[name]
  if (!value) throw new Error(`Missing environment variable: ${name}`)
  return value
}

export const optionalPort = (source: EnvSource, name: string, fallback: number): number => {
  const raw = source[name]
  if (!raw) return fallback

  const value = Number(raw)
  if (!Number.isInteger(value) || value < 1 || value > 65535) {
    throw new Error(`Environment variable ${name} must be a port number`)
  }
  return value
}

export const createDbConfig = (source: EnvSource) =>
  ({
    host: requireEnv(source, 'DB_HOST'),
    port: optionalPort(source, 'DB_PORT', 3306),
    user: requireEnv(source, 'DB_USER'),
    password: requireEnv(source, 'DB_PASSWORD'),
    database: requireEnv(source, 'DB_NAME'),
  }) as const

export const createConfig = (source: EnvSource) =>
  ({
    port: optionalPort(source, 'PORT', 3000),
    db: createDbConfig(source),
    google: {
      clientId: requireEnv(source, 'GOOGLE_CLIENT_ID'),
      clientSecret: requireEnv(source, 'GOOGLE_CLIENT_SECRET'),
    },
  }) as const

export type EnvSource = Record<string, string | undefined>

const toPort = (name: string, raw: string): number => {
  const value = Number(raw)
  if (!Number.isInteger(value) || value < 1 || value > 65535) {
    throw new Error(`Environment variable ${name} must be a port number`)
  }
  return value
}

export const readEnv = (source: EnvSource) => {
  const required = (name: string): string => {
    const value = source[name]
    if (!value) throw new Error(`Missing environment variable: ${name}`)
    return value
  }

  return {
    required,
    port: (name: string, fallback: number): number => {
      const raw = source[name]
      return raw ? toPort(name, raw) : fallback
    },
    requiredPort: (name: string): number => toPort(name, required(name)),
  }
}

export const createDbConfig = (source: EnvSource) => {
  const env = readEnv(source)
  return {
    host: env.required('DB_HOST'),
    port: env.port('DB_PORT', 3306),
    user: env.required('DB_USER'),
    password: env.required('DB_PASSWORD'),
    database: env.required('DB_NAME'),
  } as const
}

export const createConfig = (source: EnvSource) => {
  const env = readEnv(source)
  return {
    port: env.port('PORT', 3000),
    db: createDbConfig(source),
    google: {
      clientId: env.required('GOOGLE_CLIENT_ID'),
      clientSecret: env.required('GOOGLE_CLIENT_SECRET'),
    },
  } as const
}

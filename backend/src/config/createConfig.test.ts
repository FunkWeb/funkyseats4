import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createConfig } from '../config/createConfig.js'

const validEnv = {
  FRONTEND_URL: 'http://localhost:5173',
  DB_HOST: 'db-host',
  DB_USER: 'db-user',
  DB_PASSWORD: 'db-password',
  DB_NAME: 'db-name',
  GOOGLE_CLIENT_ID: 'google-id',
  GOOGLE_CLIENT_SECRET: 'google-secret',
  GOOGLE_CALLBACK_URL: 'http://localhost/callback',
  GOOGLE_ALLOWED_DOMAIN: 'example.no',
  SESSION_SECRET: 'session-secret',
} as const

type RequiredKey = keyof typeof validEnv

const without = (key: RequiredKey) =>
  Object.fromEntries(Object.entries(validEnv).filter(([k]) => k !== key))

const ports = [
  { name: 'PORT', fallback: 3000, read: (config: ReturnType<typeof createConfig>) => config.port },
  {
    name: 'DB_PORT',
    fallback: 3306,
    read: (config: ReturnType<typeof createConfig>) => config.db.port,
  },
] as const

describe('createConfig', () => {
  it('maps every required variable', () => {
    const config = createConfig(validEnv)
    assert.deepEqual(
      {
        frontendUrl: config.frontendUrl,
        db: { ...config.db, port: undefined },
        google: config.google,
        sessionSecret: config.session.secret,
      },
      {
        frontendUrl: 'http://localhost:5173',
        db: {
          host: 'db-host',
          port: undefined,
          user: 'db-user',
          password: 'db-password',
          database: 'db-name',
        },
        google: {
          clientId: 'google-id',
          clientSecret: 'google-secret',
          callbackUrl: 'http://localhost/callback',
          allowedDomain: 'example.no',
        },
        sessionSecret: 'session-secret',
      },
    )
  })

  for (const key of Object.keys(validEnv) as RequiredKey[]) {
    const missing = new RegExp(`Missing environment variable: ${key}`)

    it(`throws when ${key} is absent`, () => {
      assert.throws(() => createConfig(without(key)), missing)
    })

    it(`throws when ${key} is empty`, () => {
      assert.throws(() => createConfig({ ...validEnv, [key]: '' }), missing)
    })
  }

  for (const { name, fallback, read } of ports) {
    it(`uses ${fallback} when ${name} is unset or empty`, () => {
      assert.equal(read(createConfig(validEnv)), fallback)
      assert.equal(read(createConfig({ ...validEnv, [name]: '' })), fallback)
    })

    it(`parses ${name} as a number`, () => {
      assert.equal(read(createConfig({ ...validEnv, [name]: '8080' })), 8080)
    })

    for (const value of ['abc', '3306abc', ' ', '12.5', '-1', '70000']) {
      it(`throws when ${name} is ${JSON.stringify(value)}`, () => {
        assert.throws(
          () => createConfig({ ...validEnv, [name]: value }),
          new RegExp(`${name} must be a port number`),
        )
      })
    }
  }

  describe('SESSION_LIFETIME_MINUTES', () => {
    const lifetime = (value?: string) =>
      createConfig({ ...validEnv, SESSION_LIFETIME_MINUTES: value }).session.lifetimeMinutes

    it('uses 120 when unset or empty', () => {
      assert.equal(lifetime(), 120)
      assert.equal(lifetime(''), 120)
    })

    it('parses as a number', () => {
      assert.equal(lifetime('90'), 90)
    })

    for (const value of ['1h', '0', '-1', '12.5', ' ']) {
      it(`throws when ${JSON.stringify(value)}`, () => {
        assert.throws(() => lifetime(value), /SESSION_LIFETIME_MINUTES must be a positive integer/)
      })
    }
  })
})

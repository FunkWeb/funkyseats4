import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createConfig } from '../config/createConfig.js'

const validEnv = {
  DB_HOST: 'db-host',
  DB_USER: 'db-user',
  DB_PASSWORD: 'db-password',
  DB_NAME: 'db-name',
  GOOGLE_CLIENT_ID: 'google-id',
  GOOGLE_CLIENT_SECRET: 'google-secret',
} as const

type RequiredKey = keyof typeof validEnv

const without = (key: RequiredKey) =>
  Object.fromEntries(Object.entries(validEnv).filter(([k]) => k !== key))

const ports = [
  { name: 'PORT', fallback: 3000, read: (config: ReturnType<typeof createConfig>) => config.port },
  { name: 'DB_PORT', fallback: 3306, read: (config: ReturnType<typeof createConfig>) => config.db.port },
] as const

describe('createConfig', () => {
  it('maps every required variable', () => {
    const config = createConfig(validEnv)
    assert.deepEqual(
      { db: { ...config.db, port: undefined }, google: config.google },
      {
        db: {
          host: 'db-host',
          port: undefined,
          user: 'db-user',
          password: 'db-password',
          database: 'db-name',
        },
        google: { clientId: 'google-id', clientSecret: 'google-secret' },
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
})

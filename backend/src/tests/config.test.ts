import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createConfig } from '../config.js'

const validEnv = {
  DB_HOST: 'localhost',
  DB_USER: 'app',
  DB_PASSWORD: 'secret',
  DB_NAME: 'bookings',
  GOOGLE_CLIENT_ID: 'id',
  GOOGLE_CLIENT_SECRET: 'secret',
}

describe('createConfig', () => {
  it('reads required variables', () => {
    assert.equal(createConfig(validEnv).db.host, 'localhost')
  })

  it('uses the default port when DB_PORT is unset', () => {
    assert.equal(createConfig(validEnv).db.port, 3306)
  })

  it('throws when a required variable is missing', () => {
    assert.throws(
      () => createConfig({ ...validEnv, DB_HOST: '' }),
      /Missing environment variable: DB_HOST/,
    )
  })

  it('throws when a number variable is not a number', () => {
    assert.throws(() => createConfig({ ...validEnv, DB_PORT: 'abc' }), /DB_PORT must be a number/)
  })
})

import { after, before, beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import type { Server } from 'node:http'
import os from 'node:os'
import path from 'node:path'
import express, { type RequestHandler } from 'express'
import { errorHandler } from '../../src/errors/errorHandler.js'
import { createFeaturesRoutes } from '../../src/routes/featuresRoutes.js'
import type { FeaturesService } from '../../src/services/featuresService.js'

const VALID_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>'

describe('featuresRoutes /features/icons', () => {
  let server: Server
  let baseUrl: string
  let uploadsDir: string
  let currentRole: 'ADMIN' | 'CANDIDATE' = 'ADMIN'

  const stubFeaturesService: Pick<FeaturesService, 'findAll' | 'create'> = {
    findAll: async () => [],
    create: async () => 1,
  }

  const fakeRequireAuth: RequestHandler = (req, _res, next) => {
    req.user = {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      avatarPath: null,
      role: currentRole,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    }
    next()
  }

  before(async () => {
    uploadsDir = await fs.mkdtemp(path.join(os.tmpdir(), 'funkyseats-icons-test-'))

    const app = express()
    app.use(express.json())
    app.use(
      '/features',
      createFeaturesRoutes({
        featuresService: stubFeaturesService,
        requireAuth: fakeRequireAuth,
        uploadsDir,
      }),
    )
    app.use(errorHandler)

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address()
        if (address && typeof address === 'object') {
          baseUrl = `http://127.0.0.1:${address.port}`
        }
        resolve()
      })
    })
  })

  beforeEach(() => {
    currentRole = 'ADMIN'
  })

  after(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()))
    })
    await fs.rm(uploadsDir, { recursive: true, force: true })
  })

  it('uploads a valid SVG icon for an admin user and saves it to disk', async () => {
    const res = await fetch(`${baseUrl}/features/icons`, {
      method: 'POST',
      headers: { 'Content-Type': 'image/svg+xml' },
      body: VALID_SVG,
    })

    assert.equal(res.status, 201)
    const body = (await res.json()) as { iconPath: string }
    assert.match(body.iconPath, /^\/api\/uploads\/icons\/[a-f0-9-]+\.svg$/)

    const filename = path.basename(body.iconPath)
    const savedContent = await fs.readFile(path.join(uploadsDir, 'icons', filename), 'utf8')
    assert.equal(savedContent, VALID_SVG)
  })

  it('rejects uploads with wrong Content-Type with 415', async () => {
    const res = await fetch(`${baseUrl}/features/icons`, {
      method: 'POST',
      headers: { 'Content-Type': 'image/png' },
      body: VALID_SVG,
    })

    assert.equal(res.status, 415)
  })

  it('rejects SVG files larger than 100 KB with 413', async () => {
    const oversizedSvg = `<svg xmlns="http://www.w3.org/2000/svg">${'a'.repeat(101 * 1024)}</svg>`
    const res = await fetch(`${baseUrl}/features/icons`, {
      method: 'POST',
      headers: { 'Content-Type': 'image/svg+xml' },
      body: oversizedSvg,
    })

    assert.equal(res.status, 413)
  })

  it('rejects non-SVG content with 400', async () => {
    const res = await fetch(`${baseUrl}/features/icons`, {
      method: 'POST',
      headers: { 'Content-Type': 'image/svg+xml' },
      body: '<div>Not an SVG</div>',
    })

    assert.equal(res.status, 400)
  })

  it('rejects unsafe SVG containing script tags or inline event handlers with 400', async () => {
    const scriptSvg = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'
    const scriptRes = await fetch(`${baseUrl}/features/icons`, {
      method: 'POST',
      headers: { 'Content-Type': 'image/svg+xml' },
      body: scriptSvg,
    })
    assert.equal(scriptRes.status, 400)

    const onloadSvg = '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"></svg>'
    const onloadRes = await fetch(`${baseUrl}/features/icons`, {
      method: 'POST',
      headers: { 'Content-Type': 'image/svg+xml' },
      body: onloadSvg,
    })
    assert.equal(onloadRes.status, 400)
  })

  it('rejects non-admin users with 403', async () => {
    currentRole = 'CANDIDATE'
    const res = await fetch(`${baseUrl}/features/icons`, {
      method: 'POST',
      headers: { 'Content-Type': 'image/svg+xml' },
      body: VALID_SVG,
    })

    assert.equal(res.status, 403)
  })

  it('rejects creating a feature with an unauthorized iconPath prefix', async () => {
    const res = await fetch(`${baseUrl}/features`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Kaffemaskin',
        description: null,
        iconPath: 'https://evil.example.com/icon.svg',
        category: 'AMENITIES',
      }),
    })

    assert.equal(res.status, 400)
  })
})

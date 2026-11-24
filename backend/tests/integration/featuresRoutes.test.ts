import { after, before, beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import type { Server } from 'node:http'
import os from 'node:os'
import path from 'node:path'
import express, { type RequestHandler } from 'express'
import type { FeatureDto } from '../../../contracts/feature.js'
import type { FeaturesRepository } from '../../src/repositories/featuresRepository.js'
import { errorHandler } from '../../src/errors/errorHandler.js'
import { serveUploadedIcons } from '../../src/middleware/serveUploadedIcons.js'
import { createFeaturesRoutes } from '../../src/routes/featuresRoutes.js'
import { createFeaturesService } from '../../src/services/featuresService.js'
import type { FeaturesService } from '../../src/services/featuresService.js'

const VALID_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>'

describe('featuresRoutes', () => {
  let server: Server
  let baseUrl: string
  let uploadsDir: string
  let currentRole: 'ADMIN' | 'CANDIDATE' = 'ADMIN'
  const featureRecords = new Map<number, FeatureDto>()

  const featuresRepository = {
    findAll: async () => [...featureRecords.values()],
    findById: async (id: number) => featureRecords.get(id) ?? null,
    create: async () => 2,
    update: async (id: number, input: Parameters<FeaturesRepository['update']>[1]) => {
      const feature = featureRecords.get(id)
      if (!feature) return false
      const updates = Object.fromEntries(
        Object.entries(input).filter(([, value]) => value !== undefined),
      )
      featureRecords.set(id, { ...feature, ...updates })
      return true
    },
    delete: async (id: number) => featureRecords.delete(id),
  } satisfies Pick<FeaturesRepository, 'findAll' | 'findById' | 'create' | 'update' | 'delete'>
  const featuresService: Pick<FeaturesService, 'findAll' | 'create' | 'update' | 'delete'> =
    createFeaturesService({ features: featuresRepository })

  const initialFeature: FeatureDto = {
    id: 1,
    name: 'Test feature',
    description: 'Original description',
    iconPath: null,
    category: 'OTHER',
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
    app.use('/icons', serveUploadedIcons(uploadsDir))
    app.use(
      '/features',
      createFeaturesRoutes({
        featuresService,
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

  beforeEach(async () => {
    currentRole = 'ADMIN'
    featureRecords.clear()
    featureRecords.set(initialFeature.id, { ...initialFeature })
    await fs.rm(path.join(uploadsDir, 'icons'), { recursive: true, force: true })
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
    assert.match(body.iconPath, /^\/icons\/[a-f0-9-]+\.svg$/)

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

  it('rejects SVGs with foreignObject, javascript: links, slash-separated handlers or encoded payloads with 400', async () => {
    const unsafeSvgs = [
      '<svg xmlns="http://www.w3.org/2000/svg"><foreignObject><div/></foreignObject></svg>',
      '<svg xmlns="http://www.w3.org/2000/svg"><a href="javascript:alert(1)"><circle r="1"/></a></svg>',
      '<svg/onload="alert(1)"></svg>',
      '<svg xmlns="http://www.w3.org/2000/svg"><a href="java&#x73;cript:alert(1)"/></svg>',
    ]

    for (const svg of unsafeSvgs) {
      const res = await fetch(`${baseUrl}/features/icons`, {
        method: 'POST',
        headers: { 'Content-Type': 'image/svg+xml' },
        body: svg,
      })
      assert.equal(res.status, 400, svg)
    }
  })

  it('rejects bodies where <svg> is not the root element with 400', async () => {
    const res = await fetch(`${baseUrl}/features/icons`, {
      method: 'POST',
      headers: { 'Content-Type': 'image/svg+xml' },
      body: '<div><svg xmlns="http://www.w3.org/2000/svg"></svg></div>',
    })

    assert.equal(res.status, 400)
  })

  it('accepts an SVG with an XML declaration before the root element', async () => {
    const res = await fetch(`${baseUrl}/features/icons`, {
      method: 'POST',
      headers: { 'Content-Type': 'image/svg+xml' },
      body: `<?xml version="1.0" encoding="UTF-8"?>\n${VALID_SVG}`,
    })

    assert.equal(res.status, 201)
  })

  it('serves uploaded icons with script-blocking headers', async () => {
    const uploadRes = await fetch(`${baseUrl}/features/icons`, {
      method: 'POST',
      headers: { 'Content-Type': 'image/svg+xml' },
      body: VALID_SVG,
    })
    const { iconPath } = (await uploadRes.json()) as { iconPath: string }

    const res = await fetch(`${baseUrl}${iconPath}`)

    assert.equal(res.status, 200)
    assert.equal(res.headers.get('content-type'), 'image/svg+xml')
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff')
    assert.equal(
      res.headers.get('content-security-policy'),
      "default-src 'none'; style-src 'unsafe-inline'; sandbox",
    )
    assert.equal(await res.text(), VALID_SVG)
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
        category: 'OTHER',
      }),
    })

    assert.equal(res.status, 400)
  })

  it('rejects iconPaths that could break out of a CSS url() or escape the folder', async () => {
    const badPaths = [
      '/icons/x.svg) ; background:url(//evil.example.com)',
      '/icons/%2e%2e/secret.svg',
      '/icons/../../etc/passwd',
      '/icons/icon.png',
    ]

    for (const iconPath of badPaths) {
      const res = await fetch(`${baseUrl}/features`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Kaffemaskin', iconPath, category: 'OTHER' }),
      })
      assert.equal(res.status, 400, iconPath)
    }
  })

  it('accepts default and uploaded iconPaths when creating a feature', async () => {
    for (const iconPath of ['/icons/linux.svg', '/icons/3f2a9c1e-1b2c-4d5e.svg', null]) {
      const res = await fetch(`${baseUrl}/features`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Kaffemaskin', iconPath, category: 'OTHER' }),
      })
      assert.equal(res.status, 201, String(iconPath))
    }
  })

  it('returns 413 with the icon size message for oversized uploads', async () => {
    const res = await fetch(`${baseUrl}/features/icons`, {
      method: 'POST',
      headers: { 'Content-Type': 'image/svg+xml' },
      body: `<svg>${'a'.repeat(101 * 1024)}</svg>`,
    })
    const body = (await res.json()) as { errorMessage: string }

    assert.equal(res.status, 413)
    assert.equal(body.errorMessage, 'Uploaded icon must be 100 KB or smaller')
  })

  it('updates only the supplied fields and returns 204', async () => {
    const res = await fetch(`${baseUrl}/features/1`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: 'Updated description' }),
    })

    assert.equal(res.status, 204)
    assert.deepEqual(await featuresService.findAll(), [
      { ...initialFeature, description: 'Updated description' },
    ])
  })

  it('returns 404 when updating an unknown feature', async () => {
    const res = await fetch(`${baseUrl}/features/999`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Updated' }),
    })
    assert.equal(res.status, 404)
  })

  it('returns 409 when updating to another feature name', async () => {
    featureRecords.set(2, { ...initialFeature, id: 2, name: 'Another feature' })
    const res = await fetch(`${baseUrl}/features/1`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Another feature' }),
    })
    assert.equal(res.status, 409)
  })

  it('returns 403 for non-admin update and delete requests', async () => {
    currentRole = 'CANDIDATE'
    const updateRes = await fetch(`${baseUrl}/features/1`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Updated' }),
    })
    const deleteRes = await fetch(`${baseUrl}/features/1`, { method: 'DELETE' })

    assert.equal(updateRes.status, 403)
    assert.equal(deleteRes.status, 403)
  })

  it('deletes an uploaded icon after a successful update', async () => {
    const filename = '12345678-1234-1234-1234-123456789abc.svg'
    featureRecords.set(1, { ...initialFeature, iconPath: `/icons/${filename}` })
    const iconPath = path.join(uploadsDir, 'icons', filename)
    await fs.mkdir(path.dirname(iconPath), { recursive: true })
    await fs.writeFile(iconPath, VALID_SVG)

    const res = await fetch(`${baseUrl}/features/1`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ iconPath: null }),
    })

    assert.equal(res.status, 204)
    await assert.rejects(fs.access(iconPath))
  })

  it('deletes the previous uploaded icon when replacing it', async () => {
    const oldFilename = '12345678-1234-1234-1234-123456789abc.svg'
    const newFilename = '12345678-1234-1234-1234-123456789abd.svg'
    featureRecords.set(1, { ...initialFeature, iconPath: `/icons/${oldFilename}` })
    const oldIconPath = path.join(uploadsDir, 'icons', oldFilename)
    await fs.mkdir(path.dirname(oldIconPath), { recursive: true })
    await fs.writeFile(oldIconPath, VALID_SVG)

    const res = await fetch(`${baseUrl}/features/1`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ iconPath: `/icons/${newFilename}` }),
    })

    assert.equal(res.status, 204)
    await assert.rejects(fs.access(oldIconPath))
    assert.equal((await featuresService.findAll())[0]?.iconPath, `/icons/${newFilename}`)
  })

  it('deletes an uploaded icon after deleting its feature', async () => {
    const filename = '12345678-1234-1234-1234-123456789abc.svg'
    featureRecords.set(1, { ...initialFeature, iconPath: `/icons/${filename}` })
    const iconPath = path.join(uploadsDir, 'icons', filename)
    await fs.mkdir(path.dirname(iconPath), { recursive: true })
    await fs.writeFile(iconPath, VALID_SVG)

    const res = await fetch(`${baseUrl}/features/1`, { method: 'DELETE' })

    assert.equal(res.status, 204)
    assert.deepEqual(await featuresService.findAll(), [])
    await assert.rejects(fs.access(iconPath))
  })

  it('does not delete repository icons when a feature is removed', async () => {
    featureRecords.set(1, { ...initialFeature, iconPath: '/icons/linux.svg' })
    const iconPath = path.join(uploadsDir, 'icons', 'linux.svg')
    await fs.mkdir(path.dirname(iconPath), { recursive: true })
    await fs.writeFile(iconPath, VALID_SVG)

    const res = await fetch(`${baseUrl}/features/1`, { method: 'DELETE' })

    assert.equal(res.status, 204)
    assert.equal(await fs.readFile(iconPath, 'utf8'), VALID_SVG)
  })

  it('returns 404 when deleting an unknown feature', async () => {
    const res = await fetch(`${baseUrl}/features/999`, { method: 'DELETE' })
    assert.equal(res.status, 404)
  })
})

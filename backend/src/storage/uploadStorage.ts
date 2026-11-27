import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { isValidSeatMapPath } from '../../../contracts/room.js'

export interface UploadStorageOptions {
  dir: string
  urlPrefix: string
  isUploadedPath: (publicPath: string) => boolean
  protectedDir?: string
}

const UPLOADED_ICON_PATH_PATTERN =
  /^\/icons\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.svg$/i

const isMissingPath = (error: unknown) =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT'

const realpathOrNull = async (dir: string) => {
  try {
    return await fs.realpath(dir)
  } catch (error) {
    if (isMissingPath(error)) return null
    throw error
  }
}

const isSameDir = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()

export const createUploadStorage = ({
  dir,
  urlPrefix,
  isUploadedPath,
  protectedDir,
}: UploadStorageOptions) => {
  const isProtected = async (realDir: string) => {
    if (!protectedDir) return false
    if (isSameDir(path.resolve(dir), path.resolve(protectedDir))) return true
    const realProtectedDir = (await realpathOrNull(protectedDir)) ?? path.resolve(protectedDir)
    return isSameDir(realDir, realProtectedDir)
  }

  const save = async (content: Buffer | string, ext: string): Promise<string> => {
    await fs.mkdir(dir, { recursive: true })
    const filename = `${crypto.randomUUID()}.${ext}`
    await fs.writeFile(path.join(dir, filename), content)
    return `${urlPrefix}${filename}`
  }

  const remove = async (publicPath: string): Promise<void> => {
    if (!isUploadedPath(publicPath)) return
    const realDir = await realpathOrNull(dir)
    if (!realDir || (await isProtected(realDir))) return
    await fs.rm(path.join(realDir, path.basename(publicPath)), { force: true })
  }

  return { save, remove }
}

export type UploadStorage = ReturnType<typeof createUploadStorage>

export const createSeatMapStorage = (uploadsDir: string) =>
  createUploadStorage({
    dir: path.join(uploadsDir, 'seat-maps'),
    urlPrefix: '/seat-maps/',
    isUploadedPath: isValidSeatMapPath,
  })

export const createIconStorage = (uploadsDir: string) =>
  createUploadStorage({
    dir: path.join(uploadsDir, 'icons'),
    urlPrefix: '/icons/',
    isUploadedPath: (publicPath) => UPLOADED_ICON_PATH_PATTERN.test(publicPath),
    protectedDir: path.resolve(process.cwd(), 'backend', 'assets', 'icons'),
  })

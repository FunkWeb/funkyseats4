import express, { type ErrorRequestHandler, type RequestHandler } from 'express'
import { PayloadTooLargeError, UnsupportedMediaTypeError } from '../errors/appErrors.js'
import { isEntityTooLarge } from '../errors/errorHandler.js'

export interface RawUploadOptions<Ext extends string> {
  types: ReadonlyMap<string, Ext>
  limit: number
  tooLargeMessage: string
}

export const rawUpload = <Ext extends string>({
  types,
  limit,
  tooLargeMessage,
}: RawUploadOptions<Ext>): [RequestHandler, RequestHandler, ErrorRequestHandler] => {
  const mimeTypes = [...types.keys()]
  const allowedList = new Intl.ListFormat('en', { type: 'disjunction' }).format(mimeTypes)

  const requireContentType: RequestHandler = (req, res, next) => {
    const rawContentType = req.get('content-type') ?? ''
    const mimeType = rawContentType.split(';')[0]?.trim().toLowerCase() ?? ''
    const ext = types.get(mimeType)
    if (!ext) {
      next(new UnsupportedMediaTypeError(`Content-Type must be ${allowedList}`))
      return
    }
    res.locals.uploadExtension = ext
    next()
  }

  const tooLarge: ErrorRequestHandler = (error, _req, _res, next) => {
    if (isEntityTooLarge(error)) {
      next(new PayloadTooLargeError(tooLargeMessage))
      return
    }
    next(error)
  }

  return [requireContentType, express.raw({ type: mimeTypes, limit }), tooLarge]
}

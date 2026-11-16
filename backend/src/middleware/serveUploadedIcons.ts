import path from 'node:path'
import express from 'express'

export const serveUploadedIcons = (uploadsDir: string) =>
  express.static(path.join(uploadsDir, 'icons'), {
    setHeaders: (res) => {
      res.setHeader('Content-Type', 'image/svg+xml')
      res.setHeader('X-Content-Type-Options', 'nosniff')
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      )
    },
  })

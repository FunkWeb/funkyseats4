import path from 'node:path'
import express from 'express'

export const serveUploadedSeatMaps = (uploadsDir: string) =>
  express.static(path.join(uploadsDir, 'seat-maps'), {
    setHeaders: (res) => {
      res.setHeader('X-Content-Type-Options', 'nosniff')
    },
  })

import multer, { FileFilterCallback } from 'multer'
import { Request, Response } from 'express'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

const upload = multer({
  dest: 'uploads/pharmacy/',
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('INVALID_MIME'))
    }
  },
})

export const uploadImage = (req: Request, res: Response): void => {
  upload.single('image')(req, res, (err: any) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({ error: 'File too large. Maximum size is 5 MB.' })
        return
      }
      if (err.message === 'INVALID_MIME') {
        res.status(400).json({ error: 'Unsupported file type. Allowed: jpeg, png, webp, gif.' })
        return
      }
      res.status(400).json({ error: err.message })
      return
    }

    if (!req.file) {
      res.status(400).json({ error: 'No image file provided.' })
      return
    }

    res.json({ url: `/uploads/pharmacy/${req.file.filename}` })
  })
}

import { Router } from 'express'

import { getCrawlStatus } from '../services/crawlStatus.js'

export const systemRouter = Router()

systemRouter.get('/status', async (_req, res, next) => {
  try {
    const status = await getCrawlStatus()
    res.json(status)
  } catch (error) {
    next(error)
  }
})

import { Router } from 'express'

import { getKeywordCounts } from '../services/keywordService.js'

export const keywordsRouter = Router()

keywordsRouter.get('/', async (req, res, next) => {
  try {
    const limit = Number(req.query.limit ?? 20)
    const items = await getKeywordCounts(Number.isFinite(limit) ? limit : 20)

    res.json({
      items,
    })
  } catch (error) {
    next(error)
  }
})

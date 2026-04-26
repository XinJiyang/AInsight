import { Router } from 'express'

import { requireAdmin } from '../middleware/auth.js'
import { markCrawlFailed, markCrawlStarted, markCrawlSucceeded } from '../services/crawlStatus.js'
import { crawlNewsFeeds, getNewsFeed } from '../services/newsCrawler.js'

export const newsRouter = Router()

newsRouter.get('/', async (_req, res, next) => {
  try {
    const result = await getNewsFeed()
    res.json(result)
  } catch (error) {
    next(error)
  }
})

newsRouter.post('/refresh', requireAdmin, async (_req, res, next) => {
  try {
    markCrawlStarted('manual')
    const result = await crawlNewsFeeds({ includeSocial: true })
    markCrawlSucceeded({
      itemCount: result.items.length,
      sourceCount: new Set(result.items.map((item) => item.source.name)).size,
      failedSourceCount: result.errors?.length ?? 0,
    })
    res.json(result)
  } catch (error) {
    markCrawlFailed(error)
    next(error)
  }
})

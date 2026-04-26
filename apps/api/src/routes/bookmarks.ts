import { Router } from 'express'

import { prisma } from '../lib/db.js'
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js'
import { mapDatabaseNewsItem } from '../services/newsRepository.js'

export const bookmarksRouter = Router()

bookmarksRouter.use(requireAuth)

bookmarksRouter.get('/', async (req, res, next) => {
  try {
    const user = (req as AuthenticatedRequest).user
    const bookmarks = await prisma.bookmark.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        newsItem: {
          include: {
            source: true,
          },
        },
      },
    })

    res.json({
      items: bookmarks.map((bookmark) => mapDatabaseNewsItem(bookmark.newsItem)),
    })
  } catch (error) {
    next(error)
  }
})

bookmarksRouter.get('/ids', async (req, res, next) => {
  try {
    const user = (req as AuthenticatedRequest).user
    const bookmarks = await prisma.bookmark.findMany({
      where: {
        userId: user.id,
      },
      include: {
        newsItem: {
          select: {
            externalId: true,
          },
        },
      },
    })

    res.json({
      ids: bookmarks.map((bookmark) => bookmark.newsItem.externalId),
    })
  } catch (error) {
    next(error)
  }
})

bookmarksRouter.post('/:externalId', async (req, res, next) => {
  try {
    const user = (req as AuthenticatedRequest).user
    const newsItem = await prisma.newsItem.findUnique({
      where: {
        externalId: req.params.externalId,
      },
    })

    if (!newsItem) {
      res.status(404).json({
        error: 'News item not found',
      })
      return
    }

    await prisma.bookmark.upsert({
      where: {
        userId_newsItemId: {
          userId: user.id,
          newsItemId: newsItem.id,
        },
      },
      create: {
        userId: user.id,
        newsItemId: newsItem.id,
      },
      update: {},
    })

    res.status(201).json({
      ok: true,
    })
  } catch (error) {
    next(error)
  }
})

bookmarksRouter.delete('/:externalId', async (req, res, next) => {
  try {
    const user = (req as AuthenticatedRequest).user
    const newsItem = await prisma.newsItem.findUnique({
      where: {
        externalId: req.params.externalId,
      },
    })

    if (!newsItem) {
      res.status(204).send()
      return
    }

    await prisma.bookmark.deleteMany({
      where: {
        userId: user.id,
        newsItemId: newsItem.id,
      },
    })

    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

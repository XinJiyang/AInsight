import { Router } from 'express'

import { requireAdmin } from '../middleware/auth.js'
import { isOpenAISummaryEnabled, summarizeArticle, summarizeFeed } from '../services/openaiSummaryService.js'

export const summaryRouter = Router()

summaryRouter.post('/', requireAdmin, async (req, res, next) => {
  try {
    if (!isOpenAISummaryEnabled()) {
      res.status(503).json({
        error: 'OPENAI_API_KEY is not configured',
      })
      return
    }

    const article = req.body as {
      id?: string
      title?: string
      summary?: string
      keywords?: string[]
      company?: string
      modelFamily?: string
      contentType?: string
      source?: { name?: string; url?: string; category?: 'official' | 'research' | 'media' | 'community' }
      publishedAt?: string
      link?: string
      author?: string
    }

    if (!article?.id || !article?.title || !article?.summary || !article?.source?.name || !article?.source?.url) {
      res.status(400).json({
        error: 'Missing required article fields',
      })
      return
    }

    const result = await summarizeArticle({
      id: article.id,
      title: article.title,
      summary: article.summary,
      keywords: Array.isArray(article.keywords) ? article.keywords : [],
      company: article.company,
      modelFamily: article.modelFamily,
      contentType: article.contentType,
      source: {
        name: article.source.name,
        url: article.source.url,
        category: article.source.category,
      },
      publishedAt: article.publishedAt,
      link: article.link,
      author: article.author,
    })

    res.json({
      articleId: article.id,
      cached: result.cached,
      summary: result.summary,
    })
  } catch (error) {
    next(error)
  }
})

summaryRouter.post('/feed', requireAdmin, async (req, res, next) => {
  try {
    if (!isOpenAISummaryEnabled()) {
      res.status(503).json({
        error: 'OPENAI_API_KEY is not configured',
      })
      return
    }

    const articles = Array.isArray(req.body?.articles) ? req.body.articles : []

    if (articles.length === 0) {
      res.status(400).json({
        error: 'Missing articles payload',
      })
      return
    }

    const normalizedArticles = articles
      .filter((article) => article?.id && article?.title && article?.summary && article?.source?.name && article?.source?.url)
      .map((article) => ({
        id: article.id,
        title: article.title,
        summary: article.summary,
        keywords: Array.isArray(article.keywords) ? article.keywords : [],
        company: article.company,
        modelFamily: article.modelFamily,
        contentType: article.contentType,
        source: {
          name: article.source.name,
          url: article.source.url,
          category: article.source.category,
        },
        publishedAt: article.publishedAt,
        link: article.link,
        author: article.author,
      }))

    if (normalizedArticles.length === 0) {
      res.status(400).json({
        error: 'No valid articles supplied',
      })
      return
    }

    const result = await summarizeFeed(normalizedArticles)

    res.json({
      cached: result.cached,
      summary: result.summary,
    })
  } catch (error) {
    next(error)
  }
})

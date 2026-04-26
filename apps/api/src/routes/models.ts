import { Router } from 'express'

import { requireAdmin } from '../middleware/auth.js'
import { isOpenAIModelsRefreshEnabled, refreshModelDirectory } from '../services/openaiModelsService.js'

export const modelsRouter = Router()

modelsRouter.post('/refresh', requireAdmin, async (req, res, next) => {
  try {
    if (!isOpenAIModelsRefreshEnabled()) {
      res.status(503).json({
        error: 'OPENAI_API_KEY is not configured',
      })
      return
    }

    const models = Array.isArray(req.body?.models) ? req.body.models : []

    if (models.length === 0) {
      res.status(400).json({
        error: 'Missing models payload',
      })
      return
    }

    const normalizedModels = models
      .filter(
        (model) =>
          model?.id &&
          model?.name &&
          model?.company &&
          model?.availability &&
          model?.parameters &&
          model?.contextWindow &&
          model?.released &&
          model?.bestFor &&
          model?.description &&
          model?.websiteUrl &&
          model?.logoPath,
      )
      .map((model) => ({
        id: model.id,
        name: model.name,
        company: model.company,
        availability: model.availability,
        parameters: model.parameters,
        contextWindow: model.contextWindow,
        released: model.released,
        bestFor: model.bestFor,
        description: model.description,
        websiteUrl: model.websiteUrl,
        logoPath: model.logoPath,
        isFeatured: Boolean(model.isFeatured),
      }))

    if (normalizedModels.length === 0) {
      res.status(400).json({
        error: 'No valid models supplied',
      })
      return
    }

    const result = await refreshModelDirectory(normalizedModels)

    res.json({
      cached: result.cached,
      models: result.models,
    })
  } catch (error) {
    next(error)
  }
})

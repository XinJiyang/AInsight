import { Router } from 'express'

import { authRouter } from './auth.js'
import { bookmarksRouter } from './bookmarks.js'
import { keywordsRouter } from './keywords.js'
import { modelsRouter } from './models.js'
import { newsRouter } from './news.js'
import { summaryRouter } from './summary.js'
import { systemRouter } from './system.js'

export const apiRouter = Router()

apiRouter.use('/auth', authRouter)
apiRouter.use('/bookmarks', bookmarksRouter)
apiRouter.use('/keywords', keywordsRouter)
apiRouter.use('/models', modelsRouter)
apiRouter.use('/news', newsRouter)
apiRouter.use('/summary', summaryRouter)
apiRouter.use('/system', systemRouter)

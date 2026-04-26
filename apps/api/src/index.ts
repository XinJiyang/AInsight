import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'

import { apiRouter } from './routes/index.js'
import { runStartupCrawlIfEnabled, startCrawlScheduler } from './services/crawlScheduler.js'

dotenv.config()

const app = express()
const port = Number(process.env.PORT ?? 4000)
const clientOrigin = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173'

app.use(
  cors({
    origin: clientOrigin,
  }),
)
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'ainsight-api',
  })
})

app.use('/api', apiRouter)

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = error instanceof Error ? error.message : 'Unknown server error'
  res.status(500).json({
    error: message,
  })
})

app.listen(port, () => {
  console.log(`AInsight API listening on http://localhost:${port}`)
})

void runStartupCrawlIfEnabled()
startCrawlScheduler()

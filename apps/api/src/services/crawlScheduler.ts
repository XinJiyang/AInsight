import cron from 'node-cron'

import { markCrawlFailed, markCrawlStarted, markCrawlSucceeded } from './crawlStatus.js'
import { crawlNewsFeeds } from './newsCrawler.js'

export async function runStartupCrawlIfEnabled(): Promise<void> {
  if (process.env.CRAWL_ON_STARTUP === 'false') {
    return
  }

  try {
    markCrawlStarted('startup')
    const result = await crawlNewsFeeds()
    markCrawlSucceeded({
      itemCount: result.items.length,
      sourceCount: new Set(result.items.map((item) => item.source.name)).size,
      failedSourceCount: result.errors?.length ?? 0,
    })
    console.log(`[crawl] startup refresh completed: ${result.items.length} items`)
  } catch (error) {
    markCrawlFailed(error)
    console.error('[crawl] startup refresh failed:', error)
  }
}

export function startCrawlScheduler(): void {
  const schedule = process.env.CRAWL_SCHEDULE ?? '*/30 * * * *'

  cron.schedule(schedule, async () => {
    try {
      markCrawlStarted('schedule')
      const result = await crawlNewsFeeds()
      markCrawlSucceeded({
        itemCount: result.items.length,
        sourceCount: new Set(result.items.map((item) => item.source.name)).size,
        failedSourceCount: result.errors?.length ?? 0,
      })
      console.log(`[crawl] scheduled refresh completed: ${result.items.length} items`)
    } catch (error) {
      markCrawlFailed(error)
      console.error('[crawl] scheduled refresh failed:', error)
    }
  })

  console.log(`[crawl] scheduler started with cron: ${schedule}`)
}

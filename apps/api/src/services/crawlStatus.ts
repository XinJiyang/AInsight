import { isDatabaseEnabled } from '../lib/db.js'
import { getDatabaseCounts } from './newsRepository.js'

type CrawlTrigger = 'startup' | 'schedule' | 'manual'

interface CrawlStatusState {
  enabled: boolean
  schedule: string
  scheduleLabel: string
  running: boolean
  lastRunStartedAt: string | null
  lastRunFinishedAt: string | null
  lastRunTrigger: CrawlTrigger | null
  lastRunItemCount: number
  lastRunError: string | null
  lastRunSourceCount: number
  lastRunFailedSourceCount: number
}

const state: CrawlStatusState = {
  enabled: true,
  schedule: process.env.CRAWL_SCHEDULE ?? '*/30 * * * *',
  scheduleLabel: humanizeSchedule(process.env.CRAWL_SCHEDULE ?? '*/30 * * * *'),
  running: false,
  lastRunStartedAt: null,
  lastRunFinishedAt: null,
  lastRunTrigger: null,
  lastRunItemCount: 0,
  lastRunError: null,
  lastRunSourceCount: 0,
  lastRunFailedSourceCount: 0,
}

export function markCrawlStarted(trigger: CrawlTrigger): void {
  state.running = true
  state.lastRunTrigger = trigger
  state.lastRunStartedAt = new Date().toISOString()
  state.lastRunError = null
}

export function markCrawlSucceeded(params: {
  itemCount: number
  sourceCount: number
  failedSourceCount: number
}): void {
  state.running = false
  state.lastRunFinishedAt = new Date().toISOString()
  state.lastRunItemCount = params.itemCount
  state.lastRunSourceCount = params.sourceCount
  state.lastRunFailedSourceCount = params.failedSourceCount
  state.lastRunError = null
}

export function markCrawlFailed(error: unknown): void {
  state.running = false
  state.lastRunFinishedAt = new Date().toISOString()
  state.lastRunError = error instanceof Error ? error.message : String(error)
}

export async function getCrawlStatus() {
  const databaseCounts = isDatabaseEnabled() ? await getDatabaseCounts() : null

  return {
    crawler: state,
    storage: {
      mode: isDatabaseEnabled() ? 'database' : 'cache',
      databaseEnabled: isDatabaseEnabled(),
      counts: databaseCounts,
    },
  }
}

function humanizeSchedule(schedule: string): string {
  if (schedule === '*/30 * * * *') {
    return 'Every 30 minutes'
  }

  if (schedule === '0 * * * *') {
    return 'Every hour'
  }

  if (schedule === '0 */6 * * *') {
    return 'Every 6 hours'
  }

  if (schedule === '0 0 * * *') {
    return 'Every day'
  }

  return schedule
}

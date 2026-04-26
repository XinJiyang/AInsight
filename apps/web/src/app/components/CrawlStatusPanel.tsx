import type { ReactNode } from 'react'
import { Activity, Database, RefreshCw, TriangleAlert } from 'lucide-react'

import type { ApiSystemStatusResponse } from '../types/news'

interface CrawlStatusPanelProps {
  status: ApiSystemStatusResponse | null
  isRefreshing: boolean
  onRefresh: () => void
  canRefresh?: boolean
}

export function CrawlStatusPanel({ status, isRefreshing, onRefresh, canRefresh = false }: CrawlStatusPanelProps) {
  if (!status) {
    return null
  }

  return (
    <section className="mb-6 rounded-[8px] border border-brand-200 bg-white px-4 py-4 shadow-sm">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-brand-500">Crawler Status</p>
            <h2 className="text-[1.625rem] font-bold tracking-[-0.03em] text-brand-900">Ingestion Monitor</h2>
          </div>
          <button
            onClick={onRefresh}
            disabled={!canRefresh || isRefreshing || status.crawler.running}
            className="inline-flex items-center gap-2 rounded-[8px] border border-brand-200 bg-white px-3 py-2 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60"
            title={canRefresh ? 'Refresh official and X sources' : 'Display only. Admin access is required to refresh sources and avoid API costs.'}
          >
            <RefreshCw size={16} className={isRefreshing || status.crawler.running ? 'animate-spin' : ''} />
            <span>{isRefreshing || status.crawler.running ? 'Refreshing' : 'Refresh now'}</span>
          </button>
        </div>

        {!canRefresh && (
          <p className="rounded-[8px] border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-600">
            Display only. Admin access is required to refresh sources and avoid API costs.
          </p>
        )}

        <div className="grid gap-3 md:grid-cols-4">
          <StatusTile
            icon={<Activity size={16} />}
            label="Last trigger"
            value={status.crawler.lastRunTrigger ?? 'N/A'}
            hint={status.crawler.lastRunFinishedAt ? new Date(status.crawler.lastRunFinishedAt).toLocaleString() : 'Not run yet'}
          />
          <StatusTile
            icon={<Database size={16} />}
            label="Storage mode"
            value={status.storage.mode}
            hint={
              status.storage.counts
                ? `${status.storage.counts.newsItems} items / ${status.storage.counts.sources} sources`
                : 'No database counts yet'
            }
          />
          <StatusTile
            icon={<Activity size={16} />}
            label="Sources"
            value={`${status.crawler.lastRunSourceCount}`}
            hint={`${status.crawler.lastRunFailedSourceCount} failed on last run`}
          />
          <StatusTile
            icon={<Activity size={16} />}
            label="Items"
            value={`${status.crawler.lastRunItemCount}`}
            hint={status.crawler.scheduleLabel}
          />
        </div>

        {status.crawler.lastRunError && (
          <div className="flex items-start gap-2 rounded-[8px] border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-700">
            <TriangleAlert size={16} className="mt-0.5 flex-shrink-0 text-brand-accent" />
            <span>{status.crawler.lastRunError}</span>
          </div>
        )}
      </div>
    </section>
  )
}

function StatusTile({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode
  label: string
  value: string
  hint: string
}) {
  return (
    <div className="rounded-[8px] border border-brand-200 bg-brand-50 px-3 py-3">
      <div className="mb-2 flex items-center gap-2 text-brand-500">
        {icon}
        <span className="text-xs font-medium uppercase tracking-[0.16em]">{label}</span>
      </div>
      <p className="text-[1.125rem] font-semibold text-brand-900">{value}</p>
      <p className="mt-1 text-xs text-brand-500">{hint}</p>
    </div>
  )
}

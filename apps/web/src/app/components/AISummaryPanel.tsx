import { LoaderCircle, Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'

import type { ApiArticleSummary } from '../types/news'

interface AISummaryPanelProps {
  summary: ApiArticleSummary | null
  isLoading: boolean
  error: string | null
  itemCount: number
  onGenerate: () => void
  canGenerate?: boolean
}

export function AISummaryPanel({
  summary,
  isLoading,
  error,
  itemCount,
  onGenerate,
  canGenerate = false,
}: AISummaryPanelProps) {
  return (
    <aside className="rounded-[8px] border border-brand-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-brand-accent">
          <Sparkles size={18} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-500">AI Summary</p>
          <h3 className="text-lg font-bold text-brand-900">Knowledge Brief</h3>
        </div>
      </div>

      <div className="mb-5 rounded-[8px] border border-brand-200 bg-brand-50 p-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-brand-500">Current feed</p>
        <p className="text-sm leading-6 text-brand-700">
          Generate an AI summary for the current filtered feed. This uses the fetched summaries, not full article
          bodies.
        </p>
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={onGenerate}
            disabled={!canGenerate || itemCount === 0 || isLoading}
            className="inline-flex items-center gap-2 rounded-full bg-brand-accent px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-accent-hover disabled:cursor-not-allowed disabled:bg-brand-300"
            title={canGenerate ? 'Generate AI summary' : 'Display only. Admin access is required to use AI and avoid API costs.'}
          >
            {isLoading ? <LoaderCircle size={14} className="animate-spin" /> : <Sparkles size={14} />}
            <span>{isLoading ? 'Summarizing...' : 'Summarize feed'}</span>
          </button>
        </div>
      </div>

      {!canGenerate && (
        <div className="mb-5 rounded-[8px] border border-brand-200 bg-brand-50 p-4 text-sm leading-6 text-brand-600">
          Display only. Admin access is required to use AI features and avoid API costs.
        </div>
      )}

      {!summary && !isLoading && !error && canGenerate && (
        <div className="rounded-[8px] border border-dashed border-brand-200 bg-white p-4 text-sm text-brand-600">
          Click <span className="font-semibold text-brand-accent">Summarize feed</span> to generate a concise AI brief
          for the articles currently visible under your filters.
        </div>
      )}

      {error && (
        <div className="rounded-[8px] border border-dashed border-brand-200 bg-brand-50 p-4 text-sm text-brand-700">
          {error}
        </div>
      )}

      {summary && !error && (
        <div className="space-y-5">
          <SummarySection title="Overview">
            <p className="text-sm leading-6 text-brand-700">
              <HighlightedText text={summary.overview} />
            </p>
          </SummarySection>

          <SummarySection title="Key Points">
            <ul className="space-y-2 text-sm leading-6 text-brand-700">
              {summary.keyPoints.map((point) => (
                <li key={point} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-accent" />
                  <span>
                    <HighlightedText text={point} />
                  </span>
                </li>
              ))}
            </ul>
          </SummarySection>

          <SummarySection title="Why It Matters">
            <p className="text-sm leading-6 text-brand-700">
              <HighlightedText text={summary.whyItMatters} />
            </p>
          </SummarySection>

          <SummarySection title="Watch Next">
            <ul className="space-y-2 text-sm leading-6 text-brand-700">
              {summary.watchNext.map((point) => (
                <li key={point} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-accent" />
                  <span>
                    <HighlightedText text={point} />
                  </span>
                </li>
              ))}
            </ul>
          </SummarySection>
        </div>
      )}
    </aside>
  )
}

function HighlightedText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)

  return (
    <>
      {parts.map((part, index) => {
        const isHighlighted = part.startsWith('**') && part.endsWith('**')
        const content = isHighlighted ? part.slice(2, -2) : part

        if (!content) {
          return null
        }

        return isHighlighted ? (
          <strong key={`${part}-${index}`} className="font-bold text-brand-900">
            {content}
          </strong>
        ) : (
          <span key={`${part}-${index}`}>{content}</span>
        )
      })}
    </>
  )
}

function SummarySection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-500">{title}</p>
      {children}
    </section>
  )
}

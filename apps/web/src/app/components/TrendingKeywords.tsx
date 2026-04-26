import { Sparkles } from 'lucide-react'

import type { ApiKeywordItem } from '../types/news'

interface TrendingKeywordsProps {
  keywords: ApiKeywordItem[]
  selected: string | null
  onSelect: (keyword: string | null) => void
}

export function TrendingKeywords({ keywords, selected, onSelect }: TrendingKeywordsProps) {
  const topKeywords = keywords.slice(0, 8)

  return (
    <div className="rounded-[8px] border border-brand-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-2">
        <button
          onClick={() => onSelect(null)}
          className={`flex items-center justify-between rounded-[8px] px-3 py-2 transition-colors ${
            selected === null
              ? 'bg-brand-accent text-white'
              : 'text-brand-700 hover:bg-brand-50'
          }`}
        >
          <div className="flex items-center gap-2">
            <Sparkles size={16} className={selected === null ? 'fill-current' : ''} />
            <span>All Updates</span>
          </div>
        </button>

        <div className="my-1 h-px bg-brand-100"></div>

        {topKeywords.map(({ keyword, count }) => (
          <button
            key={keyword}
            onClick={() => onSelect(keyword)}
            className={`flex items-center justify-between rounded-[8px] px-3 py-2 text-left transition-colors ${
              selected === keyword
                ? 'bg-brand-50 font-semibold text-brand-900'
                : 'text-brand-500 hover:bg-brand-50 hover:text-brand-900'
            }`}
          >
            <span className="truncate">{keyword}</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                selected === keyword
                  ? 'bg-white text-brand-accent border border-brand-accent/20'
                  : 'bg-brand-50 text-brand-500'
              }`}
            >
              {count}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

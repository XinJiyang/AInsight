import { SearchX } from 'lucide-react'

import { NewsCard } from './NewsCard'
import type { ApiNewsItem } from '../types/news'

interface NewsFeedProps {
  items: ApiNewsItem[]
  bookmarkedIds?: Set<string>
  onToggleBookmark?: (item: ApiNewsItem) => void
}

export function NewsFeed({ items, bookmarkedIds, onToggleBookmark }: NewsFeedProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[8px] border border-dashed border-brand-300 bg-white py-24 text-center">
        <SearchX size={48} className="mb-4 text-brand-300" />
        <h3 className="mb-2 text-xl font-semibold text-brand-800">No related news found</h3>
        <p className="max-w-sm text-center text-sm text-brand-500">
          Try searching with different keywords, or clear the current filters.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {items.map((item) => (
        <NewsCard
          key={item.id}
          item={item}
          isBookmarked={bookmarkedIds?.has(item.id)}
          onToggleBookmark={onToggleBookmark}
        />
      ))}
    </div>
  )
}

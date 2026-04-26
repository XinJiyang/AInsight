import {
  BookmarkPlus,
  CalendarDays,
  ExternalLink,
  FlaskConical,
  Heart,
  Layers3,
  Newspaper,
  Repeat2,
  Rss,
  Tags,
  Users,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import { enUS } from 'date-fns/locale'

import type { ApiNewsItem } from '../types/news'

function getPlatformLogoPath(sourceName?: string): string | null {
  const normalizedSource = sourceName?.toLowerCase() ?? ''

  if (normalizedSource.startsWith('x / ') || normalizedSource === 'x') {
    return '/logos/sources/X.svg'
  }

  return null
}

function getEntityLogoPath(label?: string): string | null {
  const normalizedLabel = label?.toLowerCase() ?? ''

  if (normalizedLabel.includes('openai')) {
    return '/logos/sources/openai.svg'
  }

  if (normalizedLabel.includes('anthropic')) {
    return '/logos/sources/Anthropic.svg'
  }

  if (normalizedLabel.includes('deepmind') || normalizedLabel.includes('google')) {
    return '/logos/sources/Google.svg'
  }

  if (normalizedLabel.includes('xai')) {
    return '/logos/sources/XAI.svg'
  }

  if (normalizedLabel.includes('mistral')) {
    return '/logos/sources/Mistral.svg'
  }

  if (normalizedLabel.includes('cohere')) {
    return '/logos/sources/Cohere.svg'
  }

  if (normalizedLabel.includes('qwen')) {
    return '/logos/sources/Qwen.svg'
  }

  if (normalizedLabel.includes('hugging face')) {
    return '/logos/sources/Huggingface.svg'
  }

  return null
}

function PlatformIcon({
  category,
  sourceName,
  className = 'h-4 w-4',
}: {
  category?: ApiNewsItem['source']['category']
  sourceName?: string
  className?: string
}) {
  const logoPath = getPlatformLogoPath(sourceName)

  if (logoPath) {
    return <img src={logoPath} alt={`${sourceName ?? 'Source'} logo`} className={`${className} object-contain`} />
  }

  if (category === 'research') {
    return <FlaskConical size={14} className={className.includes('h-5') ? 'h-5 w-5 text-brand-600' : 'text-brand-600'} />
  }

  if (category === 'community') {
    return <Users size={14} className={className.includes('h-5') ? 'h-5 w-5 text-brand-900' : 'text-brand-900'} />
  }

  switch (category) {
    case 'official':
      return <Rss size={14} className={className.includes('h-5') ? 'h-5 w-5 text-brand-accent' : 'text-brand-accent'} />
    default:
      return <Newspaper size={14} className={className.includes('h-5') ? 'h-5 w-5 text-brand-400' : 'text-brand-400'} />
  }
}

function EntityAvatar({
  label,
  className = 'h-5 w-5',
}: {
  label?: string
  className?: string
}) {
  const logoPath = getEntityLogoPath(label)

  if (logoPath) {
    return <img src={logoPath} alt={`${label ?? 'Entity'} logo`} className={`${className} object-contain`} />
  }

  return <Newspaper size={14} className={className.includes('h-5') ? 'h-5 w-5 text-brand-400' : 'text-brand-400'} />
}

export function NewsCard({
  item,
  isBookmarked = false,
  onToggleBookmark,
}: {
  item: ApiNewsItem
  isBookmarked?: boolean
  onToggleBookmark?: (item: ApiNewsItem) => void
}) {
  const publishedDate = item.publishedAt ? new Date(item.publishedAt) : null
  const timeAgo = publishedDate
    ? formatDistanceToNow(publishedDate, {
        addSuffix: true,
        locale: enUS,
      })
    : 'Recently'
  const absoluteDate = publishedDate ? format(publishedDate, 'MMM d, yyyy') : null
  const destinationUrl = item.link ?? item.source.url
  const sourceLabel = item.source.name.toLowerCase().startsWith('x / ') ? 'X' : item.source.name
  const isXSource = sourceLabel === 'X'
  const authorLabel = isXSource
    ? (item.author || item.company || item.source.name)
    : (item.company || item.author || item.source.name)
  const showAuthorAvatar = Boolean(item.authorAvatarUrl && isXSource)
  const displayCompany = shouldDisplayCompanyChip(item, isXSource) ? item.company : undefined
  const metadataChips = [
    displayCompany ? { label: displayCompany, icon: <Tags size={12} /> } : null,
    item.modelFamily ? { label: item.modelFamily, icon: <Layers3 size={12} /> } : null,
    item.contentType ? { label: capitalize(item.contentType), icon: <Newspaper size={12} /> } : null,
  ].filter(Boolean) as Array<{ label: string; icon: ReactNode }>

  return (
    <article className="group flex flex-col gap-5 rounded-[8px] border border-brand-200 bg-white p-5 shadow-sm transition-all hover:shadow-lg sm:flex-row sm:p-7">
      <div className="hidden flex-shrink-0 flex-col items-center pt-1 sm:flex">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100">
          {showAuthorAvatar ? (
            <img
              src={item.authorAvatarUrl}
              alt={`${authorLabel} avatar`}
              className="h-11 w-11 rounded-full object-cover"
            />
          ) : (
            <EntityAvatar label={authorLabel} className="h-5 w-5" />
          )}
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-hidden text-sm text-brand-500">
            <span className="truncate font-semibold text-brand-800">{authorLabel}</span>
            <span className="hidden text-brand-300 sm:inline">&bull;</span>
            <span className="flex flex-shrink-0 items-center gap-1.5">
              <PlatformIcon category={item.source.category} sourceName={item.source.name} className="h-3.5 w-3.5" />
              <span className="truncate">{sourceLabel}</span>
            </span>
            <span className="text-brand-300">&bull;</span>
            <time className="flex-shrink-0 whitespace-nowrap">{timeAgo}</time>
          </div>

          <a
            href={destinationUrl}
            target="_blank"
            rel="noreferrer"
            className="p-2 text-brand-300 transition-colors hover:text-brand-accent sm:opacity-0 group-hover:opacity-100"
            title="Open original source"
          >
            <ExternalLink size={18} />
          </a>
        </div>

        {metadataChips.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {metadataChips.map((chip) => (
              <span
                key={chip.label}
                className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-[12px] font-semibold tracking-[0.01em] text-brand-accent"
              >
                {chip.icon}
                {chip.label}
              </span>
            ))}
          </div>
        )}

        <a href={destinationUrl} target="_blank" rel="noreferrer" className="block group/title">
          <h3 className="mb-3 text-[1.45rem] font-bold leading-[1.15] tracking-[-0.025em] text-brand-900 transition-colors duration-200 group-hover/title:text-brand-accent sm:text-[1.65rem]">
            {item.title}
          </h3>
          <p className="mb-4 text-base leading-[1.55] text-brand-500 sm:text-[1.05rem]">{item.summary}</p>
        </a>

        {absoluteDate && (
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
            <CalendarDays size={14} />
            <span>{absoluteDate}</span>
          </div>
        )}

        <div className="mt-auto flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex flex-wrap gap-2">
            {item.keywords.map((keyword) => (
              <span
                key={keyword}
                className="rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-[12px] font-semibold tracking-[0.01em] text-brand-700"
              >
                {keyword}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-4 text-sm font-medium text-brand-400">
            {isXSource && (
              <div className="flex items-center gap-5 whitespace-nowrap text-brand-500">
                {typeof item.likeCount === 'number' && item.likeCount >= 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <Heart size={16} className="text-brand-400" />
                    <span>{formatMetricCount(item.likeCount)}</span>
                  </span>
                )}
                {typeof item.retweetCount === 'number' && item.retweetCount >= 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <Repeat2 size={16} className="text-brand-400" />
                    <span>{formatMetricCount(item.retweetCount)}</span>
                  </span>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => onToggleBookmark?.(item)}
              className={`ml-auto flex items-center gap-1.5 p-2 transition-colors hover:text-brand-accent sm:ml-0 ${
                isBookmarked ? 'text-brand-accent' : ''
              }`}
              title={isBookmarked ? 'Remove bookmark' : 'Save bookmark'}
            >
              <BookmarkPlus size={20} className={isBookmarked ? 'fill-current' : ''} />
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

function capitalize(input: string): string {
  return input.charAt(0).toUpperCase() + input.slice(1)
}

function formatMetricCount(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1).replace(/\.0$/, '')}M`
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1).replace(/\.0$/, '')}K`
  }

  return String(value)
}

function shouldDisplayCompanyChip(item: ApiNewsItem, isXSource: boolean): boolean {
  if (!item.company) {
    return false
  }

  if (!isXSource || !item.author) {
    return true
  }

  return item.company.toLowerCase() !== item.author.toLowerCase()
}

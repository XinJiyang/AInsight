import { useEffect, useMemo, useRef, useState } from 'react'
import { useOutletContext } from 'react-router'
import { AlertCircle } from 'lucide-react'

import { CrawlStatusPanel } from '../components/CrawlStatusPanel'
import { TrendingKeywords } from '../components/TrendingKeywords'
import { NewsFeed } from '../components/NewsFeed'
import { NewsCardSkeleton } from '../components/NewsCardSkeleton'
import { AISummaryPanel } from '../components/AISummaryPanel'
import { useAuth } from '../auth/AuthContext'
import {
  DEMO_MODE,
  demoFeedSummary,
  getDemoBookmarkIds,
  loadDemoKeywordsResponse,
  loadDemoNewsResponse,
  loadDemoStatusResponse,
  subscribeToDemoBookmarks,
  toggleDemoBookmark,
} from '../demo'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import type { AppContext } from '../layouts/RootLayout'
import type {
  ApiKeywordItem,
  ApiKeywordsResponse,
  ApiNewsItem,
  ApiFeedSummaryResponse,
  ApiNewsResponse,
  ApiSystemStatusResponse,
} from '../types/news'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'
const INITIAL_VISIBLE_ITEMS = 8
const LOAD_MORE_STEP = 6
const INITIAL_SKELETON_COUNT = 4
const LOAD_MORE_SKELETON_COUNT = 2

export function FeedPage() {
  const { searchQuery } = useOutletContext<AppContext>()
  const { user, authHeaders, isAdmin } = useAuth()
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null)
  const [selectedSource, setSelectedSource] = useState<string | null>(null)
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null)
  const [selectedModelFamily, setSelectedModelFamily] = useState<string | null>(null)
  const [selectedContentType, setSelectedContentType] = useState<string | null>(null)
  const [items, setItems] = useState<ApiNewsItem[]>([])
  const [keywords, setKeywords] = useState<ApiKeywordItem[]>([])
  const [fetchedAt, setFetchedAt] = useState<string | null>(null)
  const [errors, setErrors] = useState<ApiNewsResponse['errors']>([])
  const [status, setStatus] = useState<ApiSystemStatusResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [feedSummary, setFeedSummary] = useState<ApiFeedSummaryResponse['summary'] | null>(null)
  const [isSummaryLoading, setIsSummaryLoading] = useState(false)
  const [summaryError, setSummaryError] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_ITEMS)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set())
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (DEMO_MODE) {
      void (async () => {
        try {
          setIsLoading(true)
          setLoadError(null)
          const [newsData, keywordsData, statusData] = await Promise.all([
            loadDemoNewsResponse(),
            loadDemoKeywordsResponse(),
            loadDemoStatusResponse(),
          ])

          setItems(newsData.items)
          setFetchedAt(newsData.fetchedAt)
          setErrors(newsData.errors ?? [])
          setKeywords(keywordsData.items)
          setStatus(statusData)
        } catch (error) {
          setLoadError(error instanceof Error ? error.message : 'Unable to load demo data')
        } finally {
          setIsLoading(false)
        }
      })()
      return
    }

    const controller = new AbortController()

    async function loadData() {
      try {
        setIsLoading(true)
        setLoadError(null)

        const [newsResponse, keywordsResponse, statusResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/news`, { signal: controller.signal }),
          fetch(`${API_BASE_URL}/api/keywords?limit=12`, { signal: controller.signal }),
          fetch(`${API_BASE_URL}/api/system/status`, { signal: controller.signal }),
        ])

        if (!newsResponse.ok) {
          throw new Error(`Failed to load news: ${newsResponse.status}`)
        }

        if (!keywordsResponse.ok) {
          throw new Error(`Failed to load keywords: ${keywordsResponse.status}`)
        }

        if (!statusResponse.ok) {
          throw new Error(`Failed to load system status: ${statusResponse.status}`)
        }

        const newsData = (await newsResponse.json()) as ApiNewsResponse
        const keywordsData = (await keywordsResponse.json()) as ApiKeywordsResponse
        const statusData = (await statusResponse.json()) as ApiSystemStatusResponse

        setItems(newsData.items)
        setFetchedAt(newsData.fetchedAt)
        setErrors(newsData.errors ?? [])
        setKeywords(keywordsData.items)
        setStatus(statusData)
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }

        setLoadError(error instanceof Error ? error.message : 'Unknown request error')
      } finally {
        setIsLoading(false)
      }
    }

    void loadData()

    return () => {
      controller.abort()
    }
  }, [])

  useEffect(() => {
    if (!user) {
      setBookmarkedIds(new Set())
      return
    }

    if (DEMO_MODE) {
      setBookmarkedIds(getDemoBookmarkIds())

      return subscribeToDemoBookmarks(() => {
        setBookmarkedIds(getDemoBookmarkIds())
      })
    }

    let active = true

    async function loadBookmarkIds() {
      const response = await fetch(`${API_BASE_URL}/api/bookmarks/ids`, {
        headers: authHeaders(),
      })

      if (!response.ok) {
        return
      }

      const payload = (await response.json()) as { ids?: string[] }

      if (active) {
        setBookmarkedIds(new Set(payload.ids ?? []))
      }
    }

    void loadBookmarkIds()

    return () => {
      active = false
    }
  }, [user, authHeaders])

  async function handleToggleBookmark(item: ApiNewsItem) {
    if (!user) {
      window.location.href = '/login'
      return
    }

    const isBookmarked = bookmarkedIds.has(item.id)
    const nextBookmarkedIds = new Set(bookmarkedIds)

    if (isBookmarked) {
      nextBookmarkedIds.delete(item.id)
    } else {
      nextBookmarkedIds.add(item.id)
    }

    setBookmarkedIds(nextBookmarkedIds)

    if (DEMO_MODE) {
      setBookmarkedIds(toggleDemoBookmark(item.id))
      return
    }

    const response = await fetch(`${API_BASE_URL}/api/bookmarks/${encodeURIComponent(item.id)}`, {
      method: isBookmarked ? 'DELETE' : 'POST',
      headers: authHeaders(),
    })

    if (!response.ok) {
      setBookmarkedIds(bookmarkedIds)
    }
  }

  async function handleManualRefresh() {
    if (DEMO_MODE) {
      setIsRefreshing(true)
      window.setTimeout(() => {
        const refreshedAt = new Date().toISOString()
        setFetchedAt(refreshedAt)
        setStatus((current) =>
          current
            ? {
                ...current,
                crawler: {
                  ...current.crawler,
                  lastRunStartedAt: refreshedAt,
                  lastRunFinishedAt: refreshedAt,
                  lastRunTrigger: 'manual',
                },
              }
            : current,
        )
        setIsRefreshing(false)
      }, 450)
      return
    }

    try {
      setIsRefreshing(true)

      const refreshResponse = await fetch(`${API_BASE_URL}/api/news/refresh`, {
        method: 'POST',
        headers: authHeaders(),
      })

      if (!refreshResponse.ok) {
        throw new Error(`Failed to refresh news: ${refreshResponse.status}`)
      }

      const [newsResponse, keywordsResponse, statusResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/news`),
        fetch(`${API_BASE_URL}/api/keywords?limit=12`),
        fetch(`${API_BASE_URL}/api/system/status`),
      ])

      const newsData = (await newsResponse.json()) as ApiNewsResponse
      const keywordsData = (await keywordsResponse.json()) as ApiKeywordsResponse
      const statusData = (await statusResponse.json()) as ApiSystemStatusResponse

      setItems(newsData.items)
      setFetchedAt(newsData.fetchedAt)
      setErrors(newsData.errors ?? [])
      setKeywords(keywordsData.items)
      setStatus(statusData)
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unknown refresh error')
    } finally {
      setIsRefreshing(false)
    }
  }

  async function handleSummarizeFeed() {
    if (DEMO_MODE) {
      setSummaryError(null)
      setIsSummaryLoading(true)
      window.setTimeout(() => {
        setFeedSummary(demoFeedSummary)
        setIsSummaryLoading(false)
      }, 500)
      return
    }

    try {
      setSummaryError(null)
      setIsSummaryLoading(true)

      const response = await fetch(`${API_BASE_URL}/api/summary/feed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({
          articles: filteredData.slice(0, 12).map((item) => ({
            id: item.id,
            title: item.title,
            summary: item.summary,
            keywords: item.keywords,
            company: item.company,
            modelFamily: item.modelFamily,
            contentType: item.contentType,
            source: item.source,
            publishedAt: item.publishedAt,
            link: item.link,
            author: item.author,
          })),
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error ?? `Failed to generate summary: ${response.status}`)
      }

      const data = (await response.json()) as ApiFeedSummaryResponse
      setFeedSummary(data.summary)
    } catch (error) {
      setFeedSummary(null)
      setSummaryError(error instanceof Error ? error.message : 'Unknown summary error')
    } finally {
      setIsSummaryLoading(false)
    }
  }

  const sourceOptions = useMemo(() => buildCountOptions(items, (item) => normalizeSourceFilterValue(item.source.name)), [items])
  const companyOptions = useMemo(() => buildCountOptions(items, resolveCompanyFilterValue), [items])
  const modelFamilyOptions = useMemo(() => buildCountOptions(items, (item) => item.modelFamily), [items])
  const contentTypeOptions = useMemo(() => buildCountOptions(items, (item) => item.contentType), [items])

  const filteredData = useMemo(() => {
    const filteredItems = items.filter((item) => {
      const matchesKeyword = selectedKeyword ? item.keywords.includes(selectedKeyword) : true
      const matchesSource = selectedSource ? normalizeSourceFilterValue(item.source.name) === selectedSource : true
      const matchesCompany = selectedCompany ? resolveCompanyFilterValue(item) === selectedCompany : true
      const matchesModelFamily = selectedModelFamily ? item.modelFamily === selectedModelFamily : true
      const matchesContentType = selectedContentType ? item.contentType === selectedContentType : true
      const matchesSearch = searchQuery
        ? item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.summary.toLowerCase().includes(searchQuery.toLowerCase())
        : true

      return (
        matchesKeyword &&
        matchesSource &&
        matchesCompany &&
        matchesModelFamily &&
        matchesContentType &&
        matchesSearch
      )
    })

    return [...filteredItems].sort((left, right) => compareByDate(right.publishedAt, left.publishedAt))
  }, [
    items,
    selectedKeyword,
    selectedSource,
    selectedCompany,
    selectedModelFamily,
    selectedContentType,
    searchQuery,
  ])

  const activeFilterCount = [
    selectedKeyword,
    selectedSource,
    selectedCompany,
    selectedModelFamily,
    selectedContentType,
  ].filter(Boolean).length

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_ITEMS)
    setIsLoadingMore(false)
  }, [
    selectedKeyword,
    selectedSource,
    selectedCompany,
    selectedModelFamily,
    selectedContentType,
    searchQuery,
    items,
  ])

  const visibleItems = useMemo(
    () => filteredData.slice(0, visibleCount),
    [filteredData, visibleCount],
  )
  const hasMoreItems = visibleCount < filteredData.length

  useEffect(() => {
    if (isLoading || loadError || !hasMoreItems || isLoadingMore || !loadMoreRef.current) {
      return
    }

    const target = loadMoreRef.current
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries

        if (!entry?.isIntersecting || isLoadingMore) {
          return
        }

        setIsLoadingMore(true)

        window.setTimeout(() => {
          setVisibleCount((current) => Math.min(current + LOAD_MORE_STEP, filteredData.length))
          setIsLoadingMore(false)
        }, 450)
      },
      {
        rootMargin: '320px 0px',
      },
    )

    observer.observe(target)

    return () => {
      observer.disconnect()
    }
  }, [filteredData.length, hasMoreItems, isLoading, isLoadingMore, loadError])

  function clearFilters() {
    setSelectedKeyword(null)
    setSelectedSource(null)
    setSelectedCompany(null)
    setSelectedModelFamily(null)
    setSelectedContentType(null)
  }

  return (
    <main className="mx-auto flex w-full max-w-[1400px] flex-col gap-8 px-4 pb-10 pt-[26px] lg:flex-row xl:px-6">
      <aside className="w-full flex-shrink-0 lg:w-64">
        <div className="lg:fixed lg:left-[max(1rem,calc((100vw-87.5rem)/2+1.5rem))] lg:top-[147px] lg:w-64">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-brand-900">
            <span className="text-brand-accent">#</span> Trending Keywords
          </h2>
          <TrendingKeywords keywords={keywords} selected={selectedKeyword} onSelect={setSelectedKeyword} />
          <div className="mt-6 hidden lg:block xl:hidden">
            <AISummaryPanel
              summary={feedSummary}
              isLoading={isSummaryLoading}
              error={summaryError}
              itemCount={filteredData.length}
              onGenerate={handleSummarizeFeed}
              canGenerate={isAdmin}
            />
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_280px] xl:gap-6">
          <div className="min-w-0">
            <div className="relative mb-8 overflow-hidden rounded-[8px] border border-brand-200 bg-[#181511] shadow-sm">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: "url('/images/hero/top-story.png')", backgroundPosition: 'center 34%' }}
              />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(18,15,12,0.88)_0%,rgba(18,15,12,0.68)_44%,rgba(18,15,12,0.54)_100%)]" />
              <div className="relative z-10 flex flex-col justify-between gap-5 p-5 sm:flex-row sm:items-end sm:p-6">
                <div>
                  <p className="mb-2 inline-flex items-center rounded-full bg-brand-accent px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white shadow-sm">
                    Live AI Briefing
                  </p>
                  <h1 className="mb-3 max-w-3xl text-[2.15rem] font-bold leading-[0.98] tracking-[-0.04em] text-white sm:text-[2.7rem]">
                    AI Real-time Insights
                  </h1>
                  <p className="max-w-2xl text-[1.05rem] font-medium leading-7 text-white/84">
                    Aggregated from official AI sources with extracted keywords and source links
                  </p>
                </div>
                <div className="inline-flex w-fit items-center whitespace-nowrap rounded-full border border-white/18 bg-black/24 px-3 py-1.5 text-sm font-medium text-white/85 shadow-sm backdrop-blur-sm">
                  <span className="mr-1.5 text-white/70">Updated at</span>
                  <span className="font-semibold text-white">
                    {fetchedAt
                      ? new Date(fetchedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                      : '--:--'}
                  </span>
                </div>
              </div>
            </div>

            {isAdmin && (
              <CrawlStatusPanel
                status={status}
                isRefreshing={isRefreshing}
                onRefresh={handleManualRefresh}
                canRefresh={isAdmin}
              />
            )}

        <div className="mb-6 rounded-[8px] border border-brand-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-500">
                Filter by
              </span>
              <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
                {filteredData.length} results
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.15fr)_auto] xl:items-center">
              <div className="min-w-0">
                <FilterSelect
                  placeholder="All Companies"
                  value={selectedCompany}
                  items={companyOptions}
                  onValueChange={setSelectedCompany}
                  formatter={(value) => value}
                />
              </div>
              <div className="min-w-0">
                <FilterSelect
                  placeholder="All Models"
                  value={selectedModelFamily}
                  items={modelFamilyOptions}
                  onValueChange={setSelectedModelFamily}
                  formatter={(value) => value}
                />
              </div>
              <div className="min-w-0">
                <FilterSelect
                  placeholder="All Types"
                  value={selectedContentType}
                  items={contentTypeOptions}
                  onValueChange={setSelectedContentType}
                  formatter={(value) => capitalize(value)}
                />
              </div>
              <div className="min-w-0">
                <FilterSelect
                  placeholder="All Sources"
                  value={selectedSource}
                  items={sourceOptions}
                  onValueChange={setSelectedSource}
                  formatter={(value) => value}
                />
              </div>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-[8px] border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50 xl:justify-self-end"
                >
                  Clear filters ({activeFilterCount})
                </button>
              )}
            </div>
          </div>
        </div>

        {errors && errors.length > 0 && (
          <div className="mb-4 flex items-start gap-3 rounded-[8px] border border-brand-200 bg-white px-4 py-3 text-sm text-brand-700 shadow-sm">
            <AlertCircle size={18} className="mt-0.5 flex-shrink-0 text-brand-accent" />
            <div>
              <p className="font-semibold">Some sources could not be refreshed.</p>
              <p>{errors.map((error) => error.sourceName).join(', ')}</p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col gap-6">
            {Array.from({ length: INITIAL_SKELETON_COUNT }).map((_, index) => (
              <NewsCardSkeleton key={`initial-skeleton-${index}`} />
            ))}
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center rounded-[8px] border border-dashed border-brand-300 bg-white py-24 text-center">
            <AlertCircle size={48} className="text-brand-accent mb-4" />
            <h3 className="mb-2 text-xl font-semibold text-brand-800">
              Unable to load real-time data
            </h3>
            <p className="max-w-md text-center text-sm text-brand-500">
              {loadError}. Make sure the API is running on <code>{API_BASE_URL}</code>.
            </p>
          </div>
        ) : (
          <>
            <NewsFeed items={visibleItems} bookmarkedIds={bookmarkedIds} onToggleBookmark={handleToggleBookmark} />

            {hasMoreItems && (
              <div ref={loadMoreRef} className="mt-6">
                {isLoadingMore && (
                  <div className="flex flex-col gap-6">
                    {Array.from({ length: LOAD_MORE_SKELETON_COUNT }).map((_, index) => (
                      <NewsCardSkeleton key={`load-more-skeleton-${index}`} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
          </div>

          <div className="mt-6 hidden xl:block xl:mt-0">
            <AISummaryPanel
              summary={feedSummary}
              isLoading={isSummaryLoading}
              error={summaryError}
              itemCount={filteredData.length}
              onGenerate={handleSummarizeFeed}
              canGenerate={isAdmin}
            />
          </div>
        </div>
      </div>
    </main>
  )
}

function buildCountOptions(
  items: ApiNewsItem[],
  resolver: (item: ApiNewsItem) => string | undefined,
) {
  const counts = new Map<string, number>()

  items.forEach((item) => {
    const value = resolver(item)
    if (!value) {
      return
    }

    counts.set(value, (counts.get(value) ?? 0) + 1)
  })

  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}

function normalizeSourceFilterValue(sourceName?: string): string | undefined {
  if (!sourceName) {
    return undefined
  }

  return sourceName.toLowerCase().startsWith('x / ') ? 'X' : sourceName
}

function resolveCompanyFilterValue(item: ApiNewsItem): string | undefined {
  if (isPersonalXPost(item)) {
    return undefined
  }

  return item.company
}

function isPersonalXPost(item: ApiNewsItem): boolean {
  const isXSource = item.source.name.toLowerCase().startsWith('x / ')

  if (!isXSource || !item.company || !item.author) {
    return false
  }

  return item.company.toLowerCase() === item.author.toLowerCase()
}

function FilterSelect({
  placeholder,
  items,
  value,
  onValueChange,
  formatter,
}: {
  placeholder: string
  items: Array<{ name: string; count: number }>
  value: string | null
  onValueChange: (value: string | null) => void
  formatter: (value: string) => string
}) {
  if (items.length === 0) {
    return null
  }

  return (
    <Select value={value ?? '__all__'} onValueChange={(next) => onValueChange(next === '__all__' ? null : next)}>
      <SelectTrigger
        className={`w-full rounded-[8px] border-brand-200 bg-white ${
          value ? 'border-brand-accent/30 text-brand-accent' : 'text-brand-700'
        }`}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all__">{placeholder}</SelectItem>
        {items.map((item) => (
          <SelectItem key={item.name} value={item.name}>
            {formatter(item.name)} ({item.count})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function capitalize(input: string): string {
  return input.charAt(0).toUpperCase() + input.slice(1)
}

function compareByDate(left: string | null | undefined, right: string | null | undefined) {
  const leftTime = left ? new Date(left).getTime() : 0
  const rightTime = right ? new Date(right).getTime() : 0

  return leftTime - rightTime
}

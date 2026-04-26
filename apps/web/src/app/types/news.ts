export interface ApiNewsSource {
  name: string
  url: string
  category?: 'official' | 'research' | 'media' | 'community'
}

export interface ApiNewsItem {
  id: string
  title: string
  summary: string
  keywords: string[]
  company?: string
  modelFamily?: string
  contentType?: string
  source: ApiNewsSource
  publishedAt?: string
  link?: string
  author?: string
  authorAvatarUrl?: string
  likeCount?: number
  retweetCount?: number
  sourceType?: 'rss' | 'atom' | 'html'
}

export interface ApiNewsResponse {
  fetchedAt: string
  items: ApiNewsItem[]
  errors?: Array<{
    sourceId: string
    sourceName: string
    message: string
  }>
}

export interface ApiKeywordItem {
  keyword: string
  count: number
}

export interface ApiKeywordsResponse {
  items: ApiKeywordItem[]
}

export interface ApiSystemStatusResponse {
  crawler: {
    enabled: boolean
    schedule: string
    scheduleLabel: string
    running: boolean
    lastRunStartedAt: string | null
    lastRunFinishedAt: string | null
    lastRunTrigger: 'startup' | 'schedule' | 'manual' | null
    lastRunItemCount: number
    lastRunError: string | null
    lastRunSourceCount: number
    lastRunFailedSourceCount: number
  }
  storage: {
    mode: 'database' | 'cache'
    databaseEnabled: boolean
    counts: {
      sources: number
      newsItems: number
    } | null
  }
}

export interface SummaryArticlePayload {
  id: string
  title: string
  summary: string
  keywords: string[]
  company?: string
  modelFamily?: string
  contentType?: string
  source: ApiNewsSource
  publishedAt?: string
  link?: string
  author?: string
}

export interface ApiArticleSummary {
  overview: string
  keyPoints: string[]
  whyItMatters: string
  watchNext: string[]
}

export interface ApiSummaryResponse {
  articleId: string
  cached: boolean
  summary: ApiArticleSummary
}

export interface ApiFeedSummaryResponse {
  cached: boolean
  summary: ApiArticleSummary
}

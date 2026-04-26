export interface NewsSource {
  name: string
  url: string
  category?: 'official' | 'research' | 'media' | 'community'
}

export interface NewsItem {
  id: string
  title: string
  summary: string
  keywords: string[]
  company?: string
  modelFamily?: string
  contentType?: string
  source: NewsSource
  publishedAt?: string
  link?: string
  author?: string
  authorAvatarUrl?: string
  likeCount?: number
  retweetCount?: number
  sourceType?: 'rss' | 'atom' | 'html'
}

export interface SocialSourceConfig {
  id: string
  name: string
  accountHandle: string
  homepageUrl: string
  category: 'official' | 'research' | 'media' | 'community'
  sourceType: 'html'
  displayName?: string
  company?: string
  modelFamily?: string
  maxItems?: number
  latestItems?: number
  topItems?: number
  topWindowDays?: number
}

export interface FeedSourceConfig {
  id: string
  name: string
  homepageUrl: string
  feedUrl: string
  linkPathNeedle?: string
  includePatterns?: string[]
  category: 'official' | 'research' | 'media' | 'community'
  sourceType: 'rss' | 'atom' | 'html'
  maxItems?: number
}

export interface CrawlResult {
  fetchedAt: string
  items: NewsItem[]
  errors?: Array<{
    sourceId: string
    sourceName: string
    message: string
  }>
}

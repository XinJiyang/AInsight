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
  source: NewsSource
  publishedAt?: string
  link?: string
  author?: string
  sourceType?: 'rss' | 'atom'
}

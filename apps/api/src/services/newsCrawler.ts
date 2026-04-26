import { AI_FEED_SOURCES } from '../config/aiSources.js'
import { isDatabaseEnabled } from '../lib/db.js'
import { fetchFeedEntries } from '../lib/feed.js'
import { extractMetadata, summarizeText } from '../lib/text.js'
import { readNewsFromDatabase, writeNewsToDatabase } from './newsRepository.js'
import { crawlSocialSources } from './socialCrawler.js'
import { readNewsCache, writeNewsCache } from './newsStore.js'
import type { CrawlResult, NewsItem } from '../types/news.js'

export async function crawlNewsFeeds(options?: { includeSocial?: boolean }): Promise<CrawlResult> {
  const databaseEnabled = isDatabaseEnabled()
  const includeSocial = options?.includeSocial ?? false
  const itemGroups = await Promise.allSettled(
    AI_FEED_SOURCES.map(async (source) => {
      const entries = await fetchFeedEntries(source)

      return entries.slice(0, source.maxItems ?? 10).map<NewsItem>((entry, index) => {
        const summary = summarizeText(entry.description || entry.title)
        const metadata = extractMetadata(entry.title, summary)
        const stableId = entry.link
          ? `${source.id}-${slugify(new URL(entry.link).pathname)}`
          : `${source.id}-${slugify(entry.title || `${source.name}-${index}`)}`

        return {
          id: stableId,
          title: entry.title,
          summary,
          keywords: metadata.keywords,
          company: metadata.company,
          modelFamily: metadata.modelFamily,
          contentType: metadata.contentType,
          source: {
            name: source.name,
            url: source.homepageUrl,
            category: source.category,
          },
          publishedAt: entry.publishedAt,
          author: entry.author,
          authorAvatarUrl: undefined,
          link: entry.link,
          sourceType: source.sourceType,
        }
      })
    }),
  )
  const socialResult = includeSocial
    ? await crawlSocialSources()
    : { items: [], errors: [], sourceConfigs: [] }

  const items = [
    ...itemGroups.flatMap((result) => (result.status === 'fulfilled' ? result.value : [])),
    ...socialResult.items,
  ]
  const errors = itemGroups.flatMap((result, index) => {
    if (result.status === 'fulfilled') {
      return []
    }

    const source = AI_FEED_SOURCES[index]
    return [
      {
        sourceId: source.id,
        sourceName: source.name,
        message: result.reason instanceof Error ? result.reason.message : String(result.reason),
      },
    ]
  })
  const mergedErrors = [...errors, ...socialResult.errors]
  const uniqueItems = dedupeAndSort(items)
  const payload: CrawlResult = {
    fetchedAt: new Date().toISOString(),
    items: uniqueItems,
    errors: mergedErrors,
  }

  if (databaseEnabled) {
    await writeNewsToDatabase(payload, [...AI_FEED_SOURCES, ...socialResult.sourceConfigs])
  }

  if (!databaseEnabled) {
    await writeNewsCache(payload)
  }

  return payload
}

export async function getNewsFeed(): Promise<CrawlResult> {
  const databaseEnabled = isDatabaseEnabled()

  if (databaseEnabled) {
    const databaseItems = await readNewsFromDatabase()
    if (databaseItems?.items.length) {
      return databaseItems
    }

    return crawlNewsFeeds()
  }

  const cached = await readNewsCache()
  if (cached?.items.length) {
    return cached
  }

  return crawlNewsFeeds()
}

function dedupeAndSort(items: NewsItem[]): NewsItem[] {
  const seen = new Set<string>()
  const deduped: NewsItem[] = []

  for (const item of items) {
    const key = item.link || `${item.source.name}-${item.title}`
    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    deduped.push(item)
  }

  return deduped.sort((a, b) => {
    const aTime = a.publishedAt ? Date.parse(a.publishedAt) : 0
    const bTime = b.publishedAt ? Date.parse(b.publishedAt) : 0
    return bTime - aTime
  })
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

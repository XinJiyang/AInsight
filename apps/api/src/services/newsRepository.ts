import { FeedType, SourceCategory } from '@prisma/client'

import { prisma } from '../lib/db.js'
import type { CrawlResult, FeedSourceConfig, NewsItem } from '../types/news.js'

type NewsItemWithSource = {
  externalId: string
  title: string
  summary: string
  keywords: string[]
  company: string | null
  modelFamily: string | null
  contentType: string | null
  author: string | null
  authorAvatarUrl: string | null
  likeCount: number | null
  retweetCount: number | null
  link: string | null
  publishedAt: Date | null
  source: {
    name: string
    homepageUrl: string
    category: SourceCategory
    sourceType: FeedType
  }
}

export async function readNewsFromDatabase(): Promise<CrawlResult | null> {
  const [items, sourceCount] = await Promise.all([
    prisma.newsItem.findMany({
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        source: true,
      },
      take: 100,
    }),
    prisma.source.count(),
  ])

  if (sourceCount === 0 || items.length === 0) {
    return null
  }

  return {
    fetchedAt: new Date().toISOString(),
    items: items.map(mapDatabaseNewsItem),
    errors: [],
  }
}

export function mapDatabaseNewsItem(item: NewsItemWithSource): NewsItem {
  return {
    id: item.externalId,
    title: item.title,
    summary: item.summary,
    keywords: item.keywords,
    company: item.company ?? undefined,
    modelFamily: item.modelFamily ?? undefined,
    contentType: item.contentType ?? undefined,
    author: item.author ?? undefined,
    authorAvatarUrl: item.authorAvatarUrl ?? undefined,
    likeCount: item.likeCount ?? undefined,
    retweetCount: item.retweetCount ?? undefined,
    link: item.link ?? undefined,
    publishedAt: item.publishedAt?.toISOString(),
    sourceType: item.source.sourceType as NewsItem['sourceType'],
    source: {
      name: item.source.name,
      url: item.source.homepageUrl,
      category: item.source.category as NewsItem['source']['category'],
    },
  }
}

export async function getDatabaseCounts(): Promise<{ sources: number; newsItems: number }> {
  const [sources, newsItems] = await Promise.all([prisma.source.count(), prisma.newsItem.count()])

  return {
    sources,
    newsItems,
  }
}

export async function writeNewsToDatabase(
  result: CrawlResult,
  sourceConfigs: FeedSourceConfig[],
): Promise<void> {
  const sourceMap = new Map<string, string>()

  for (const sourceConfig of sourceConfigs) {
    const source = await prisma.source.upsert({
      where: {
        sourceKey: sourceConfig.id,
      },
      create: {
        sourceKey: sourceConfig.id,
        name: sourceConfig.name,
        homepageUrl: sourceConfig.homepageUrl,
        category: sourceConfig.category as SourceCategory,
        sourceType: sourceConfig.sourceType as FeedType,
      },
      update: {
        name: sourceConfig.name,
        homepageUrl: sourceConfig.homepageUrl,
        category: sourceConfig.category as SourceCategory,
        sourceType: sourceConfig.sourceType as FeedType,
      },
    })

    sourceMap.set(sourceConfig.name, source.id)
  }

  for (const sourceConfig of sourceConfigs) {
    const sourceId = sourceMap.get(sourceConfig.name)
    if (!sourceId) {
      continue
    }

    const activeExternalIds = result.items
      .filter((item) => item.source.name === sourceConfig.name)
      .map((item) => item.id)

    await prisma.newsItem.deleteMany({
      where: {
        sourceId,
        externalId: {
          notIn: activeExternalIds.length > 0 ? activeExternalIds : ['__keep_none__'],
        },
      },
    })
  }

  for (const item of result.items) {
    const sourceId = sourceMap.get(item.source.name)
    if (!sourceId) {
      continue
    }

    await prisma.newsItem.upsert({
      where: {
        externalId: item.id,
      },
      create: {
        externalId: item.id,
        title: item.title,
        summary: item.summary,
        keywords: item.keywords,
        company: item.company,
        modelFamily: item.modelFamily,
        contentType: item.contentType,
        author: item.author,
        authorAvatarUrl: item.authorAvatarUrl,
        likeCount: item.likeCount,
        retweetCount: item.retweetCount,
        link: item.link,
        publishedAt: item.publishedAt ? new Date(item.publishedAt) : null,
        sourceId,
      },
      update: {
        title: item.title,
        summary: item.summary,
        keywords: item.keywords,
        company: item.company,
        modelFamily: item.modelFamily,
        contentType: item.contentType,
        author: item.author,
        authorAvatarUrl: item.authorAvatarUrl,
        likeCount: item.likeCount,
        retweetCount: item.retweetCount,
        link: item.link,
        publishedAt: item.publishedAt ? new Date(item.publishedAt) : null,
        sourceId,
      },
    })
  }
}

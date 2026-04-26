import { getNewsFeed } from './newsCrawler.js'

export interface KeywordCount {
  keyword: string
  count: number
}

export async function getKeywordCounts(limit = 20): Promise<KeywordCount[]> {
  const feed = await getNewsFeed()
  const counts = new Map<string, number>()

  for (const item of feed.items) {
    for (const keyword of item.keywords) {
      counts.set(keyword, (counts.get(keyword) ?? 0) + 1)
    }
  }

  return [...counts.entries()]
    .map(([keyword, count]) => ({ keyword, count }))
    .sort((a, b) => b.count - a.count || a.keyword.localeCompare(b.keyword))
    .slice(0, limit)
}

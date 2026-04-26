import { getEnabledXAccountSources, toFeedSourceConfig } from '../config/socialSources.js'
import { extractMetadata, summarizeText } from '../lib/text.js'
import type { CrawlResult, FeedSourceConfig, NewsItem } from '../types/news.js'
import type { TwitterApiTweet } from '../types/social.js'
import { getUserLastTweets, isTwitterApiEnabled, searchTweets } from './twitterApiClient.js'

export async function crawlSocialSources(): Promise<{
  items: NewsItem[]
  errors: NonNullable<CrawlResult['errors']>
  sourceConfigs: FeedSourceConfig[]
}> {
  if (!isTwitterApiEnabled()) {
    return {
      items: [],
      errors: [],
      sourceConfigs: [],
    }
  }

  const socialSources = getEnabledXAccountSources()
  const delayMs = Number(process.env.TWITTERAPI_IO_DELAY_MS ?? '1200')
  const retryDelayMs = Number(process.env.TWITTERAPI_IO_RETRY_DELAY_MS ?? '3000')
  const maxAttempts = Number(process.env.TWITTERAPI_IO_MAX_ATTEMPTS ?? '2')
  const includeTopPosts = process.env.TWITTERAPI_IO_INCLUDE_TOP_POSTS === 'true'
  const items: NewsItem[] = []
  const errors: NonNullable<CrawlResult['errors']> = []

  for (const [index, source] of socialSources.entries()) {
    try {
      const latestTweets = await getTweetsWithRetry(
        source.accountHandle,
        {
          count: source.latestItems ?? 1,
          includeReplies: false,
        },
        maxAttempts,
        retryDelayMs,
      )

      let topTweets: TwitterApiTweet[] = []

      if (includeTopPosts && (source.topItems ?? 0) > 0) {
        await sleep(delayMs)
        topTweets = await searchTopTweetsWithRetry(
          source.accountHandle,
          source.topItems ?? 2,
          source.topWindowDays ?? 7,
          maxAttempts,
          retryDelayMs,
        )
      }

      const tweets = dedupeTweets([...latestTweets, ...topTweets])

      const nextItems = tweets
        .filter((tweet) => isEligibleTweet(tweet))
        .slice(0, source.maxItems ?? 5)
        .map<NewsItem>((tweet, itemIndex) => {
          const summary = summarizeText(tweet.text || '')
          const metadata = extractMetadata(tweet.text || source.name, summary)
          const title = summarizeTweetTitle(tweet.text || source.name)
          const authorName = tweet.author?.name || source.displayName || `@${source.accountHandle}`
          const keywords = removeAuthorKeyword(metadata.keywords, authorName)

          return {
            id: `${source.id}-${tweet.id || `${source.accountHandle}-${itemIndex}`}`,
            title,
            summary,
            keywords,
            company: source.company ?? metadata.company,
            modelFamily: metadata.modelFamily ?? source.modelFamily,
            contentType: metadata.contentType ?? 'social',
            source: {
              name: source.name,
              url: source.homepageUrl,
              category: source.category,
            },
            publishedAt: tweet.createdAt,
            author: authorName,
            authorAvatarUrl: tweet.author?.profilePicture,
            likeCount: tweet.likeCount,
            retweetCount: tweet.retweetCount,
            link: tweet.url || `${source.homepageUrl}/status/${tweet.id}`,
            sourceType: 'html',
          }
        })

      items.push(...nextItems)
    } catch (error) {
      errors.push({
        sourceId: source.id,
        sourceName: source.name,
        message: error instanceof Error ? error.message : String(error),
      })
    }

    if (index < socialSources.length - 1 && delayMs > 0) {
      await sleep(delayMs)
    }
  }

  return {
    items,
    errors,
    sourceConfigs: socialSources.map(toFeedSourceConfig),
  }
}

function isEligibleTweet(tweet: TwitterApiTweet): boolean {
  if (!tweet.text?.trim()) {
    return false
  }

  if (tweet.isReply) {
    return false
  }

  if (tweet.retweeted_tweet?.id) {
    return false
  }

  return !tweet.text.trim().startsWith('RT @')
}

function summarizeTweetTitle(text: string): string {
  const normalized = text.replace(/\s+/g, ' ').trim()
  const firstSentence = normalized.split(/(?<=[.!?])\s+/)[0]?.trim() ?? normalized
  const titleCandidate = firstSentence.length > 110 ? `${firstSentence.slice(0, 107).trim()}...` : firstSentence

  return titleCandidate || 'New X post'
}

async function searchTopTweetsWithRetry(
  userName: string,
  count: number,
  recentDays: number,
  maxAttempts: number,
  retryDelayMs: number,
) {
  let lastError: unknown
  const query = buildTopTweetsQuery(userName, recentDays)

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await searchTweets(query, {
        queryType: 'Top',
        count: Math.max(count * 2, count),
      })

      return (response.tweets ?? [])
        .filter((tweet) => isEligibleTweet(tweet))
        .sort((a, b) => {
          const aScore = (a.likeCount ?? 0) * 10 + (a.retweetCount ?? 0) * 12 + (a.quoteCount ?? 0) * 14
          const bScore = (b.likeCount ?? 0) * 10 + (b.retweetCount ?? 0) * 12 + (b.quoteCount ?? 0) * 14
          return bScore - aScore
        })
        .slice(0, count)
    } catch (error) {
      lastError = error
      const message = error instanceof Error ? error.message : String(error)
      const isRateLimit = message.includes('429')

      if (!isRateLimit || attempt === maxAttempts) {
        break
      }

      await sleep(retryDelayMs * attempt)
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError))
}

async function getTweetsWithRetry(
  userName: string,
  options: {
    count?: number
    includeReplies?: boolean
  },
  maxAttempts: number,
  retryDelayMs: number,
) {
  let lastError: unknown

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await getUserLastTweets(userName, options)
    } catch (error) {
      lastError = error
      const message = error instanceof Error ? error.message : String(error)
      const isRateLimit = message.includes('429')

      if (!isRateLimit || attempt === maxAttempts) {
        break
      }

      await sleep(retryDelayMs * attempt)
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError))
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function dedupeTweets(tweets: TwitterApiTweet[]): TwitterApiTweet[] {
  const seen = new Set<string>()

  return tweets.filter((tweet) => {
    if (!tweet.id || seen.has(tweet.id)) {
      return false
    }

    seen.add(tweet.id)
    return true
  })
}

function buildTopTweetsQuery(userName: string, recentDays: number): string {
  const nowEpochSeconds = Math.floor(Date.now() / 1000)
  const sinceEpochSeconds = nowEpochSeconds - recentDays * 24 * 60 * 60

  return `from:${userName} since_time:${sinceEpochSeconds} until_time:${nowEpochSeconds}`
}

function removeAuthorKeyword(keywords: string[], authorName: string): string[] {
  const normalizedAuthor = authorName.toLowerCase()
  const authorParts = normalizedAuthor.split(/\s+/).filter(Boolean)

  return keywords.filter((keyword) => {
    const normalizedKeyword = keyword.toLowerCase()

    if (normalizedKeyword === normalizedAuthor) {
      return false
    }

    return !authorParts.some((part) => part.length > 3 && normalizedKeyword === part)
  })
}

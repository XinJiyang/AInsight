import type { TwitterApiEnvelope, TwitterApiTimelineResponse, TwitterApiTweet } from '../types/social.js'

const TWITTERAPI_IO_BASE_URL = process.env.TWITTERAPI_IO_BASE_URL ?? 'https://api.twitterapi.io'

export function isTwitterApiEnabled(): boolean {
  return Boolean(process.env.TWITTERAPI_IO_KEY)
}

export async function getUserLastTweets(
  userName: string,
  options?: {
    count?: number
    includeReplies?: boolean
  },
): Promise<TwitterApiTweet[]> {
  const apiKey = process.env.TWITTERAPI_IO_KEY

  if (!apiKey) {
    throw new Error('TWITTERAPI_IO_KEY is not configured')
  }

  const url = new URL('/twitter/user/last_tweets', TWITTERAPI_IO_BASE_URL)
  url.searchParams.set('userName', userName)

  if (options?.count) {
    url.searchParams.set('count', String(options.count))
  }

  if (typeof options?.includeReplies === 'boolean') {
    url.searchParams.set('includeReplies', String(options.includeReplies))
  }

  const response = await fetch(url, {
    headers: {
      'X-API-Key': apiKey,
    },
  })

  if (!response.ok) {
    throw new Error(`twitterapi.io request failed for @${userName}: ${response.status}`)
  }

  const payload = (await response.json()) as TwitterApiTimelineResponse | TwitterApiEnvelope
  const tweets = extractTweets(payload)

  return tweets
}

export async function searchTweets(
  query: string,
  options?: {
    queryType?: 'Latest' | 'Top'
    count?: number
    cursor?: string
  },
): Promise<TwitterApiTimelineResponse> {
  const apiKey = process.env.TWITTERAPI_IO_KEY

  if (!apiKey) {
    throw new Error('TWITTERAPI_IO_KEY is not configured')
  }

  const url = new URL('/twitter/tweet/advanced_search', TWITTERAPI_IO_BASE_URL)
  url.searchParams.set('query', query)
  url.searchParams.set('queryType', options?.queryType ?? 'Latest')

  if (options?.count) {
    url.searchParams.set('count', String(options.count))
  }

  if (options?.cursor) {
    url.searchParams.set('cursor', options.cursor)
  }

  const response = await fetch(url, {
    headers: {
      'X-API-Key': apiKey,
    },
  })

  if (!response.ok) {
    throw new Error(`twitterapi.io advanced_search failed for query "${query}": ${response.status}`)
  }

  const payload = (await response.json()) as TwitterApiTimelineResponse | TwitterApiEnvelope

  return {
    tweets: extractTweets(payload),
    cursor: 'data' in payload ? payload.data?.cursor : payload.cursor,
    has_next_page: 'data' in payload ? payload.data?.has_next_page : payload.has_next_page,
  }
}

function extractTweets(payload: TwitterApiTimelineResponse | TwitterApiEnvelope): TwitterApiTweet[] {
  return 'data' in payload
    ? (payload.data?.tweets ?? [])
    : (payload.tweets ?? [])
}

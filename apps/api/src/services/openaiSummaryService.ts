type SummaryArticlePayload = {
  id: string
  title: string
  summary: string
  keywords: string[]
  company?: string
  modelFamily?: string
  contentType?: string
  source: {
    name: string
    url: string
    category?: 'official' | 'research' | 'media' | 'community'
  }
  publishedAt?: string
  link?: string
  author?: string
}

type ArticleSummary = {
  overview: string
  keyPoints: string[]
  whyItMatters: string
  watchNext: string[]
}

const OPENAI_API_URL = 'https://api.openai.com/v1/responses'
const summaryCache = new Map<string, ArticleSummary>()
const feedSummaryCache = new Map<string, ArticleSummary>()

export function isOpenAISummaryEnabled() {
  return Boolean(process.env.OPENAI_API_KEY)
}

export async function summarizeArticle(article: SummaryArticlePayload): Promise<{
  cached: boolean
  summary: ArticleSummary
}> {
  const cacheKey = article.id
  const cached = summaryCache.get(cacheKey)

  if (cached) {
    return {
      cached: true,
      summary: cached,
    }
  }

  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured')
  }

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_SUMMARY_MODEL ?? 'gpt-5.4-mini',
      input: [
        {
          role: 'system',
          content:
            'You are an AI research news analyst. Summarize one article into concise structured JSON only. Return an object with keys overview, keyPoints, whyItMatters, watchNext. overview and whyItMatters must be strings. keyPoints and watchNext must be arrays of 2 to 4 short bullet-style strings. Use **bold markdown** sparingly inside string values to highlight important model names, companies, product names, and short key conclusions. Do not bold full sentences. Do not include markdown fences.',
        },
        {
          role: 'user',
          content: JSON.stringify(article),
        },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI summary request failed: ${response.status}`)
  }

  const payload = await response.json()
  const outputText = extractOutputText(payload)
  const parsed = parseSummaryJson(outputText)
  summaryCache.set(cacheKey, parsed)

  return {
    cached: false,
    summary: parsed,
  }
}

export async function summarizeFeed(articles: SummaryArticlePayload[]): Promise<{
  cached: boolean
  summary: ArticleSummary
}> {
  const cacheKey = JSON.stringify(articles.map((article) => article.id))
  const cached = feedSummaryCache.get(cacheKey)

  if (cached) {
    return {
      cached: true,
      summary: cached,
    }
  }

  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured')
  }

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_SUMMARY_MODEL ?? 'gpt-5.4-mini',
      input: [
        {
          role: 'system',
          content:
            'You are an AI research news analyst. Summarize a feed of articles into concise structured JSON only. Return an object with keys overview, keyPoints, whyItMatters, watchNext. overview and whyItMatters must be strings. keyPoints and watchNext must be arrays of 2 to 4 short bullet-style strings. Focus on cross-article trends and major developments. Use **bold markdown** sparingly inside string values to highlight important model names, companies, product names, and short key conclusions. Do not bold full sentences. Do not include markdown fences.',
        },
        {
          role: 'user',
          content: JSON.stringify({
            itemCount: articles.length,
            articles,
          }),
        },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI feed summary request failed: ${response.status}`)
  }

  const payload = await response.json()
  const outputText = extractOutputText(payload)
  const parsed = parseSummaryJson(outputText)
  feedSummaryCache.set(cacheKey, parsed)

  return {
    cached: false,
    summary: parsed,
  }
}

function extractOutputText(payload: any): string {
  if (typeof payload?.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text
  }

  const chunks = payload?.output
    ?.flatMap((entry: any) => entry?.content ?? [])
    ?.map((content: any) => content?.text ?? '')
    ?.filter(Boolean)

  if (Array.isArray(chunks) && chunks.length > 0) {
    return chunks.join('\n').trim()
  }

  throw new Error('OpenAI summary response did not contain output text')
}

function parseSummaryJson(input: string): ArticleSummary {
  const normalized = input
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
  const parsed = JSON.parse(normalized)

  return {
    overview: typeof parsed.overview === 'string' ? parsed.overview : '',
    keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints.filter(isString).slice(0, 4) : [],
    whyItMatters: typeof parsed.whyItMatters === 'string' ? parsed.whyItMatters : '',
    watchNext: Array.isArray(parsed.watchNext) ? parsed.watchNext.filter(isString).slice(0, 4) : [],
  }
}

function isString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

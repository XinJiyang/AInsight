import type {
  ApiArticleSummary,
  ApiKeywordItem,
  ApiNewsItem,
  ApiNewsResponse,
  ApiKeywordsResponse,
  ApiSystemStatusResponse,
} from './types/news'

export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'
export const DEMO_TOKEN = 'ainsight-demo-token'
export const DEMO_BOOKMARK_CHANGE_EVENT = 'ainsight:demo-bookmarks-changed'

export const DEMO_ACCOUNTS = [
  {
    name: 'Demo User',
    email: 'demo.user@example.com',
    password: 'demo12345',
  },
] as const

const DEMO_DEFAULT_BOOKMARK_IDS = [
  'x-openai-2047743592278745425',
  'x-anthropic-2047728360818696302',
  'anthropic-news-news-claude-opus-4-7',
  'qwen-news-blog-qwen3-6-plus-towards-real-world-agents-603005',
]

let demoBookmarkIds = new Set<string>(DEMO_DEFAULT_BOOKMARK_IDS)
let demoNewsCache: ApiNewsItem[] | null = null

export async function loadDemoNewsResponse() {
  const response = await fetch('/demo/news.json')

  if (!response.ok) {
    throw new Error(`Failed to load demo news: ${response.status}`)
  }

  const payload = (await response.json()) as ApiNewsResponse
  demoNewsCache = payload.items ?? []
  return payload
}

export async function loadDemoKeywordsResponse() {
  const response = await fetch('/demo/keywords.json')

  if (!response.ok) {
    throw new Error(`Failed to load demo keywords: ${response.status}`)
  }

  return (await response.json()) as ApiKeywordsResponse
}

export async function loadDemoStatusResponse() {
  const response = await fetch('/demo/status.json')

  if (!response.ok) {
    throw new Error(`Failed to load demo status: ${response.status}`)
  }

  return (await response.json()) as ApiSystemStatusResponse
}

export async function loadDemoNewsItems() {
  if (demoNewsCache) {
    return demoNewsCache
  }

  const payload = await loadDemoNewsResponse()
  return payload.items ?? []
}

export function getDemoBookmarkIds() {
  return new Set(demoBookmarkIds)
}

export function isDemoBookmarked(id: string) {
  return demoBookmarkIds.has(id)
}

export function toggleDemoBookmark(id: string) {
  if (demoBookmarkIds.has(id)) {
    demoBookmarkIds.delete(id)
  } else {
    demoBookmarkIds.add(id)
  }

  notifyDemoBookmarkChange()
  return new Set(demoBookmarkIds)
}

export function removeDemoBookmark(id: string) {
  demoBookmarkIds.delete(id)
  notifyDemoBookmarkChange()
  return new Set(demoBookmarkIds)
}

export async function getDemoBookmarkedItems() {
  const items = await loadDemoNewsItems()
  return items.filter((item) => demoBookmarkIds.has(item.id))
}

export function subscribeToDemoBookmarks(listener: () => void) {
  window.addEventListener(DEMO_BOOKMARK_CHANGE_EVENT, listener)

  return () => {
    window.removeEventListener(DEMO_BOOKMARK_CHANGE_EVENT, listener)
  }
}

function notifyDemoBookmarkChange() {
  window.dispatchEvent(new Event(DEMO_BOOKMARK_CHANGE_EVENT))
}

export const demoFeedSummary: ApiArticleSummary = {
  overview:
    '**AI product updates** are concentrated around multimodal generation, enterprise agents, and private deployment. The strongest theme is vendors turning model capability into safer, workflow-oriented tooling rather than standalone chat experiences.',
  keyPoints: [
    '**OpenAI and Gemini** updates point toward richer visual, speech, and multimodal interaction patterns.',
    '**Anthropic and Cohere** emphasize safer enterprise workflows, retrieval, and grounded internal knowledge systems.',
    '**Open-weight ecosystems** such as Qwen and Hugging Face continue to push developer control and local customization.',
  ],
  whyItMatters:
    'The market is moving from model announcements toward **deployable AI systems**: agent workflows, private infrastructure, retrieval, and operational integration are becoming the practical differentiators.',
  watchNext: [
    'Track whether agent tooling becomes reliable enough for production software and business operations.',
    'Watch for enterprise buyers choosing between closed model quality and open model control.',
    'Monitor multimodal model adoption in design, support, and internal knowledge workflows.',
  ],
}

export function buildDemoKeywords(items: ApiNewsItem[]): ApiKeywordItem[] {
  const counts = new Map<string, number>()

  items.forEach((item) => {
    item.keywords.forEach((keyword) => {
      counts.set(keyword, (counts.get(keyword) ?? 0) + 1)
    })
  })

  return [...counts.entries()]
    .map(([keyword, count]) => ({ keyword, count }))
    .sort((left, right) => right.count - left.count || left.keyword.localeCompare(right.keyword))
    .slice(0, 12)
}

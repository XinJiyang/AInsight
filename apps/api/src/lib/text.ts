const STOP_WORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'from',
  'that',
  'this',
  'into',
  'using',
  'your',
  'have',
  'has',
  'are',
  'new',
  'how',
  'what',
  'why',
  'when',
  'will',
  'can',
  'not',
  'its',
  'our',
  'their',
  'about',
  'today',
  'latest',
  'launch',
  'release',
  'introducing',
  'announcement',
  'announcements',
  'update',
])

const COMPANY_RULES = [
  { company: 'OpenAI', needles: ['openai', 'chatgpt', 'gpt-'] },
  { company: 'Anthropic', needles: ['anthropic', 'claude'] },
  { company: 'Google DeepMind', needles: ['deepmind', 'gemini', 'gemma', 'google'] },
  { company: 'xAI', needles: ['xai', 'grok', 'x.ai'] },
  { company: 'Mistral AI', needles: ['mistral'] },
  { company: 'Cohere', needles: ['cohere', 'command'] },
  { company: 'Meta AI', needles: ['meta ai', 'llama', 'meta'] },
  { company: 'Qwen', needles: ['qwen', 'alibaba'] },
  { company: 'Hugging Face', needles: ['hugging face', 'huggingface'] },
]

const MODEL_RULES = [
  { modelFamily: 'GPT', needles: ['gpt', 'chatgpt'] },
  { modelFamily: 'Claude', needles: ['claude'] },
  { modelFamily: 'Gemini', needles: ['gemini'] },
  { modelFamily: 'Gemma', needles: ['gemma'] },
  { modelFamily: 'Grok', needles: ['grok'] },
  { modelFamily: 'Mistral', needles: ['mistral'] },
  { modelFamily: 'Command', needles: ['command'] },
  { modelFamily: 'Llama', needles: ['llama'] },
  { modelFamily: 'Qwen', needles: ['qwen'] },
]

const CONTENT_TYPE_RULES = [
  { contentType: 'release', needles: ['launch', 'released', 'release', 'introducing', 'available now'] },
  { contentType: 'research', needles: ['research', 'paper', 'benchmark', 'study', 'science'] },
  { contentType: 'partnership', needles: ['partnership', 'partnering', 'collaboration', 'mou'] },
  { contentType: 'safety', needles: ['safety', 'security', 'responsible ai', 'alignment'] },
  { contentType: 'infrastructure', needles: ['compute', 'inference', 'deployment', 'cloud'] },
]

const ENTITY_KEYWORDS = [
  'OpenAI',
  'ChatGPT',
  'GPT',
  'Anthropic',
  'Claude',
  'Google DeepMind',
  'Gemini',
  'Gemma',
  'xAI',
  'Grok',
  'Mistral',
  'Cohere',
  'Command',
  'Meta AI',
  'Llama',
  'Qwen',
  'Hugging Face',
  'Agents',
  'Research',
  'Safety',
  'Benchmark',
  'Inference',
  'API',
]

export interface ExtractedMetadata {
  keywords: string[]
  company?: string
  modelFamily?: string
  contentType?: string
}

export function stripHtml(input: string): string {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[鈥]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

export function summarizeText(input: string, maxLength = 220): string {
  const clean = stripHtml(input)

  if (clean.length <= maxLength) {
    return clean
  }

  const sentenceCut = clean.slice(0, maxLength).lastIndexOf('. ')
  if (sentenceCut > 80) {
    return clean.slice(0, sentenceCut + 1).trim()
  }

  return `${clean.slice(0, maxLength).trim()}...`
}

export function extractMetadata(title: string, summary: string): ExtractedMetadata {
  const haystack = `${title} ${summary}`
  const normalizedHaystack = haystack.toLowerCase()
  const company = matchFirstRule(COMPANY_RULES, normalizedHaystack, 'company')
  const modelFamily = matchFirstRule(MODEL_RULES, normalizedHaystack, 'modelFamily')
  const contentType = matchFirstRule(CONTENT_TYPE_RULES, normalizedHaystack, 'contentType')

  const keywords = new Set<string>()

  if (company) {
    keywords.add(company)
  }

  if (modelFamily && modelFamily !== company) {
    keywords.add(modelFamily)
  }

  ENTITY_KEYWORDS.forEach((keyword) => {
    if (normalizedHaystack.includes(keyword.toLowerCase())) {
      keywords.add(keyword)
    }
  })

  const candidateWords = haystack
    .replace(/[^a-zA-Z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(
      (word) =>
        word.length >= 4 &&
        !STOP_WORDS.has(word.toLowerCase()) &&
        !/\d{4,}/.test(word) &&
        !/^[a-z]+\d+[a-z0-9-]*$/i.test(word),
    )

  for (const word of candidateWords) {
    if (keywords.size >= 6) {
      break
    }

    const normalized = /^[A-Z0-9-]+$/.test(word) ? word : capitalize(word)
    if (!looksNoisy(normalized)) {
      keywords.add(normalized)
    }
  }

  return {
    keywords: [...keywords].slice(0, 6),
    company,
    modelFamily,
    contentType,
  }
}

function matchFirstRule<T extends { needles: string[] }>(
  rules: T[],
  haystack: string,
  key: keyof Omit<T, 'needles'>,
): string | undefined {
  const match = rules.find((rule) => rule.needles.some((needle) => haystack.includes(needle)))
  const value = match?.[key]
  return typeof value === 'string' ? value : undefined
}

function looksNoisy(word: string): boolean {
  return word.length < 4 || /^[0-9-]+$/.test(word)
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
}

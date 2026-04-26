type ModelDirectoryPayload = {
  id: string
  name: string
  company: string
  availability: 'Proprietary' | 'Open-weight'
  parameters: string
  contextWindow: string
  released: string
  bestFor: string
  description: string
  websiteUrl: string
  logoPath: string
  isFeatured?: boolean
}

const OPENAI_API_URL = 'https://api.openai.com/v1/responses'
const modelsRefreshCache = new Map<string, ModelDirectoryPayload[]>()

export function isOpenAIModelsRefreshEnabled() {
  return Boolean(process.env.OPENAI_API_KEY)
}

export async function refreshModelDirectory(
  models: ModelDirectoryPayload[],
): Promise<{ cached: boolean; models: ModelDirectoryPayload[] }> {
  const cacheKey = JSON.stringify(models.map((model) => model.id))
  const cached = modelsRefreshCache.get(cacheKey)

  if (cached) {
    return {
      cached: true,
      models: cached,
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
      model: process.env.OPENAI_MODELS_MODEL ?? process.env.OPENAI_SUMMARY_MODEL ?? 'gpt-5.4-mini',
      input: [
        {
          role: 'system',
          content:
            'You maintain an AI model directory for a news product. Update the provided model entries using your latest reliable general knowledge. Return JSON only in the shape {"models":[...]}. Preserve every item id and logoPath exactly. Keep websiteUrl if you are not confident it should change. Do not invent exact parameter counts or release months unless reasonably confident. Keep descriptions concise and product-facing. Allowed availability values are Proprietary or Open-weight. Do not add or remove items.',
        },
        {
          role: 'user',
          content: JSON.stringify({
            today: new Date().toISOString().slice(0, 10),
            models,
          }),
        },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI models refresh request failed: ${response.status}`)
  }

  const payload = await response.json()
  const outputText = extractOutputText(payload)
  const parsed = parseModelsJson(outputText, models)
  modelsRefreshCache.set(cacheKey, parsed)

  return {
    cached: false,
    models: parsed,
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

  throw new Error('OpenAI models refresh response did not contain output text')
}

function parseModelsJson(input: string, fallbackModels: ModelDirectoryPayload[]): ModelDirectoryPayload[] {
  const normalized = input
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  const parsed = JSON.parse(normalized)
  const items = Array.isArray(parsed?.models) ? parsed.models : []
  const fallbackById = new Map(fallbackModels.map((model) => [model.id, model]))

  const merged = items
    .filter((item) => typeof item?.id === 'string' && fallbackById.has(item.id))
    .map((item) => {
      const fallback = fallbackById.get(item.id)!
      return {
        ...fallback,
        name: asNonEmptyString(item.name) ?? fallback.name,
        company: asNonEmptyString(item.company) ?? fallback.company,
        availability: item.availability === 'Proprietary' || item.availability === 'Open-weight'
          ? item.availability
          : fallback.availability,
        parameters: asNonEmptyString(item.parameters) ?? fallback.parameters,
        contextWindow: asNonEmptyString(item.contextWindow) ?? fallback.contextWindow,
        released: asNonEmptyString(item.released) ?? fallback.released,
        bestFor: asNonEmptyString(item.bestFor) ?? fallback.bestFor,
        description: asNonEmptyString(item.description) ?? fallback.description,
        websiteUrl: asNonEmptyString(item.websiteUrl) ?? fallback.websiteUrl,
        logoPath: fallback.logoPath,
        isFeatured: typeof item.isFeatured === 'boolean' ? item.isFeatured : fallback.isFeatured,
      } satisfies ModelDirectoryPayload
    })
  const mergedById = new Map(merged.map((model) => [model.id, model]))

  return fallbackModels.map((model) => mergedById.get(model.id) ?? model)
}

function asNonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

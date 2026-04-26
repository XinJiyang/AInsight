import { load } from 'cheerio'
import { XMLParser } from 'fast-xml-parser'

import type { FeedSourceConfig } from '../types/news.js'

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  trimValues: true,
})

export interface ParsedFeedEntry {
  title: string
  link: string
  description: string
  publishedAt?: string
  author?: string
}

export async function fetchFeedEntries(source: FeedSourceConfig): Promise<ParsedFeedEntry[]> {
  const response = await fetch(source.feedUrl, {
    headers: {
      'User-Agent': 'AInsightBot/0.1 (+https://example.com)',
      Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch ${source.name}: ${response.status}`)
  }

  const raw = await response.text()

  if (source.sourceType === 'html') {
    const entries = parseHtmlEntries(raw, source)
    return Promise.all(entries.map((entry) => enrichHtmlEntry(entry, source)))
  }

  const xml = raw
  const parsed = parser.parse(xml)

  if (parsed.rss?.channel?.item) {
    const items = toArray(parsed.rss.channel.item)
    return items.map((item) => ({
      title: firstText(item.title),
      link: firstText(item.link) || firstText(item.guid),
      description: firstText(item.description) || firstText(item['content:encoded']),
      publishedAt: firstText(item.pubDate),
      author: firstText(item.author) || firstText(item['dc:creator']),
    }))
  }

  if (parsed.feed?.entry) {
    const entries = toArray(parsed.feed.entry)
    return entries.map((entry) => ({
      title: firstText(entry.title),
      link: resolveAtomLink(entry.link),
      description: firstText(entry.summary) || firstText(entry.content),
      publishedAt: firstText(entry.updated) || firstText(entry.published),
      author: firstText(entry.author?.name) || firstText(entry.author),
    }))
  }

  throw new Error(`Unsupported feed format for ${source.name}`)
}

function parseHtmlEntries(html: string, source: FeedSourceConfig): ParsedFeedEntry[] {
  const $ = load(html)

  if (source.id === 'xai-news') {
    return parseXaiNewsPage($, source.homepageUrl)
  }

  if (source.id === 'cohere-release-notes') {
    return parseCohereReleaseNotesPage($, source.homepageUrl)
  }

  if (source.linkPathNeedle) {
    return parseListingPage($, source)
  }

  throw new Error(`Unsupported html parser for ${source.name}`)
}

function parseXaiNewsPage(
  $: ReturnType<typeof load>,
  homepageUrl: string,
): ParsedFeedEntry[] {
  const items: ParsedFeedEntry[] = []
  const seen = new Set<string>()
  let currentDate = ''

  $('body *').each((_index, element) => {
    const text = $(element).text().replace(/\s+/g, ' ').trim()

    if (isFullDate(text)) {
      currentDate = text
    }

    const anchor = $(element).is('a[href*="/news/"]') ? $(element) : $(element).find('a[href*="/news/"]').first()
    const href = anchor.attr('href')
    const title = anchor.text().replace(/\s+/g, ' ').trim()

    if (!href || !title || !href.includes('/news/') || title.length < 8) {
      return
    }

    const link = new URL(href, homepageUrl).toString()
    if (seen.has(link)) {
      return
    }

    seen.add(link)
    const containerText = anchor.parent().text().replace(/\s+/g, ' ').trim()
    const description = normalizeDescription(containerText.replace(title, '').trim(), title)

    items.push({
      title,
      link,
      description: description || title,
      publishedAt: currentDate || extractDate(containerText),
    })
  })

  return items
}

function parseCohereReleaseNotesPage(
  $: ReturnType<typeof load>,
  homepageUrl: string,
): ParsedFeedEntry[] {
  const items: ParsedFeedEntry[] = []
  let currentDate = ''

  $('h2, p').each((_index, element) => {
    const text = $(element).text().replace(/\s+/g, ' ').trim()

    if (isFullDate(text)) {
      currentDate = text
      return
    }

    if (!$(element).is('h2') || text.length < 8) {
      return
    }

    const anchor = $(element).find('a').first()
    const href = anchor.attr('href')
    const link = href ? new URL(href, homepageUrl).toString() : homepageUrl

    let description = ''
    const nextParagraph = $(element).nextAll('p').first()
    if (nextParagraph.length > 0) {
      description = nextParagraph.text().replace(/\s+/g, ' ').trim()
    }

    items.push({
      title: text,
      link,
      description: description || text,
      publishedAt: currentDate || undefined,
    })
  })

  return items
}

function parseListingPage(
  $: ReturnType<typeof load>,
  source: FeedSourceConfig,
): ParsedFeedEntry[] {
  const items: ParsedFeedEntry[] = []
  const seen = new Set<string>()

  $('a[href]').each((_index, element) => {
    const href = $(element).attr('href')
    if (
      !href ||
      !source.linkPathNeedle ||
      !href.includes(source.linkPathNeedle) ||
      href === '/news' ||
      href === '/news/'
    ) {
      return
    }

    const rawText = $(element).text().replace(/\s+/g, ' ').trim()
    const title = normalizeListingTitle(rawText)
    if (!title || title.length < 12) {
      return
    }

    const filterHaystack = `${title} ${href}`.toLowerCase()
    if (
      source.includePatterns &&
      !source.includePatterns.some((pattern) => filterHaystack.includes(pattern.toLowerCase()))
    ) {
      return
    }

    const link = new URL(href, source.homepageUrl).toString()
    if (seen.has(link)) {
      return
    }

    seen.add(link)
    const containerText = $(element)
      .closest('article, li, div')
      .text()
      .replace(/\s+/g, ' ')
      .trim()

    items.push({
      title,
      link,
      description: normalizeDescription(containerText, title),
      publishedAt: extractDate(rawText) ?? extractDate(containerText),
    })
  })

  return items
}

async function enrichHtmlEntry(
  entry: ParsedFeedEntry,
  source: FeedSourceConfig,
): Promise<ParsedFeedEntry> {
  try {
    const response = await fetch(entry.link, {
      headers: {
        'User-Agent': 'AInsightBot/0.1 (+https://example.com)',
        Accept: 'text/html,application/xhtml+xml',
      },
    })

    if (!response.ok) {
      return entry
    }

    const html = await response.text()
    const $ = load(html)

    const metaDescription =
      $('meta[name="description"]').attr('content') ??
      $('meta[property="og:description"]').attr('content') ??
      $('meta[name="twitter:description"]').attr('content') ??
      ''

    const metaTitle =
      $('meta[property="og:title"]').attr('content') ??
      $('meta[name="twitter:title"]').attr('content') ??
      $('title').text() ??
      ''

    const publishedAt =
      $('meta[property="article:published_time"]').attr('content') ??
      $('time').first().attr('datetime') ??
      entry.publishedAt

    const normalizedMetaTitle = normalizeListingTitle(metaTitle)
    const shouldKeepOriginalTitle =
      source.id === 'xai-news' && looksLikeSiteLevelTitle(normalizedMetaTitle)
    const title =
      shouldKeepOriginalTitle || !normalizedMetaTitle ? entry.title : normalizedMetaTitle
    const description = normalizeDescription(metaDescription, title) || entry.description

    return {
      ...entry,
      title,
      description,
      publishedAt,
    }
  } catch {
    return entry
  }
}

function looksLikeSiteLevelTitle(input: string): boolean {
  const normalized = input.toLowerCase()
  return (
    normalized.includes('creators of grok') ||
    normalized === 'x ai' ||
    normalized === 'xai' ||
    normalized.includes('ai chatbot')
  )
}

function toArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value]
}

function firstText(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim()
  }

  if (typeof value === 'number') {
    return String(value)
  }

  if (value && typeof value === 'object' && '#text' in value) {
    const text = (value as { ['#text']?: unknown })['#text']
    return typeof text === 'string' ? text.trim() : ''
  }

  return ''
}

function resolveAtomLink(linkValue: unknown): string {
  if (typeof linkValue === 'string') {
    return linkValue
  }

  if (Array.isArray(linkValue)) {
    const alternate = linkValue.find(
      (entry) => typeof entry === 'object' && entry && (entry as { rel?: string }).rel === 'alternate',
    )

    if (alternate && typeof alternate === 'object' && 'href' in alternate) {
      return typeof alternate.href === 'string' ? alternate.href : ''
    }

    const first = linkValue[0]
    if (first && typeof first === 'object' && 'href' in first) {
      return typeof first.href === 'string' ? first.href : ''
    }
  }

  if (linkValue && typeof linkValue === 'object' && 'href' in linkValue) {
    return typeof linkValue.href === 'string' ? linkValue.href : ''
  }

  return ''
}

function extractDate(input: string): string | undefined {
  const match = input.match(
    /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},\s+\d{4}\b/,
  )

  return match?.[0]
}

function isFullDate(input: string): boolean {
  return /^(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},\s+\d{4}$/i.test(
    input,
  )
}

function normalizeListingTitle(input: string): string {
  const clean = input.replace(/\s+/g, ' ').trim()
  if (!clean) {
    return ''
  }

  let normalized = clean
    .replace(/^(Announcements|Product|Policy|Research)\s+/i, '')
    .replace(
      /^(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},\s+\d{4}\s+/i,
      '',
    )
    .replace(/^(Announcements|Product|Policy|Research)\s+/i, '')

  normalized = normalized
    .replace(
      /^.*?(Where things stand with the Department of War|Partnering with Mozilla to improve Firefox.?s security|Sydney will become Anthropic.?s fourth office in Asia-Pacific|Introducing The Anthropic Institute|Anthropic expands partnership with Google and Broadcom for multiple gigawatts of next-generation compute|Australian government and Anthropic sign MOU for AI safety and research|Anthropic invests \$100 million into the Claude Partner Network)/,
      '$1',
    )
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z])([0-9])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()

  return normalized
}

function normalizeDescription(input: string, title: string): string {
  const clean = input.replace(/\s+/g, ' ').trim()
  if (!clean) {
    return ''
  }

  const withoutDate = clean.replace(
    /^(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},\s+\d{4}\s*/i,
    '',
  )
  const withoutCategory = withoutDate.replace(/^(Announcements|Product|Policy|Research)\s*/i, '')
  const withoutTitlePrefix = withoutCategory.startsWith(title)
    ? withoutCategory.slice(title.length).trim()
    : withoutCategory

  return withoutTitlePrefix || title
}

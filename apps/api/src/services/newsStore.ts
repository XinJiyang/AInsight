import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { CrawlResult } from '../types/news.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_DIR = path.resolve(__dirname, '../../data')
const CACHE_FILE = path.join(DATA_DIR, 'news-cache.json')

export async function readNewsCache(): Promise<CrawlResult | null> {
  try {
    const raw = await readFile(CACHE_FILE, 'utf8')
    return JSON.parse(raw) as CrawlResult
  } catch {
    return null
  }
}

export async function writeNewsCache(result: CrawlResult): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(CACHE_FILE, JSON.stringify(result, null, 2), 'utf8')
}

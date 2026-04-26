import { crawlNewsFeeds } from '../services/newsCrawler.js'

const result = await crawlNewsFeeds({
  includeSocial: process.env.TWITTERAPI_IO_ENABLED !== 'false',
})

console.log(
  JSON.stringify(
    {
      fetchedAt: result.fetchedAt,
      count: result.items.length,
      sources: [...new Set(result.items.map((item) => item.source.name))],
      errors: result.errors ?? [],
    },
    null,
    2,
  ),
)

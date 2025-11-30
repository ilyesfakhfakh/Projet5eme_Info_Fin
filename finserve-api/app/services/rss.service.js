const Parser = require('rss-parser')
const axios = require('axios')

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['media:thumbnail', 'mediaThumbnail'],
      ['content:encoded', 'contentEncoded']
    ]
  }
})

// RSS Feed Sources for Financial Markets
const RSS_SOURCES = {
  // General Financial News
  bloomberg: {
    name: 'Bloomberg',
    url: 'https://www.bloomberg.com/feed/podcast/business.xml',
    category: 'markets',
    priority: 1
  },
  reuters: {
    name: 'Reuters Business',
    url: 'https://www.reutersagency.com/feed/',
    category: 'markets',
    priority: 1
  },
  cnbc: {
    name: 'CNBC',
    url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html',
    category: 'markets',
    priority: 2
  },
  
  // Stock Market
  marketwatch: {
    name: 'MarketWatch',
    url: 'http://feeds.marketwatch.com/marketwatch/topstories/',
    category: 'stocks',
    priority: 1
  },
  seekingalpha: {
    name: 'Seeking Alpha',
    url: 'https://seekingalpha.com/feed.xml',
    category: 'stocks',
    priority: 2
  },
  
  // Forex
  forexlive: {
    name: 'ForexLive',
    url: 'https://www.forexlive.com/feed/news',
    category: 'forex',
    priority: 1
  },
  dailyfx: {
    name: 'DailyFX',
    url: 'https://www.dailyfx.com/feeds/market-news',
    category: 'forex',
    priority: 2
  },
  
  // Cryptocurrency
  coindesk: {
    name: 'CoinDesk',
    url: 'https://www.coindesk.com/arc/outboundfeeds/rss/',
    category: 'crypto',
    priority: 1
  },
  cointelegraph: {
    name: 'Cointelegraph',
    url: 'https://cointelegraph.com/rss',
    category: 'crypto',
    priority: 2
  },
  bitcoinmagazine: {
    name: 'Bitcoin Magazine',
    url: 'https://bitcoinmagazine.com/.rss/full/',
    category: 'crypto',
    priority: 2
  },
  
  // Commodities
  kitco: {
    name: 'Kitco Gold News',
    url: 'https://www.kitco.com/rss/KitcoNews.xml',
    category: 'commodities',
    priority: 1
  },
  
  // Economy
  federalreserve: {
    name: 'Federal Reserve',
    url: 'https://www.federalreserve.gov/feeds/press_all.xml',
    category: 'economy',
    priority: 1
  },
  investopedia: {
    name: 'Investopedia',
    url: 'https://www.investopedia.com/feedbuilder/feed/getfeed?feedName=rss_headline',
    category: 'economy',
    priority: 2
  }
}

// Cache for RSS feeds (simple in-memory cache)
let feedCache = {
  data: [],
  lastUpdate: null,
  expiresIn: 5 * 60 * 1000 // 5 minutes
}

// Parse a single RSS feed
async function parseFeed(sourceKey, sourceConfig) {
  try {
    const feed = await parser.parseURL(sourceConfig.url)
    
    return feed.items.map(item => ({
      id: item.guid || item.link,
      title: item.title,
      description: item.contentSnippet || item.summary || item.content || '',
      link: item.link,
      pubDate: item.pubDate || item.isoDate,
      author: item.creator || item.author || sourceConfig.name,
      source: sourceConfig.name,
      sourceKey: sourceKey,
      category: sourceConfig.category,
      image: extractImage(item),
      content: item.content || item.contentEncoded || item.description || '',
      timestamp: new Date(item.pubDate || item.isoDate).getTime()
    }))
  } catch (error) {
    console.error(`Error parsing feed ${sourceKey}:`, error.message)
    return []
  }
}

// Extract image from RSS item
function extractImage(item) {
  if (item.enclosure && item.enclosure.url) {
    return item.enclosure.url
  }
  if (item.mediaContent && item.mediaContent.$) {
    return item.mediaContent.$.url
  }
  if (item.mediaThumbnail && item.mediaThumbnail.$) {
    return item.mediaThumbnail.$.url
  }
  
  // Try to extract from content
  const imgRegex = /<img[^>]+src="([^">]+)"/
  const content = item.content || item.contentEncoded || item.description || ''
  const match = content.match(imgRegex)
  
  return match ? match[1] : null
}

// Get all financial news
async function getAllFinancialNews(limit = 50, category = 'all') {
  // Check cache
  const now = Date.now()
  if (feedCache.data.length > 0 && feedCache.lastUpdate && (now - feedCache.lastUpdate < feedCache.expiresIn)) {
    let news = feedCache.data
    
    if (category !== 'all') {
      news = news.filter(item => item.category === category)
    }
    
    return news.slice(0, limit)
  }

  // Fetch fresh data
  const promises = Object.entries(RSS_SOURCES).map(([key, config]) => 
    parseFeed(key, config)
  )

  const results = await Promise.allSettled(promises)
  
  const allNews = results
    .filter(result => result.status === 'fulfilled')
    .flatMap(result => result.value)
    .sort((a, b) => b.timestamp - a.timestamp)

  // Update cache
  feedCache.data = allNews
  feedCache.lastUpdate = now

  // Filter by category if needed
  let news = allNews
  if (category !== 'all') {
    news = news.filter(item => item.category === category)
  }

  return news.slice(0, limit)
}

// Get news by source
async function getNewsBySource(sourceKey, limit = 20) {
  const source = RSS_SOURCES[sourceKey.toLowerCase()]
  
  if (!source) {
    throw new Error(`Source ${sourceKey} not found`)
  }

  const news = await parseFeed(sourceKey.toLowerCase(), source)
  return news.slice(0, limit)
}

// Get news by category
async function getNewsByCategory(category, limit = 30) {
  const sources = Object.entries(RSS_SOURCES).filter(([_, config]) => 
    config.category === category.toLowerCase()
  )

  if (sources.length === 0) {
    return []
  }

  const promises = sources.map(([key, config]) => parseFeed(key, config))
  const results = await Promise.allSettled(promises)
  
  const news = results
    .filter(result => result.status === 'fulfilled')
    .flatMap(result => result.value)
    .sort((a, b) => b.timestamp - a.timestamp)

  return news.slice(0, limit)
}

// Get trending news (prioritized sources)
async function getTrendingNews(limit = 10) {
  const prioritySources = Object.entries(RSS_SOURCES)
    .filter(([_, config]) => config.priority === 1)

  const promises = prioritySources.map(([key, config]) => parseFeed(key, config))
  const results = await Promise.allSettled(promises)
  
  const news = results
    .filter(result => result.status === 'fulfilled')
    .flatMap(result => result.value)
    .sort((a, b) => b.timestamp - a.timestamp)

  return news.slice(0, limit)
}

// Search news by keyword
async function searchNews(keyword, limit = 20, sourceKey = null) {
  let news
  
  if (sourceKey) {
    news = await getNewsBySource(sourceKey, 100)
  } else {
    news = await getAllFinancialNews(200, 'all')
  }

  const searchTerm = keyword.toLowerCase()
  const filtered = news.filter(item => 
    item.title.toLowerCase().includes(searchTerm) || 
    item.description.toLowerCase().includes(searchTerm) ||
    item.content.toLowerCase().includes(searchTerm)
  )

  return filtered.slice(0, limit)
}

// Get news by symbol/ticker
async function getNewsBySymbol(symbol, limit = 15) {
  const news = await getAllFinancialNews(300, 'all')
  
  const filtered = news.filter(item => {
    const upperSymbol = symbol.toUpperCase()
    const content = `${item.title} ${item.description} ${item.content}`.toUpperCase()
    
    // Look for symbol with $ prefix or standalone
    return content.includes(`$${upperSymbol}`) || 
           content.includes(` ${upperSymbol} `) ||
           content.includes(`(${upperSymbol})`)
  })

  return filtered.slice(0, limit)
}

// Get available sources
async function getAvailableSources() {
  return Object.entries(RSS_SOURCES).map(([key, config]) => ({
    key,
    name: config.name,
    category: config.category,
    priority: config.priority,
    url: config.url
  }))
}

// Refresh all feeds (clear cache)
async function refreshAllFeeds() {
  feedCache.data = []
  feedCache.lastUpdate = null
  
  // Pre-fetch fresh data
  await getAllFinancialNews(100, 'all')
  
  return { message: 'Feeds refreshed', timestamp: new Date() }
}

// Get feed statistics
async function getFeedStatistics() {
  const news = await getAllFinancialNews(1000, 'all')
  
  const stats = {
    totalNews: news.length,
    lastUpdate: feedCache.lastUpdate ? new Date(feedCache.lastUpdate) : null,
    byCategory: {},
    bySource: {},
    latestNews: news[0] || null
  }

  // Count by category
  news.forEach(item => {
    stats.byCategory[item.category] = (stats.byCategory[item.category] || 0) + 1
    stats.bySource[item.source] = (stats.bySource[item.source] || 0) + 1
  })

  return stats
}

module.exports = {
  getAllFinancialNews,
  getNewsBySource,
  getNewsByCategory,
  getTrendingNews,
  searchNews,
  getNewsBySymbol,
  getAvailableSources,
  refreshAllFeeds,
  getFeedStatistics
}

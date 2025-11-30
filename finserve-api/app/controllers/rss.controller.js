const express = require('express')
const router = express.Router()
const rssService = require('../services/rss.service')

// Get all financial news from multiple sources
const getAllFinancialNews = async (req, res) => {
  try {
    const { limit = 50, category = 'all' } = req.query

    const news = await rssService.getAllFinancialNews(limit, category)

    return res.json({
      success: true,
      data: news,
      count: news.length,
      message: 'Financial news retrieved successfully'
    })
  } catch (error) {
    console.error('Error fetching financial news:', error)
    return res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la récupération des news', 
      error: String(error) 
    })
  }
}

// Get news from a specific source
const getNewsBySource = async (req, res) => {
  try {
    const { source } = req.params
    const { limit = 20 } = req.query

    const news = await rssService.getNewsBySource(source, limit)

    if (!news || news.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No news found for source: ${source}`
      })
    }

    return res.json({
      success: true,
      data: news,
      count: news.length,
      source,
      message: `News from ${source} retrieved successfully`
    })
  } catch (error) {
    console.error(`Error fetching news from ${req.params.source}:`, error)
    return res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la récupération des news', 
      error: String(error) 
    })
  }
}

// Get news by category (stocks, forex, crypto, commodities)
const getNewsByCategory = async (req, res) => {
  try {
    const { category } = req.params
    const { limit = 30 } = req.query

    const validCategories = ['stocks', 'forex', 'crypto', 'commodities', 'markets', 'economy']
    
    if (!validCategories.includes(category.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Valid categories: ${validCategories.join(', ')}`
      })
    }

    const news = await rssService.getNewsByCategory(category, limit)

    return res.json({
      success: true,
      data: news,
      count: news.length,
      category,
      message: `${category} news retrieved successfully`
    })
  } catch (error) {
    console.error(`Error fetching ${req.params.category} news:`, error)
    return res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la récupération des news', 
      error: String(error) 
    })
  }
}

// Get trending/top news
const getTrendingNews = async (req, res) => {
  try {
    const { limit = 10 } = req.query

    const news = await rssService.getTrendingNews(limit)

    return res.json({
      success: true,
      data: news,
      count: news.length,
      message: 'Trending news retrieved successfully'
    })
  } catch (error) {
    console.error('Error fetching trending news:', error)
    return res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la récupération des news', 
      error: String(error) 
    })
  }
}

// Search news by keyword
const searchNews = async (req, res) => {
  try {
    const { keyword } = req.params
    const { limit = 20, source } = req.query

    if (!keyword || keyword.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Keyword must be at least 2 characters'
      })
    }

    const news = await rssService.searchNews(keyword, limit, source)

    return res.json({
      success: true,
      data: news,
      count: news.length,
      keyword,
      message: `Search results for "${keyword}" retrieved successfully`
    })
  } catch (error) {
    console.error(`Error searching news for "${req.params.keyword}":`, error)
    return res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la recherche', 
      error: String(error) 
    })
  }
}

// Get news for a specific symbol/ticker
const getNewsBySymbol = async (req, res) => {
  try {
    const { symbol } = req.params
    const { limit = 15 } = req.query

    const news = await rssService.getNewsBySymbol(symbol.toUpperCase(), limit)

    return res.json({
      success: true,
      data: news,
      count: news.length,
      symbol: symbol.toUpperCase(),
      message: `News for ${symbol.toUpperCase()} retrieved successfully`
    })
  } catch (error) {
    console.error(`Error fetching news for symbol ${req.params.symbol}:`, error)
    return res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la récupération des news', 
      error: String(error) 
    })
  }
}

// Get available RSS sources
const getAvailableSources = async (req, res) => {
  try {
    const sources = await rssService.getAvailableSources()

    return res.json({
      success: true,
      data: sources,
      count: sources.length,
      message: 'Available RSS sources retrieved successfully'
    })
  } catch (error) {
    console.error('Error fetching sources:', error)
    return res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la récupération des sources', 
      error: String(error) 
    })
  }
}

// Refresh RSS feeds (admin endpoint)
const refreshFeeds = async (req, res) => {
  try {
    await rssService.refreshAllFeeds()

    return res.json({
      success: true,
      message: 'RSS feeds refreshed successfully',
      timestamp: new Date()
    })
  } catch (error) {
    console.error('Error refreshing feeds:', error)
    return res.status(500).json({ 
      success: false,
      message: 'Erreur lors du rafraîchissement', 
      error: String(error) 
    })
  }
}

// Get feed statistics
const getFeedStats = async (req, res) => {
  try {
    const stats = await rssService.getFeedStatistics()

    return res.json({
      success: true,
      data: stats,
      message: 'Feed statistics retrieved successfully'
    })
  } catch (error) {
    console.error('Error fetching feed stats:', error)
    return res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la récupération des statistiques', 
      error: String(error) 
    })
  }
}

// Routes
router.get('/news', getAllFinancialNews)
router.get('/news/source/:source', getNewsBySource)
router.get('/news/category/:category', getNewsByCategory)
router.get('/news/trending', getTrendingNews)
router.get('/news/search/:keyword', searchNews)
router.get('/news/symbol/:symbol', getNewsBySymbol)
router.get('/sources', getAvailableSources)
router.post('/refresh', refreshFeeds)
router.get('/stats', getFeedStats)

module.exports = router

const db = require('../models')
const priceService = require('./price.service')

async function calculatePortfolioValue(portfolioId) {
  // Get portfolio basic info
  const portfolio = await db.portfolios.findByPk(portfolioId)
  if (!portfolio) throw new Error('Portfolio not found')

  // Get all positions for this portfolio
  const positions = await db.positions.findAll({
    where: { portfolio_id: portfolioId }
  })

  let totalPositionValue = 0

  // Calculate value of each position
  for (const position of positions) {
    const quantity = Number(position.quantity)
    if (quantity === 0) continue

    // Get current price for the asset
    const priceData = await priceService.getCurrentPrice(position.asset_id, 'midPrice')
    if (!priceData) continue

    const currentPrice = priceData.price
    const positionValue = quantity * currentPrice
    totalPositionValue += positionValue

    // Update position with current price and market value
    await db.positions.update({
      current_price: currentPrice,
      market_value: positionValue,
      unrealized_pl: positionValue - (Number(position.average_price) * quantity),
      last_update_date: new Date()
    }, {
      where: { position_id: position.position_id }
    })
  }

  // Calculate total portfolio value
  const cashBalance = Number(portfolio.current_balance)
  const totalValue = cashBalance + totalPositionValue

  // Calculate profit/loss
  const initialBalance = Number(portfolio.initial_balance)
  const profitLoss = totalValue - initialBalance
  const profitLossPercentage = initialBalance > 0 ? (profitLoss / initialBalance) * 100 : 0

  // Update portfolio
  await db.portfolios.update({
    total_value: totalValue,
    profit: profitLoss,
    profit_loss: profitLoss,
    profit_loss_percentage: profitLossPercentage,
    last_update_date: new Date()
  }, {
    where: { portfolio_id: portfolioId }
  })

  return {
    portfolioId,
    cashBalance,
    positionValue: totalPositionValue,
    totalValue,
    profitLoss,
    profitLossPercentage,
    lastUpdate: new Date()
  }
}

async function getPortfolioSummary(portfolioId) {
  const portfolio = await db.portfolios.findByPk(portfolioId, {
    include: [
      {
        model: db.positions,
        as: 'positions',
        include: [
          {
            model: db.assets,
            as: 'asset'
          }
        ]
      }
    ]
  })

  if (!portfolio) throw new Error('Portfolio not found')

  // Calculate current values
  const valuation = await calculatePortfolioValue(portfolioId)

  return {
    portfolio: {
      id: portfolio.portfolio_id,
      name: portfolio.portfolio_name,
      userId: portfolio.user_id,
      initialBalance: Number(portfolio.initial_balance),
      currentBalance: Number(portfolio.current_balance),
      totalValue: valuation.totalValue,
      profitLoss: valuation.profitLoss,
      profitLossPercentage: valuation.profitLossPercentage,
      creationDate: portfolio.creation_date,
      lastUpdate: portfolio.last_update_date
    },
    positions: portfolio.positions.map(pos => ({
      id: pos.position_id,
      assetId: pos.asset_id,
      assetSymbol: pos.asset_symbol,
      quantity: Number(pos.quantity),
      averagePrice: Number(pos.average_price),
      currentPrice: Number(pos.current_price),
      marketValue: Number(pos.market_value),
      unrealizedPl: Number(pos.unrealized_pl),
      unrealizedPlPercentage: Number(pos.unrealized_pl_percentage),
      lastUpdate: pos.last_update_date
    })),
    summary: valuation
  }
}

async function updateAllPortfolioValues() {
  // Get all active portfolios
  const portfolios = await db.portfolios.findAll({
    where: { is_active: true }
  })

  const results = []
  for (const portfolio of portfolios) {
    try {
      const valuation = await calculatePortfolioValue(portfolio.portfolio_id)
      results.push({
        portfolioId: portfolio.portfolio_id,
        success: true,
        valuation
      })
    } catch (error) {
      results.push({
        portfolioId: portfolio.portfolio_id,
        success: false,
        error: error.message
      })
    }
  }

  return results
}

module.exports = {
  calculatePortfolioValue,
  getPortfolioSummary,
  updateAllPortfolioValues,
}
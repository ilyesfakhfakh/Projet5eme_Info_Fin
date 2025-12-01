const db = require('../models');
const Portfolio = db.portfolios;
const Position = db.positions;

class PortfolioService {
  // Recalculate all portfolio financial metrics
  static async recalculatePortfolioValues(portfolioId) {
    const portfolio = await Portfolio.findByPk(portfolioId);
    if (!portfolio) {
      throw new Error('Portfolio not found');
    }

    // First recalculate all positions
    await this.recalculatePositions(portfolioId);

    // Get all active positions (re-fetched after recalculation)
    const positions = await Position.findAll({
      where: { portfolio_id: portfolioId, is_archived: false }
    });

    // Calculate positions value
    let positionsValue = 0;
    positions.forEach(position => {
      const marketValue = parseFloat(position.market_value || 0);
      if (!isNaN(marketValue) && marketValue >= 0) {
        positionsValue += marketValue;
      }
    });

    // Calculate new totals
    const currentBalance = parseFloat(portfolio.current_balance || 0);
    const initialBalance = parseFloat(portfolio.initial_balance || 0);

    const totalValue = currentBalance + positionsValue;
    const profitLoss = totalValue - initialBalance;
    const profitLossPercentage = initialBalance > 0 ? (profitLoss / initialBalance) * 100 : 0;

    // Update portfolio
    await portfolio.update({
      total_value: totalValue,
      profit_loss: profitLoss,
      profit_loss_percentage: profitLossPercentage,
      last_update_date: new Date()
    });

    return portfolio;
  }

  // Recalculate all positions for a portfolio
  static async recalculatePositions(portfolioId) {
    const positions = await Position.findAll({
      where: { portfolio_id: portfolioId, is_archived: false }
    });

    const updatedPositions = [];

    for (const position of positions) {
      const quantity = parseFloat(position.quantity || 0);
      const currentPrice = parseFloat(position.current_price || 0);
      const averagePrice = parseFloat(position.average_price || 0);

      // Skip invalid positions
      if (quantity <= 0 || currentPrice <= 0 || averagePrice <= 0) {
        console.warn(`Skipping invalid position ${position.position_id}: qty=${quantity}, current=${currentPrice}, avg=${averagePrice}`);
        continue;
      }

      const marketValue = quantity * currentPrice;
      const unrealizedPl = quantity * (currentPrice - averagePrice);
      const unrealizedPlPercentage = ((currentPrice - averagePrice) / averagePrice) * 100;

      await position.update({
        market_value: marketValue,
        unrealized_pl: unrealizedPl,
        unrealized_pl_percentage: unrealizedPlPercentage,
        last_update_date: new Date()
      });

      updatedPositions.push(position);
    }

    return updatedPositions;
  }

  // Recalculate all portfolios for a user
  static async recalculateAllPortfolios(userId = null) {
    const whereClause = { is_active: true };
    if (userId) {
      whereClause.user_id = userId;
    }

    const portfolios = await Portfolio.findAll({ where: whereClause });
    const results = [];

    for (const portfolio of portfolios) {
      try {
        // Recalculate positions first
        await this.recalculatePositions(portfolio.portfolio_id);
        // Then recalculate portfolio
        const updatedPortfolio = await this.recalculatePortfolioValues(portfolio.portfolio_id);
        results.push(updatedPortfolio);
      } catch (error) {
        console.error(`Error recalculating portfolio ${portfolio.portfolio_id}:`, error);
      }
    }

    return results;
  }

  // Validate portfolio data
  static validatePortfolioData(data) {
    const errors = [];

    if (data.initial_balance !== undefined && data.initial_balance < 0) {
      errors.push('Initial balance cannot be negative');
    }

    if (data.current_balance !== undefined && data.current_balance < 0) {
      errors.push('Current balance cannot be negative');
    }

    return errors;
  }

  // Validate position data
  static validatePositionData(data) {
    const errors = [];

    if (data.quantity !== undefined && data.quantity <= 0) {
      errors.push('Quantity must be positive');
    }

    if (data.average_price !== undefined && data.average_price <= 0) {
      errors.push('Average price must be positive');
    }

    if (data.current_price !== undefined && data.current_price <= 0) {
      errors.push('Current price must be positive');
    }

    return errors;
  }
}

module.exports = PortfolioService;
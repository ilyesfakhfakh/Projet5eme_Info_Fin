const db = require('../models');
const Position = db.positions;
const Transaction = db.transactions;
const Portfolio = db.portfolios;

// Import portfolio recalculation function
const { recalculatePortfolio } = require('./portfolio.controller');
const Asset = db.assets;

// Create a position
exports.create = async (req, res) => {
  try {
    const { portfolio_id } = req.params;
    const {
      asset_symbol,
      asset_type,
      quantity,
      average_price,
      current_price,
      market_value,
      currency = 'EUR'
    } = req.body;

    // Validate required fields
    if (!portfolio_id || !asset_symbol || !quantity || !average_price) {
      return res.status(400).json({
        message: 'portfolio_id, asset_symbol, quantity, and average_price are required'
      });
    }

    // Check if portfolio exists
    const portfolio = await Portfolio.findByPk(portfolio_id);
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }

    // Calculate market value if not provided
    const calculatedMarketValue = market_value || (quantity * (current_price || average_price));

    const position = await Position.create({
      portfolio_id,
      asset_symbol,
      asset_type: asset_type || 'STOCK',
      quantity,
      average_price,
      current_price: current_price || average_price,
      market_value: calculatedMarketValue,
      currency,
      unrealized_pl: (current_price || average_price - average_price) * quantity,
      unrealized_pl_percentage: current_price && average_price ?
        ((current_price - average_price) / average_price) * 100 : 0
    });

    // Create initial transaction record
    await Transaction.create({
      portfolio_id,
      position_id: position.position_id,
      transaction_type: 'BUY',
      quantity,
      price: average_price,
      amount: quantity * average_price,
      currency,
      status: 'COMPLETED'
    });

    // Recalculate portfolio financial metrics
    await recalculatePortfolio(portfolio_id);

    res.status(201).json(position);
  } catch (error) {
    console.error('Error creating position:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all positions for a portfolio
exports.findByPortfolio = async (req, res) => {
  try {
    const { portfolio_id } = req.params;
    const { include_archived = false } = req.query;

    const whereClause = { portfolio_id };
    if (!include_archived) {
      whereClause.is_archived = false;
    }

    const positions = await Position.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']]
    });

    res.json(positions);
  } catch (error) {
    console.error('Error finding positions:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get position by ID
exports.findOne = async (req, res) => {
  try {
    const { id } = req.params;

    const position = await Position.findByPk(id, {
      include: [{
        model: Transaction,
        as: 'transactions',
        required: false,
        order: [['created_at', 'DESC']]
      }]
    });

    if (!position) {
      return res.status(404).json({ message: 'Position not found' });
    }

    res.json(position);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update position
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const position = await Position.findByPk(id);
    if (!position) {
      return res.status(404).json({ message: 'Position not found' });
    }

    // Recalculate derived fields if prices changed
    if (updates.current_price || updates.quantity) {
      const newQuantity = updates.quantity || position.quantity;
      const newCurrentPrice = updates.current_price || position.current_price;
      const newAveragePrice = updates.average_price || position.average_price;

      updates.market_value = newQuantity * newCurrentPrice;
      updates.unrealized_pl = (newCurrentPrice - newAveragePrice) * newQuantity;
      updates.unrealized_pl_percentage = newAveragePrice ?
        ((newCurrentPrice - newAveragePrice) / newAveragePrice) * 100 : 0;
    }

    await position.update({
      ...updates,
      last_update_date: new Date()
    });

    // Recalculate portfolio financial metrics
    await recalculatePortfolio(position.portfolio_id);

    res.json(position);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Archive position (soft delete)
exports.archive = async (req, res) => {
  try {
    const { id } = req.params;

    const position = await Position.findByPk(id);
    if (!position) {
      return res.status(404).json({ message: 'Position not found' });
    }

    await position.update({
      is_archived: true,
      last_update_date: new Date()
    });

    // Recalculate portfolio financial metrics
    await recalculatePortfolio(position.portfolio_id);

    res.json({ message: 'Position archived successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete position (hard delete)
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    const position = await Position.findByPk(id);
    if (!position) {
      return res.status(404).json({ message: 'Position not found' });
    }

    // Check if there are transactions
    const transactionCount = await Transaction.count({ where: { position_id: id } });
    if (transactionCount > 0) {
      return res.status(400).json({
        message: 'Cannot delete position with transaction history. Archive instead.'
      });
    }

    await position.destroy();
    res.json({ message: 'Position deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get position performance
exports.getPerformance = async (req, res) => {
  try {
    const { id } = req.params;

    const position = await Position.findByPk(id, {
      include: [{
        model: Transaction,
        as: 'transactions',
        required: false,
        order: [['created_at', 'ASC']]
      }]
    });

    if (!position) {
      return res.status(404).json({ message: 'Position not found' });
    }

    // Calculate performance metrics
    const totalInvested = position.transactions
      .filter(t => t.transaction_type === 'BUY')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const totalDivested = position.transactions
      .filter(t => t.transaction_type === 'SELL')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const currentValue = parseFloat(position.market_value);
    const totalReturn = totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested) * 100 : 0;

    res.json({
      position_id: position.position_id,
      asset_symbol: position.asset_symbol,
      total_invested: totalInvested,
      total_divested: totalDivested,
      current_value: currentValue,
      unrealized_pl: position.unrealized_pl,
      total_return_percentage: totalReturn,
      transactions_count: position.transactions.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
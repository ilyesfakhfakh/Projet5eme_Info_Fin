const db = require('../models');
const Portfolio = db.portfolios;
const Position = db.positions;
const Transaction = db.transactions;
const { Op } = db.Sequelize.Op;

// Helper function to recalculate portfolio financial metrics
const recalculatePortfolio = async (portfolioId) => {
  const portfolio = await Portfolio.findByPk(portfolioId);
  if (!portfolio) return;

  // Get all active positions
  const positions = await Position.findAll({
    where: { portfolio_id: portfolioId, is_archived: false }
  });

  // Calculate positions value
  let positionsValue = 0;
  positions.forEach(position => {
    positionsValue += parseFloat(position.market_value || 0);
  });

  // Calculate new totals
  const totalValue = parseFloat(portfolio.current_balance) + positionsValue;
  const profitLoss = totalValue - parseFloat(portfolio.initial_balance);
  const profitLossPercentage = parseFloat(portfolio.initial_balance) > 0 ?
    (profitLoss / parseFloat(portfolio.initial_balance)) * 100 : 0;

  // Update portfolio
  await portfolio.update({
    total_value: totalValue,
    profit_loss: profitLoss,
    profit_loss_percentage: profitLossPercentage,
    last_update_date: new Date()
  });

  return portfolio;
};

// Créer un portfolio
exports.create = async (req, res) => {
  try {
    console.log('Creating portfolio with data:', req.body);
    const { user_id, portfolio_name, base_currency, initial_balance } = req.body;

    if (!user_id || !portfolio_name) {
      return res.status(400).json({ message: 'user_id et portfolio_name sont requis' });
    }

    const initialBalance = initial_balance || 100000; // Default €100,000

    const portfolio = await Portfolio.create({
      user_id,
      portfolio_name,
      base_currency: base_currency || 'EUR',
      initial_balance: initialBalance,
      current_balance: initialBalance, // Start with full balance as cash
      total_value: initialBalance,
      profit_loss: 0,
      profit_loss_percentage: 0
    });

    console.log('Portfolio created successfully:', portfolio);
    res.status(201).json(portfolio);
  } catch (error) {
    console.error('Error creating portfolio:', error);
    res.status(500).json({ message: error.message });
  }
};

// Lire un portfolio
exports.findOne = async (req, res) => {
  try {
    const { id } = req.params;
    const portfolio = await Portfolio.findByPk(id);

    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio non trouvé' });
    }

    res.json(portfolio);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mettre à jour un portfolio
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { portfolio_name, base_currency } = req.body;

    const portfolio = await Portfolio.findByPk(id);
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio non trouvé' });
    }

    await portfolio.update({
      portfolio_name: portfolio_name || portfolio.portfolio_name,
      base_currency: base_currency || portfolio.base_currency,
      last_update_date: new Date()
    });

    res.json(portfolio);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Supprimer un portfolio
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si des positions existent
    const positionsCount = await Position.count({ where: { portfolio_id: id } });
    if (positionsCount > 0) {
      return res.status(400).json({ message: 'Impossible de supprimer un portfolio avec des positions rattachées' });
    }

    const portfolio = await Portfolio.findByPk(id);
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio non trouvé' });
    }

    await portfolio.destroy();
    res.json({ message: 'Portfolio supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Soldes par portefeuille: total par position + total portefeuille
exports.getPortfolioBalances = async (req, res) => {
  try {
    const { id } = req.params;

    const portfolio = await Portfolio.findByPk(id, {
      include: [{
        model: Position,
        as: 'positions',
        where: { is_archived: false },
        required: false
      }]
    });

    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio non trouvé' });
    }

    const totalBalance = portfolio.positions.reduce((sum, position) => sum + parseFloat(position.quantity), 0);

    res.json({
      portfolio_id: portfolio.portfolio_id,
      portfolio_name: portfolio.portfolio_name,
      base_currency: portfolio.base_currency,
      total_balance: totalBalance,
      positions: portfolio.positions.map(pos => ({
        position_id: pos.position_id,
        account_title: pos.account_title,
        account_type: pos.account_type,
        balance: pos.quantity,
        currency: pos.currency
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Gestion Multi-Devises Avancée
exports.getCurrencyExposure = async (req, res) => {
  try {
    const { id } = req.params;

    const portfolio = await Portfolio.findByPk(id, {
      include: [{
        model: Position,
        as: 'positions',
        where: { is_archived: false },
        required: false
      }]
    });

    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio non trouvé' });
    }

    // Calcul de l'exposition par devise
    const currencyExposure = {};
    let totalValue = 0;

    portfolio.positions.forEach(position => {
      const currency = position.currency;
      const value = parseFloat(position.quantity);

      if (!currencyExposure[currency]) {
        currencyExposure[currency] = {
          total_balance: 0,
          percentage: 0,
          positions_count: 0
        };
      }

      currencyExposure[currency].total_balance += value;
      currencyExposure[currency].positions_count += 1;
      totalValue += value;
    });

    // Calcul des pourcentages
    Object.keys(currencyExposure).forEach(currency => {
      currencyExposure[currency].percentage = totalValue > 0 ?
        (currencyExposure[currency].total_balance / totalValue) * 100 : 0;
    });

    res.json({
      portfolio_id: portfolio.portfolio_id,
      base_currency: portfolio.base_currency,
      total_value: totalValue,
      currency_exposure: currencyExposure
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Export helper functions for use in other controllers
exports.recalculatePortfolio = recalculatePortfolio;

// Analyse de Performance Détaillée
exports.getPerformance = async (req, res) => {
  try {
    const { id } = req.params;
    const { period = 'month', benchmark = 'EUR' } = req.query;

    const portfolio = await Portfolio.findByPk(id, {
      include: [{
        model: Position,
        as: 'positions',
        where: { is_archived: false },
        required: false,
        include: [{
          model: Transaction,
          as: 'transactions',
          where: { status: 'VALIDATED' },
          required: false
        }]
      }]
    });

    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio non trouvé' });
    }

    // Calcul des métriques de performance
    const performance = {
      total_return: 0,
      annualized_return: 0,
      volatility: 0,
      sharpe_ratio: 0,
      max_drawdown: 0,
      benchmark_comparison: 0
    };

    // Calcul simplifié du rendement total
    let totalInvested = 0;
    let currentValue = 0;

    portfolio.positions.forEach(position => {
      currentValue += parseFloat(position.quantity);
      // Calcul des investissements totaux (crédits - débits)
      position.transactions.forEach(transaction => {
        if (transaction.transaction_type === 'CREDIT') {
          totalInvested += parseFloat(transaction.amount);
        } else if (transaction.transaction_type === 'DEBIT') {
          totalInvested -= parseFloat(transaction.amount);
        }
      });
    });

    performance.total_return = totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested) * 100 : 0;

    res.json({
      portfolio_id: portfolio.portfolio_id,
      period,
      performance,
      benchmark
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Allocation d'Actifs Intelligente - Rééquilibrage
exports.rebalance = async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    const { id } = req.params;
    const { target_allocations, rebalance_threshold = 5 } = req.body;

    const portfolio = await Portfolio.findByPk(id, {
      include: [{
        model: Position,
        as: 'positions',
        where: { is_archived: false },
        required: false
      }],
      transaction: t
    });

    if (!portfolio) {
      await t.rollback();
      return res.status(404).json({ message: 'Portfolio non trouvé' });
    }

    // Calcul de la valeur totale du portefeuille
    const totalValue = portfolio.positions.reduce((sum, position) =>
      sum + parseFloat(position.quantity), 0);

    if (totalValue === 0) {
      await t.rollback();
      return res.status(400).json({ message: 'Portefeuille vide - impossible de rééquilibrer' });
    }

    // Analyse des écarts par rapport aux allocations cibles
    const rebalanceActions = [];
    const currentAllocations = {};

    portfolio.positions.forEach(position => {
      const percentage = (parseFloat(position.quantity) / totalValue) * 100;
      currentAllocations[position.account_title] = percentage;

      if (target_allocations[position.account_title]) {
        const target = target_allocations[position.account_title];
        const deviation = Math.abs(percentage - target);

        if (deviation > rebalance_threshold) {
          rebalanceActions.push({
            position_id: position.position_id,
            account_title: position.account_title,
            current_percentage: percentage,
            target_percentage: target,
            deviation: deviation,
            action: percentage > target ? 'SELL' : 'BUY',
            amount: Math.abs((target - percentage) / 100 * totalValue)
          });
        }
      }
    });

    // Ici, en production, on créerait les transactions nécessaires
    // Pour la démo, on retourne juste le plan de rééquilibrage

    await t.commit();

    res.json({
      portfolio_id: portfolio.portfolio_id,
      total_value: totalValue,
      current_allocations: currentAllocations,
      target_allocations,
      rebalance_actions: rebalanceActions,
      rebalance_threshold,
      message: rebalanceActions.length > 0 ?
        'Rééquilibrage recommandé' : 'Aucune action nécessaire'
    });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ message: error.message });
  }
};

// Allocation d'Actifs Intelligente - Optimisation
exports.optimize = async (req, res) => {
  try {
    const { id } = req.params;
    const { risk_tolerance = 'moderate', investment_horizon = 5 } = req.query;

    const portfolio = await Portfolio.findByPk(id, {
      include: [{
        model: Position,
        as: 'positions',
        where: { is_archived: false },
        required: false
      }]
    });

    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio non trouvé' });
    }

    // Simulation d'optimisation basée sur la théorie moderne du portefeuille
    const optimization = {
      risk_tolerance,
      investment_horizon,
      recommended_allocation: {},
      expected_return: 0,
      expected_risk: 0,
      sharpe_ratio: 0
    };

    // Allocation recommandée basée sur la tolérance au risque
    const riskProfiles = {
      conservative: { stocks: 30, bonds: 50, cash: 20 },
      moderate: { stocks: 60, bonds: 30, cash: 10 },
      aggressive: { stocks: 80, bonds: 15, cash: 5 }
    };

    optimization.recommended_allocation = riskProfiles[risk_tolerance] || riskProfiles.moderate;

    // Calculs simplifiés
    optimization.expected_return = risk_tolerance === 'conservative' ? 4 :
                                  risk_tolerance === 'moderate' ? 7 : 10;
    optimization.expected_risk = risk_tolerance === 'conservative' ? 3 :
                                 risk_tolerance === 'moderate' ? 8 : 15;
    optimization.sharpe_ratio = optimization.expected_return / optimization.expected_risk;

    res.json({
      portfolio_id: portfolio.portfolio_id,
      optimization
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lister les portfolios avec filtres
exports.findAll = async (req, res) => {
  try {
    console.log('Finding all portfolios with query:', req.query);
    const { user_id, ...otherFilters } = req.query;

    const whereClause = { is_active: true };
    if (user_id) {
      whereClause.user_id = user_id;
    }

    // Add other filters if needed (e.g., portfolio_name, base_currency)
    if (otherFilters.portfolio_name) {
      whereClause.portfolio_name = { [Op.iLike]: `%${otherFilters.portfolio_name}%` };
    }
    if (otherFilters.base_currency) {
      whereClause.base_currency = otherFilters.base_currency;
    }

    const portfolios = await Portfolio.findAll({
      where: whereClause,
      order: [['creation_date', 'DESC']]
    });

    console.log('Found portfolios:', portfolios.length);
    res.json(portfolios);
  } catch (error) {
    console.error('Error finding portfolios:', error);
    res.status(500).json({ message: error.message });
  }
};
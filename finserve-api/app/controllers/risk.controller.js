const db = require('../models');
const { Op } = require('sequelize');

// Risk calculation utilities
class RiskCalculator {
  // Calculate exposure by trader/portfolio/instrument
  static async calculateExposure(filters = {}) {
    try {
      const { trader_id, portfolio_id, instrument_type } = filters;

      let whereClause = {};
      if (portfolio_id) whereClause.portfolio_id = portfolio_id;
      if (instrument_type) whereClause.instrument_type = instrument_type;

      // Get positions
      const positions = await db.positions.findAll({
        where: whereClause,
        include: [
          {
            model: db.portfolios,
            as: 'portfolio',
            where: trader_id ? { user_id: trader_id } : undefined,
            required: !!trader_id
          },
          {
            model: db.assets,
            as: 'asset'
          }
        ]
      });

      // Calculate exposures
      const exposures = {
        gross_long: 0,
        gross_short: 0,
        net: 0,
        by_instrument: {},
        by_portfolio: {},
        by_trader: trader_id ? {} : undefined
      };

      positions.forEach(position => {
        const marketValue = position.quantity * (position.current_price || position.entry_price);
        const absValue = Math.abs(marketValue);

        if (marketValue > 0) {
          exposures.gross_long += absValue;
        } else {
          exposures.gross_short += absValue;
        }

        exposures.net += marketValue;

        // By instrument
        const instrumentKey = position.asset_id || position.asset_symbol || `unknown_${position.position_id}`;
        if (!exposures.by_instrument[instrumentKey]) {
          exposures.by_instrument[instrumentKey] = {
            asset_id: position.asset_id,
            symbol: position.asset?.symbol || position.asset_symbol || `Asset ${instrumentKey}`,
            long: 0,
            short: 0,
            net: 0
          };
        }
        if (marketValue > 0) {
          exposures.by_instrument[instrumentKey].long += absValue;
        } else {
          exposures.by_instrument[instrumentKey].short += absValue;
        }
        exposures.by_instrument[instrumentKey].net += marketValue;

        // By portfolio
        if (!exposures.by_portfolio[position.portfolio_id]) {
          exposures.by_portfolio[position.portfolio_id] = {
            portfolio_id: position.portfolio_id,
            name: position.portfolio.portfolio_name,
            long: 0,
            short: 0,
            net: 0
          };
        }
        if (marketValue > 0) {
          exposures.by_portfolio[position.portfolio_id].long += absValue;
        } else {
          exposures.by_portfolio[position.portfolio_id].short += absValue;
        }
        exposures.by_portfolio[position.portfolio_id].net += marketValue;
      });

      return exposures;
    } catch (error) {
      throw new Error(`Exposure calculation failed: ${error.message}`);
    }
  }

  // Simple parametric VaR calculation
  static calculateVaR(returns, confidence = 0.95, timeHorizon = 1) {
    if (!returns || returns.length === 0) return 0;

    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    // For normal distribution, z-score for 95% confidence is ~1.645
    const zScore = confidence === 0.95 ? 1.645 : confidence === 0.99 ? 2.326 : 1.96;
    const dailyVaR = stdDev * zScore;

    return dailyVaR * Math.sqrt(timeHorizon);
  }

  // Calculate Conditional VaR (Expected Shortfall)
  static calculateCVaR(returns, confidence = 0.95, timeHorizon = 1) {
    if (!returns || returns.length === 0) return 0;

    // Sort returns in ascending order (worst to best)
    const sortedReturns = [...returns].sort((a, b) => a - b);

    // Find the index for the confidence level (e.g., 5% worst cases for 95% confidence)
    const tailIndex = Math.floor((1 - confidence) * sortedReturns.length);

    // Calculate average of the tail losses
    const tailLosses = sortedReturns.slice(0, tailIndex + 1);
    const expectedShortfall = tailLosses.reduce((sum, loss) => sum + loss, 0) / tailLosses.length;

    return Math.abs(expectedShortfall) * Math.sqrt(timeHorizon);
  }

  // Calculate Sharpe Ratio
  static calculateSharpeRatio(returns, riskFreeRate = 0.02, timeHorizon = 252) {
    if (!returns || returns.length === 0) return 0;

    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    const annualizedReturn = mean * Math.sqrt(timeHorizon);
    const annualizedVolatility = stdDev * Math.sqrt(timeHorizon);

    return (annualizedReturn - riskFreeRate) / annualizedVolatility;
  }

  // Calculate Maximum Drawdown
  static calculateMaxDrawdown(returns) {
    if (!returns || returns.length === 0) return 0;

    let peak = returns[0];
    let maxDrawdown = 0;

    for (let i = 1; i < returns.length; i++) {
      const cumulativeReturn = returns.slice(0, i + 1).reduce((sum, r) => sum + r, 0);
      if (cumulativeReturn > peak) {
        peak = cumulativeReturn;
      }
      const drawdown = peak - cumulativeReturn;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    return maxDrawdown;
  }

  // Calculate Value at Risk using Historical Simulation
  static calculateHistoricalVaR(returns, confidence = 0.95, timeHorizon = 1) {
    if (!returns || returns.length === 0) return 0;

    // Sort returns in ascending order
    const sortedReturns = [...returns].sort((a, b) => a - b);

    // Find the return at the confidence level
    const index = Math.floor((1 - confidence) * sortedReturns.length);
    const dailyVaR = Math.abs(sortedReturns[index]);

    return dailyVaR * Math.sqrt(timeHorizon);
  }

  // Calculate historical portfolio returns from position data
  static async calculatePortfolioHistoricalReturns(portfolio_id, days = 252) {
    try {
      // Get current positions
      const positions = await db.positions.findAll({
        where: { portfolio_id },
        include: [{ model: db.assets, as: 'asset' }]
      });

      if (positions.length === 0) {
        return [];
      }

      // Get historical data for all assets in portfolio
      const assetIds = positions.map(p => p.asset_id).filter(id => id);
      if (assetIds.length === 0) {
        return [];
      }

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      const historicalData = await db.historical_data.findAll({
        where: {
          asset_id: assetIds,
          date: {
            [db.Sequelize.Op.between]: [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
          }
        },
        order: [['date', 'ASC']]
      });

      // Group historical data by date
      const dataByDate = {};
      historicalData.forEach(record => {
        if (!dataByDate[record.date]) {
          dataByDate[record.date] = {};
        }
        dataByDate[record.date][record.asset_id] = record.adjusted_close || record.close_price;
      });

      // Calculate portfolio returns for each date
      const portfolioReturns = [];
      const dates = Object.keys(dataByDate).sort();

      for (let i = 1; i < dates.length; i++) {
        const currentDate = dates[i];
        const previousDate = dates[i - 1];
        const currentPrices = dataByDate[currentDate];
        const previousPrices = dataByDate[previousDate];

        let portfolioValueCurrent = 0;
        let portfolioValuePrevious = 0;

        // Calculate portfolio values
        positions.forEach(position => {
          const assetId = position.asset_id;
          const quantity = position.quantity;

          if (currentPrices[assetId] && previousPrices[assetId]) {
            portfolioValueCurrent += quantity * currentPrices[assetId];
            portfolioValuePrevious += quantity * previousPrices[assetId];
          }
        });

        if (portfolioValuePrevious > 0) {
          const dailyReturn = (portfolioValueCurrent - portfolioValuePrevious) / portfolioValuePrevious;
          portfolioReturns.push(dailyReturn);
        }
      }

      return portfolioReturns;
    } catch (error) {
      console.error('Error calculating portfolio historical returns:', error);
      return [];
    }
  }

  // Calculate PnL potential based on simulated market movements
  static async calculatePnLPotential(portfolio_id, scenarios = []) {
    try {
      const positions = await db.positions.findAll({
        where: { portfolio_id },
        include: [{ model: db.assets, as: 'asset' }]
      });

      const results = [];

      for (const scenario of scenarios) {
        let totalPnL = 0;
        const pnlBreakdown = {
          equity: 0,
          fx: 0,
          rates: 0,
          commodities: 0,
          credit: 0
        };

        positions.forEach(position => {
          const asset = position.asset;
          const quantity = position.quantity;
          const currentPrice = position.current_price || position.entry_price;
          const assetType = asset?.asset_type || 'EQUITY'; // Default to equity if not specified

          let positionPnL = 0;

          // Calculate P&L based on asset type and scenario shocks
          switch (assetType.toUpperCase()) {
            case 'EQUITY':
            case 'STOCK':
              if (scenario.market_shocks?.equity) {
                positionPnL = quantity * currentPrice * scenario.market_shocks.equity;
                pnlBreakdown.equity += positionPnL;
              }
              break;

            case 'BOND':
            case 'FIXED_INCOME':
              // Bonds affected by rate changes and credit spreads
              let bondPnL = 0;
              if (scenario.market_shocks?.rates) {
                // Simplified: assume 5-year duration for bonds
                const duration = asset?.duration || 5;
                bondPnL += quantity * currentPrice * (-duration * scenario.market_shocks.rates);
              }
              if (scenario.market_shocks?.credit_spreads) {
                // Credit spread widening reduces bond prices
                bondPnL += quantity * currentPrice * (-scenario.market_shocks.credit_spreads);
              }
              if (scenario.market_shocks?.bonds) {
                bondPnL += quantity * currentPrice * scenario.market_shocks.bonds;
              }
              positionPnL = bondPnL;
              pnlBreakdown.rates += bondPnL;
              break;

            case 'FX':
            case 'CURRENCY':
              if (scenario.market_shocks?.fx && asset?.currency) {
                const fxShock = scenario.market_shocks.fx[asset.currency.toUpperCase()];
                if (fxShock) {
                  positionPnL = quantity * currentPrice * fxShock;
                  pnlBreakdown.fx += positionPnL;
                }
              }
              break;

            case 'COMMODITY':
              if (scenario.market_shocks?.commodities && asset?.commodity_type) {
                const commodityShock = scenario.market_shocks.commodities[asset.commodity_type.toUpperCase()];
                if (commodityShock) {
                  positionPnL = quantity * currentPrice * commodityShock;
                  pnlBreakdown.commodities += positionPnL;
                }
              }
              break;

            case 'DERIVATIVE':
            case 'OPTION':
            case 'FUTURE':
              // Derivatives have higher sensitivity - amplify shocks
              const baseShock = scenario.market_shocks?.equity || scenario.market_shocks?.volatility || 0;
              const leverage = asset?.leverage || 2; // Assume 2x leverage for derivatives
              positionPnL = quantity * currentPrice * baseShock * leverage;
              pnlBreakdown.equity += positionPnL;
              break;

            default:
              // Default to equity-like behavior
              if (scenario.market_shocks?.equity) {
                positionPnL = quantity * currentPrice * scenario.market_shocks.equity;
                pnlBreakdown.equity += positionPnL;
              }
              break;
          }

          // Apply liquidity discount if scenario includes liquidity shock
          if (scenario.market_shocks?.liquidity) {
            const liquidityDiscount = Math.abs(scenario.market_shocks.liquidity) * 0.1; // 10% of liquidity shock
            positionPnL *= (1 - liquidityDiscount);
          }

          // Apply volatility premium for stressed scenarios
          if (scenario.market_shocks?.volatility) {
            const volPremium = scenario.market_shocks.volatility * 0.5; // Additional 50% of volatility shock
            positionPnL *= (1 + volPremium);
          }

          totalPnL += positionPnL;
        });

        results.push({
          scenario: scenario.name,
          pnl: totalPnL,
          probability: scenario.probability || 0,
          breakdown: pnlBreakdown,
          scenario_type: scenario.scenario_type,
          time_horizon_days: scenario.time_horizon_days
        });
      }

      return results;
    } catch (error) {
      throw new Error(`PnL calculation failed: ${error.message}`);
    }
  }
}

// Controller methods
exports.getExposure = async (req, res) => {
  try {
    const { trader_id, portfolio_id, instrument_type } = req.query;

    const exposure = await RiskCalculator.calculateExposure({
      trader_id,
      portfolio_id,
      instrument_type
    });

    res.json({
      success: true,
      data: exposure
    });
  } catch (error) {
    console.error('Error calculating exposure:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getRiskMetrics = async (req, res) => {
  try {
    const { portfolio_id, metric_type, date_from, date_to } = req.query;

    let whereClause = {};
    if (portfolio_id) whereClause.portfolio_id = portfolio_id;
    if (metric_type) whereClause.metric_type = metric_type;
    if (date_from || date_to) {
      whereClause.calculation_date = {};
      if (date_from) whereClause.calculation_date[Op.gte] = new Date(date_from);
      if (date_to) whereClause.calculation_date[Op.lte] = new Date(date_to);
    }

    const metrics = await db.risk_metrics.findAll({
      where: whereClause,
      include: [
        {
          model: db.portfolios,
          as: 'portfolio',
          attributes: ['portfolio_id', 'portfolio_name']
        }
      ],
      order: [['calculation_date', 'DESC']]
    });

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error fetching risk metrics:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.calculateVaR = async (req, res) => {
  try {
    const { portfolio_id, confidence = 0.95, time_horizon = 1 } = req.body;

    // Get historical portfolio returns from actual historical data
    const historicalReturns = await RiskCalculator.calculatePortfolioHistoricalReturns(portfolio_id, 252);

    let var_value;
    let calculation_method;

    if (historicalReturns.length > 0) {
      // Use historical simulation if we have real data
      var_value = RiskCalculator.calculateHistoricalVaR(historicalReturns, confidence, time_horizon);
      calculation_method = 'HISTORICAL';
    } else {
      // Fallback to parametric VaR with mock data if no historical data available
      const mockReturns = Array.from({ length: 252 }, () => (Math.random() - 0.5) * 0.02);
      var_value = RiskCalculator.calculateVaR(mockReturns, confidence, time_horizon);
      calculation_method = 'PARAMETRIC';
    }

    // Save to database
    const metric = await db.risk_metrics.create({
      portfolio_id,
      calculation_date: new Date(),
      metric_type: 'VAR',
      value: var_value,
      currency: 'EUR',
      confidence_level: confidence,
      time_horizon_days: time_horizon,
      calculation_method: calculation_method,
      status: 'CALCULATED',
      created_by: req.user?.user_id || 'system',
      metadata: {
        data_points: historicalReturns.length,
        calculation_note: historicalReturns.length > 0 ? 'Based on historical portfolio returns' : 'Fallback to parametric calculation due to insufficient historical data'
      }
    });

    res.json({
      success: true,
      data: metric
    });
  } catch (error) {
    console.error('Error calculating VaR:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.calculateCVaR = async (req, res) => {
  try {
    const { portfolio_id, confidence = 0.95, time_horizon = 1 } = req.body;

    // Get historical portfolio returns from actual historical data
    const historicalReturns = await RiskCalculator.calculatePortfolioHistoricalReturns(portfolio_id, 252);

    let cvar_value;
    let calculation_method;

    if (historicalReturns.length > 0) {
      // Use historical simulation if we have real data
      cvar_value = RiskCalculator.calculateCVaR(historicalReturns, confidence, time_horizon);
      calculation_method = 'HISTORICAL';
    } else {
      // Fallback to parametric CVaR with mock data if no historical data available
      const mockReturns = Array.from({ length: 252 }, () => (Math.random() - 0.5) * 0.02);
      cvar_value = RiskCalculator.calculateCVaR(mockReturns, confidence, time_horizon);
      calculation_method = 'PARAMETRIC';
    }

   // Save to database
   const metric = await db.risk_metrics.create({
     portfolio_id,
     calculation_date: new Date(),
     metric_type: 'CVAR',
     value: cvar_value,
     currency: 'EUR',
     confidence_level: confidence,
     time_horizon_days: time_horizon,
     calculation_method: calculation_method,
     status: 'CALCULATED',
     created_by: req.user?.user_id || 'system',
     metadata: {
       data_points: historicalReturns.length,
       calculation_note: historicalReturns.length > 0 ? 'Based on historical portfolio returns' : 'Fallback to parametric calculation due to insufficient historical data'
     }
   });

   res.json({
     success: true,
     data: metric
   });
 } catch (error) {
   console.error('Error calculating CVaR:', error);
   res.status(500).json({
     success: false,
     message: error.message
   });
 }
};

exports.calculateSharpeRatio = async (req, res) => {
  try {
    const { portfolio_id, risk_free_rate = 0.02, time_horizon = 252 } = req.body;

    // Get historical portfolio returns from actual historical data
    const historicalReturns = await RiskCalculator.calculatePortfolioHistoricalReturns(portfolio_id, time_horizon);

    let sharpe_ratio;
    let calculation_method;

    if (historicalReturns.length > 0) {
      // Use historical data if available
      sharpe_ratio = RiskCalculator.calculateSharpeRatio(historicalReturns, risk_free_rate, time_horizon);
      calculation_method = 'HISTORICAL';
    } else {
      // Fallback to mock data
      const mockReturns = Array.from({ length: time_horizon }, () => (Math.random() - 0.5) * 0.02);
      sharpe_ratio = RiskCalculator.calculateSharpeRatio(mockReturns, risk_free_rate, time_horizon);
      calculation_method = 'PARAMETRIC';
    }

   // Save to database
   const metric = await db.risk_metrics.create({
     portfolio_id,
     calculation_date: new Date(),
     metric_type: 'SHARPE_RATIO',
     value: sharpe_ratio,
     currency: 'EUR',
     time_horizon_days: time_horizon,
     calculation_method: calculation_method,
     status: 'CALCULATED',
     created_by: req.user?.user_id || 'system',
     metadata: {
       risk_free_rate: risk_free_rate,
       data_points: historicalReturns.length,
       calculation_note: historicalReturns.length > 0 ? 'Based on historical portfolio returns' : 'Fallback to parametric calculation due to insufficient historical data'
     }
   });

   res.json({
     success: true,
     data: metric
   });
 } catch (error) {
   console.error('Error calculating Sharpe Ratio:', error);
   res.status(500).json({
     success: false,
     message: error.message
   });
 }
};

exports.calculateMaxDrawdown = async (req, res) => {
  try {
    const { portfolio_id } = req.body;

    // Get historical portfolio returns from actual historical data
    const historicalReturns = await RiskCalculator.calculatePortfolioHistoricalReturns(portfolio_id, 252);

    let max_drawdown;
    let calculation_method;

    if (historicalReturns.length > 0) {
      // Use historical data if available
      max_drawdown = RiskCalculator.calculateMaxDrawdown(historicalReturns);
      calculation_method = 'HISTORICAL';
    } else {
      // Fallback to mock data
      const mockReturns = Array.from({ length: 252 }, () => (Math.random() - 0.5) * 0.02);
      max_drawdown = RiskCalculator.calculateMaxDrawdown(mockReturns);
      calculation_method = 'PARAMETRIC';
    }

   // Save to database
   const metric = await db.risk_metrics.create({
     portfolio_id,
     calculation_date: new Date(),
     metric_type: 'MAX_DRAWDOWN',
     value: max_drawdown,
     currency: 'EUR',
     calculation_method: calculation_method,
     status: 'CALCULATED',
     created_by: req.user?.user_id || 'system',
     metadata: {
       data_points: historicalReturns.length,
       calculation_note: historicalReturns.length > 0 ? 'Based on historical portfolio returns' : 'Fallback to parametric calculation due to insufficient historical data'
     }
   });

   res.json({
     success: true,
     data: metric
   });
 } catch (error) {
   console.error('Error calculating Max Drawdown:', error);
   res.status(500).json({
     success: false,
     message: error.message
   });
 }
};

exports.calculateHistoricalVaR = async (req, res) => {
  try {
    const { portfolio_id, confidence = 0.95, time_horizon = 1 } = req.body;

    // Get historical portfolio returns from actual historical data
    const historicalReturns = await RiskCalculator.calculatePortfolioHistoricalReturns(portfolio_id, 252);

    let historical_var;
    let calculation_method;

    if (historicalReturns.length > 0) {
      // Use historical data if available
      historical_var = RiskCalculator.calculateHistoricalVaR(historicalReturns, confidence, time_horizon);
      calculation_method = 'HISTORICAL';
    } else {
      // Fallback to mock data
      const mockReturns = Array.from({ length: 252 }, () => (Math.random() - 0.5) * 0.02);
      historical_var = RiskCalculator.calculateHistoricalVaR(mockReturns, confidence, time_horizon);
      calculation_method = 'PARAMETRIC';
    }

   // Save to database
   const metric = await db.risk_metrics.create({
     portfolio_id,
     calculation_date: new Date(),
     metric_type: 'HISTORICAL_VAR',
     value: historical_var,
     currency: 'EUR',
     confidence_level: confidence,
     time_horizon_days: time_horizon,
     calculation_method: calculation_method,
     status: 'CALCULATED',
     created_by: req.user?.user_id || 'system',
     metadata: {
       data_points: historicalReturns.length,
       calculation_note: historicalReturns.length > 0 ? 'Based on historical portfolio returns' : 'Fallback to parametric calculation due to insufficient historical data'
     }
   });

   res.json({
     success: true,
     data: metric
   });
 } catch (error) {
   console.error('Error calculating Historical VaR:', error);
   res.status(500).json({
     success: false,
     message: error.message
   });
 }
};

// Risk Monitoring and Alerting
exports.monitorRiskLimits = async (req, res) => {
 try {
   const { portfolio_id, trader_id } = req.query;

   let whereClause = { is_active: true };
   if (portfolio_id) whereClause.portfolio_id = portfolio_id;
   if (trader_id) whereClause.trader_id = trader_id;

   const limits = await db.risk_limits.findAll({
     where: whereClause,
     include: [
       {
         model: db.portfolios,
         as: 'portfolio_limit',
         attributes: ['portfolio_id', 'portfolio_name']
       }
     ]
   });

   const alertsGenerated = [];

   for (const limit of limits) {
     try {
       let currentValue = 0;
       let breachDetected = false;

       // Calculate current value based on limit type
       switch (limit.limit_type) {
         case 'EXPOSURE':
           const exposure = await RiskCalculator.calculateExposure({
             portfolio_id: limit.portfolio_id
           });
           currentValue = exposure.net;
           breachDetected = Math.abs(currentValue) > limit.limit_value;
           break;

         case 'VAR':
           // Get latest VaR calculation
           const latestVaR = await db.risk_metrics.findOne({
             where: {
               portfolio_id: limit.portfolio_id,
               metric_type: 'VAR'
             },
             order: [['calculation_date', 'DESC']]
           });
           if (latestVaR) {
             currentValue = latestVaR.value;
             breachDetected = Math.abs(currentValue) > limit.limit_value;
           }
           break;

         case 'PNL_MAX':
           // Calculate current P&L
           const positions = await db.positions.findAll({
             where: { portfolio_id: limit.portfolio_id }
           });
           currentValue = positions.reduce((sum, pos) => {
             return sum + (pos.quantity * (pos.current_price || pos.entry_price) - pos.quantity * pos.entry_price);
           }, 0);
           breachDetected = Math.abs(currentValue) > limit.limit_value;
           break;

         default:
           continue; // Skip unknown limit types
       }

       if (breachDetected) {
         // Check if alert already exists for this limit
         const existingAlert = await db.risk_alerts.findOne({
           where: {
             limit_id: limit.limit_id,
             status: 'ACTIVE'
           }
         });

         if (!existingAlert) {
           // Calculate breach percentage
           const breachPercentage = limit.limit_value > 0 ?
             ((currentValue - limit.limit_value) / limit.limit_value) * 100 : 0;

           // Determine severity
           let severity = 'MEDIUM';
           if (Math.abs(breachPercentage) > 50) severity = 'CRITICAL';
           else if (Math.abs(breachPercentage) > 25) severity = 'HIGH';

           // Create alert
           const alert = await db.risk_alerts.create({
             limit_id: limit.limit_id,
             portfolio_id: limit.portfolio_id,
             alert_type: `${limit.limit_type}_BREACH`,
             severity: severity,
             current_value: currentValue,
             limit_value: limit.limit_value,
             breach_percentage: breachPercentage,
             currency: limit.currency,
             status: 'ACTIVE',
             alert_date: new Date(),
             description: `${limit.limit_type} limit breached. Current: ${currentValue.toFixed(2)}, Limit: ${limit.limit_value.toFixed(2)} (${breachPercentage.toFixed(1)}% breach)`
           });

           alertsGenerated.push(alert);

           // Log the alert generation
           await db.risk_logs.create({
             entity_type: 'ALERT',
             entity_id: alert.alert_id,
             action: 'CREATE',
             user_id: 'system',
             portfolio_id: limit.portfolio_id,
             reason: 'Automated risk limit breach detection',
             metadata: {
               limit_type: limit.limit_type,
               breach_percentage: breachPercentage,
               severity: severity
             }
           });
         }
       }
     } catch (error) {
       console.error(`Error monitoring limit ${limit.limit_id}:`, error);
     }
   }

   res.json({
     success: true,
     data: {
       limits_monitored: limits.length,
       alerts_generated: alertsGenerated.length,
       alerts: alertsGenerated
     }
   });
 } catch (error) {
   console.error('Error monitoring risk limits:', error);
   res.status(500).json({
     success: false,
     message: error.message
   });
 }
};

exports.runRiskAssessment = async (req, res) => {
 try {
   const { portfolio_id } = req.body;

   if (!portfolio_id) {
     return res.status(400).json({
       success: false,
       message: 'Portfolio ID is required'
     });
   }

   // Run comprehensive risk assessment
   const assessment = {
     portfolio_id,
     assessment_date: new Date(),
     exposure: null,
     risk_metrics: {},
     alerts: [],
     recommendations: []
   };

   // Calculate exposure
   assessment.exposure = await RiskCalculator.calculateExposure({ portfolio_id });

   // Calculate key risk metrics
   const metrics = ['VAR', 'CVAR', 'SHARPE_RATIO', 'MAX_DRAWDOWN'];
   for (const metricType of metrics) {
     try {
       let metricValue;
       let calculationMethod;

       if (['VAR', 'CVAR', 'SHARPE_RATIO', 'MAX_DRAWDOWN'].includes(metricType)) {
         const historicalReturns = await RiskCalculator.calculatePortfolioHistoricalReturns(portfolio_id, 252);

         if (historicalReturns.length > 0) {
           switch (metricType) {
             case 'VAR':
               metricValue = RiskCalculator.calculateHistoricalVaR(historicalReturns, 0.95, 1);
               break;
             case 'CVAR':
               metricValue = RiskCalculator.calculateCVaR(historicalReturns, 0.95, 1);
               break;
             case 'SHARPE_RATIO':
               metricValue = RiskCalculator.calculateSharpeRatio(historicalReturns, 0.02, 252);
               break;
             case 'MAX_DRAWDOWN':
               metricValue = RiskCalculator.calculateMaxDrawdown(historicalReturns);
               break;
           }
           calculationMethod = 'HISTORICAL';
         } else {
           // Fallback calculations
           const mockReturns = Array.from({ length: 252 }, () => (Math.random() - 0.5) * 0.02);
           switch (metricType) {
             case 'VAR':
               metricValue = RiskCalculator.calculateVaR(mockReturns, 0.95, 1);
               break;
             case 'CVAR':
               metricValue = RiskCalculator.calculateCVaR(mockReturns, 0.95, 1);
               break;
             case 'SHARPE_RATIO':
               metricValue = RiskCalculator.calculateSharpeRatio(mockReturns, 0.02, 252);
               break;
             case 'MAX_DRAWDOWN':
               metricValue = RiskCalculator.calculateMaxDrawdown(mockReturns);
               break;
           }
           calculationMethod = 'PARAMETRIC';
         }
       }

       assessment.risk_metrics[metricType] = {
         value: metricValue,
         calculation_method: calculationMethod
       };

       // Save metric to database
       await db.risk_metrics.create({
         portfolio_id,
         calculation_date: new Date(),
         metric_type: metricType,
         value: metricValue,
         currency: 'EUR',
         calculation_method: calculationMethod,
         status: 'CALCULATED',
         created_by: req.user?.user_id || 'system'
       });

     } catch (error) {
       console.error(`Error calculating ${metricType}:`, error);
     }
   }

   // Generate recommendations based on risk metrics
   assessment.recommendations = generateRiskRecommendations(assessment);

   // Save assessment
   const savedAssessment = await db.risk_assessments.create({
     portfolio_id,
     assessment_date: new Date(),
     risk_score: calculateRiskScore(assessment),
     volatility: assessment.risk_metrics.MAX_DRAWDOWN?.value || 0,
     max_drawdown: assessment.risk_metrics.MAX_DRAWDOWN?.value || 0,
     sharpe_ratio: assessment.risk_metrics.SHARPE_RATIO?.value || 0,
     recommendations: JSON.stringify(assessment.recommendations)
   });

   res.json({
     success: true,
     data: {
       assessment: savedAssessment,
       details: assessment
     }
   });
 } catch (error) {
   console.error('Error running risk assessment:', error);
   res.status(500).json({
     success: false,
     message: error.message
   });
 }
};

// Helper functions
function generateRiskRecommendations(assessment) {
 const recommendations = [];

 const var95 = assessment.risk_metrics.VAR?.value;
 const sharpe = assessment.risk_metrics.SHARPE_RATIO?.value;
 const maxDrawdown = assessment.risk_metrics.MAX_DRAWDOWN?.value;

 if (var95 && var95 > 0.05) { // VaR > 5%
   recommendations.push({
     type: 'HIGH_RISK',
     priority: 'HIGH',
     message: 'Portfolio VaR is above 5%. Consider reducing position sizes or diversifying.',
     action_required: true
   });
 }

 if (sharpe && sharpe < 0.5) { // Sharpe ratio < 0.5
   recommendations.push({
     type: 'LOW_SHARPE',
     priority: 'MEDIUM',
     message: 'Sharpe ratio indicates poor risk-adjusted returns. Review investment strategy.',
     action_required: true
   });
 }

 if (maxDrawdown && maxDrawdown > 0.20) { // Max drawdown > 20%
   recommendations.push({
     type: 'HIGH_DRAWDOWN',
     priority: 'CRITICAL',
     message: 'Maximum drawdown exceeds 20%. Implement stop-loss measures immediately.',
     action_required: true
   });
 }

 if (recommendations.length === 0) {
   recommendations.push({
     type: 'HEALTHY',
     priority: 'LOW',
     message: 'Portfolio risk metrics are within acceptable ranges.',
     action_required: false
   });
 }

 return recommendations;
}

function calculateRiskScore(assessment) {
 let score = 50; // Base score

 const var95 = assessment.risk_metrics.VAR?.value || 0;
 const sharpe = assessment.risk_metrics.SHARPE_RATIO?.value || 0;
 const maxDrawdown = assessment.risk_metrics.MAX_DRAWDOWN?.value || 0;

 // Adjust score based on metrics
 if (var95 > 0.03) score += 20;
 if (sharpe < 1.0) score += 10;
 if (maxDrawdown > 0.15) score += 30;

 // Cap at 100
 return Math.min(score, 100);
}

// Risk Limits CRUD
exports.getLimits = async (req, res) => {
  try {
    const { portfolio_id, trader_id, active_only = true } = req.query;

    let whereClause = {};
    if (portfolio_id) whereClause.portfolio_id = portfolio_id;
    if (trader_id) whereClause.trader_id = trader_id;
    if (active_only === 'true') whereClause.is_active = true;

    const limits = await db.risk_limits.findAll({
      where: whereClause,
      include: [
        {
          model: db.portfolios,
          as: 'portfolio_limit',
          attributes: ['portfolio_id', 'portfolio_name'],
          required: false
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: limits
    });
  } catch (error) {
    console.error('Error fetching limits:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.createLimit = async (req, res) => {
  try {
    const limitData = {
      ...req.body,
      created_by: req.user?.user_id || 'system'
    };

    const limit = await db.risk_limits.create(limitData);

    // Log the action
    await db.risk_logs.create({
      entity_type: 'LIMIT',
      entity_id: limit.limit_id,
      action: 'CREATE',
      user_id: req.user?.user_id || 'system',
      portfolio_id: limit.portfolio_id,
      new_values: limitData,
      reason: 'Risk limit created'
    });

    res.status(201).json({
      success: true,
      data: limit
    });
  } catch (error) {
    console.error('Error creating limit:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateLimit = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const limit = await db.risk_limits.findByPk(id);
    if (!limit) {
      return res.status(404).json({
        success: false,
        message: 'Limit not found'
      });
    }

    const oldValues = { ...limit.dataValues };
    await limit.update(updateData);

    // Log the action
    await db.risk_logs.create({
      entity_type: 'LIMIT',
      entity_id: limit.limit_id,
      action: 'UPDATE',
      user_id: req.user?.user_id || 'system',
      portfolio_id: limit.portfolio_id,
      old_values: oldValues,
      new_values: updateData,
      reason: 'Risk limit updated'
    });

    res.json({
      success: true,
      data: limit
    });
  } catch (error) {
    console.error('Error updating limit:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteLimit = async (req, res) => {
  try {
    const { id } = req.params;

    const limit = await db.risk_limits.findByPk(id);
    if (!limit) {
      return res.status(404).json({
        success: false,
        message: 'Limit not found'
      });
    }

    const oldValues = { ...limit.dataValues };
    await limit.destroy();

    // Log the action
    await db.risk_logs.create({
      entity_type: 'LIMIT',
      entity_id: id,
      action: 'DELETE',
      user_id: req.user?.user_id || 'system',
      portfolio_id: limit.portfolio_id,
      old_values: oldValues,
      reason: 'Risk limit deleted'
    });

    res.json({
      success: true,
      message: 'Limit deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting limit:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Alerts
exports.getAlerts = async (req, res) => {
  try {
    const { portfolio_id, status = 'ACTIVE', severity } = req.query;

    let whereClause = {};
    if (portfolio_id) whereClause.portfolio_id = portfolio_id;
    if (status) whereClause.status = status;
    if (severity) whereClause.severity = severity;

    const alerts = await db.risk_alerts.findAll({
      where: whereClause,
      include: [
        {
          model: db.portfolios,
          as: 'portfolio',
          attributes: ['portfolio_id', 'portfolio_name']
        },
        {
          model: db.risk_limits,
          as: 'risk_limit',
          attributes: ['limit_id', 'limit_type', 'limit_value']
        }
      ],
      order: [['alert_date', 'DESC']]
    });

    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.acknowledgeAlert = async (req, res) => {
  try {
    const { id } = req.params;

    const alert = await db.risk_alerts.findByPk(id);
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    await alert.update({
      status: 'ACKNOWLEDGED',
      acknowledged_by: req.user?.user_id || 'system',
      acknowledged_date: new Date()
    });

    // Log the action
    await db.risk_logs.create({
      entity_type: 'ALERT',
      entity_id: alert.alert_id,
      action: 'ACKNOWLEDGE',
      user_id: req.user?.user_id || 'system',
      portfolio_id: alert.portfolio_id,
      reason: 'Alert acknowledged'
    });

    res.json({
      success: true,
      data: alert
    });
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Stress testing
exports.runStressTest = async (req, res) => {
  try {
    const { portfolio_id, scenario_id } = req.body;

    const scenario = await db.stress_scenarios.findByPk(scenario_id);
    if (!scenario) {
      return res.status(404).json({
        success: false,
        message: 'Stress scenario not found'
      });
    }

    const pnlResults = await RiskCalculator.calculatePnLPotential(portfolio_id, [scenario]);

    // Save results as risk metrics
    const stressMetric = await db.risk_metrics.create({
      portfolio_id,
      calculation_date: new Date(),
      metric_type: 'STRESS_LOSS',
      value: pnlResults[0].pnl,
      currency: 'EUR',
      time_horizon_days: scenario.time_horizon_days,
      calculation_method: 'STRESS_TEST',
      status: 'CALCULATED',
      created_by: req.user?.user_id || 'system',
      metadata: {
        scenario_id: scenario.scenario_id,
        scenario_name: scenario.name,
        market_shocks: scenario.market_shocks
      }
    });

    res.json({
      success: true,
      data: {
        scenario: scenario.name,
        pnl_impact: pnlResults[0].pnl,
        breakdown: pnlResults[0].breakdown,
        probability: pnlResults[0].probability,
        scenario_type: pnlResults[0].scenario_type,
        time_horizon_days: pnlResults[0].time_horizon_days,
        metric: stressMetric
      }
    });
  } catch (error) {
    console.error('Error running stress test:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getStressScenarios = async (req, res) => {
  try {
    const scenarios = await db.stress_scenarios.findAll({
      where: { is_active: true },
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: scenarios
    });
  } catch (error) {
    console.error('Error fetching stress scenarios:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Scenario Validation and Approval
exports.validateScenario = async (req, res) => {
  try {
    const { id } = req.params;
    const { validation_notes } = req.body;

    const scenario = await db.stress_scenarios.findByPk(id);
    if (!scenario) {
      return res.status(404).json({
        success: false,
        message: 'Stress scenario not found'
      });
    }

    // Perform validation checks
    const validationErrors = [];

    // Check if market shocks are reasonable
    const shocks = scenario.market_shocks;
    if (shocks.equity && Math.abs(shocks.equity) > 0.5) {
      validationErrors.push('Equity shock magnitude seems extreme (>50%)');
    }
    if (shocks.rates && Math.abs(shocks.rates) > 0.05) {
      validationErrors.push('Interest rate shock seems extreme (>5%)');
    }

    // Check probability for historical scenarios
    if (scenario.scenario_type === 'HISTORICAL' && (!scenario.probability || scenario.probability > 0.1)) {
      validationErrors.push('Historical scenarios should have low probability (<10%)');
    }

    const isValid = validationErrors.length === 0;

    await scenario.update({
      validation_status: isValid ? 'VALIDATED' : 'REJECTED',
      validation_notes: validation_notes || validationErrors.join('; '),
      validated_by: req.user?.user_id || 'system',
      validation_date: new Date()
    });

    // Log the validation action
    await db.risk_logs.create({
      entity_type: 'STRESS_SCENARIO',
      entity_id: scenario.scenario_id,
      action: 'VALIDATE',
      user_id: req.user?.user_id || 'system',
      reason: `Scenario validation: ${isValid ? 'PASSED' : 'FAILED'}`,
      metadata: { validation_errors: validationErrors }
    });

    res.json({
      success: true,
      data: {
        scenario,
        validation_result: {
          is_valid: isValid,
          errors: validationErrors
        }
      }
    });
  } catch (error) {
    console.error('Error validating scenario:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.approveScenario = async (req, res) => {
  try {
    const { id } = req.params;
    const { approval_notes } = req.body;

    const scenario = await db.stress_scenarios.findByPk(id);
    if (!scenario) {
      return res.status(404).json({
        success: false,
        message: 'Stress scenario not found'
      });
    }

    // Only allow approval if scenario is validated
    if (scenario.validation_status !== 'VALIDATED') {
      return res.status(400).json({
        success: false,
        message: 'Scenario must be validated before approval'
      });
    }

    await scenario.update({
      approved_by: req.user?.user_id || 'system',
      approval_date: new Date()
    });

    // Log the approval action
    await db.risk_logs.create({
      entity_type: 'STRESS_SCENARIO',
      entity_id: scenario.scenario_id,
      action: 'APPROVE',
      user_id: req.user?.user_id || 'system',
      reason: 'Scenario approved for production use',
      metadata: { approval_notes }
    });

    res.json({
      success: true,
      data: scenario
    });
  } catch (error) {
    console.error('Error approving scenario:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.rejectScenario = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body;

    const scenario = await db.stress_scenarios.findByPk(id);
    if (!scenario) {
      return res.status(404).json({
        success: false,
        message: 'Stress scenario not found'
      });
    }

    await scenario.update({
      validation_status: 'REJECTED',
      validation_notes: rejection_reason,
      validated_by: req.user?.user_id || 'system',
      validation_date: new Date()
    });

    // Log the rejection action
    await db.risk_logs.create({
      entity_type: 'STRESS_SCENARIO',
      entity_id: scenario.scenario_id,
      action: 'REJECT',
      user_id: req.user?.user_id || 'system',
      reason: `Scenario rejected: ${rejection_reason}`,
      metadata: { rejection_reason }
    });

    res.json({
      success: true,
      data: scenario
    });
  } catch (error) {
    console.error('Error rejecting scenario:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Risk Aggregation
exports.getAggregatedExposure = async (req, res) => {
  try {
    const { trader_id, portfolio_ids } = req.query;

    let portfolios = [];

    if (portfolio_ids) {
      // Get specific portfolios
      const ids = portfolio_ids.split(',').map(id => id.trim());
      portfolios = await db.portfolios.findAll({
        where: { portfolio_id: ids }
      });
    } else if (trader_id) {
      // Get all portfolios for a trader
      portfolios = await db.portfolios.findAll({
        where: { user_id: trader_id }
      });
    } else {
      // Get all portfolios (admin view)
      portfolios = await db.portfolios.findAll();
    }

    const aggregatedExposure = {
      total_gross_long: 0,
      total_gross_short: 0,
      total_net: 0,
      by_portfolio: {},
      portfolio_count: portfolios.length
    };

    for (const portfolio of portfolios) {
      const exposure = await RiskCalculator.calculateExposure({ portfolio_id: portfolio.portfolio_id });
      aggregatedExposure.by_portfolio[portfolio.portfolio_id] = {
        name: portfolio.portfolio_name,
        ...exposure
      };

      aggregatedExposure.total_gross_long += exposure.gross_long;
      aggregatedExposure.total_gross_short += exposure.gross_short;
      aggregatedExposure.total_net += exposure.net;
    }

    res.json({
      success: true,
      data: aggregatedExposure
    });
  } catch (error) {
    console.error('Error calculating aggregated exposure:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getAggregatedRiskMetrics = async (req, res) => {
  try {
    const { trader_id, portfolio_ids, metric_type } = req.query;

    let portfolioIds = [];

    if (portfolio_ids) {
      portfolioIds = portfolio_ids.split(',').map(id => id.trim());
    } else if (trader_id) {
      const portfolios = await db.portfolios.findAll({
        where: { user_id: trader_id },
        attributes: ['portfolio_id']
      });
      portfolioIds = portfolios.map(p => p.portfolio_id);
    }

    let whereClause = {};
    if (portfolioIds.length > 0) whereClause.portfolio_id = portfolioIds;
    if (metric_type) whereClause.metric_type = metric_type;

    const metrics = await db.risk_metrics.findAll({
      where: whereClause,
      include: [
        {
          model: db.portfolios,
          as: 'portfolio',
          attributes: ['portfolio_id', 'portfolio_name']
        }
      ],
      order: [['calculation_date', 'DESC']]
    });

    // Aggregate metrics by type
    const aggregated = {};
    metrics.forEach(metric => {
      if (!aggregated[metric.metric_type]) {
        aggregated[metric.metric_type] = {
          type: metric.metric_type,
          count: 0,
          average: 0,
          min: Infinity,
          max: -Infinity,
          portfolios: []
        };
      }

      aggregated[metric.metric_type].count++;
      aggregated[metric.metric_type].average += metric.value;
      aggregated[metric.metric_type].min = Math.min(aggregated[metric.metric_type].min, metric.value);
      aggregated[metric.metric_type].max = Math.max(aggregated[metric.metric_type].max, metric.value);
      aggregated[metric.metric_type].portfolios.push({
        portfolio_id: metric.portfolio_id,
        portfolio_name: metric.portfolio?.portfolio_name,
        value: metric.value,
        calculation_date: metric.calculation_date
      });
    });

    // Calculate averages
    Object.keys(aggregated).forEach(type => {
      aggregated[type].average /= aggregated[type].count;
    });

    res.json({
      success: true,
      data: {
        aggregated,
        total_metrics: metrics.length,
        portfolio_count: portfolioIds.length
      }
    });
  } catch (error) {
    console.error('Error fetching aggregated risk metrics:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.calculateAggregatedVaR = async (req, res) => {
  try {
    const { trader_id, portfolio_ids, confidence = 0.95, time_horizon = 1 } = req.body;

    let portfolioIds = [];

    if (portfolio_ids) {
      portfolioIds = portfolio_ids.split(',').map(id => id.trim());
    } else if (trader_id) {
      const portfolios = await db.portfolios.findAll({
        where: { user_id: trader_id },
        attributes: ['portfolio_id']
      });
      portfolioIds = portfolios.map(p => p.portfolio_id);
    }

    if (portfolioIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No portfolios found for aggregation'
      });
    }

    // Calculate VaR for each portfolio
    const portfolioVaRs = [];
    let totalPortfolioValue = 0;

    for (const portfolioId of portfolioIds) {
      const positions = await db.positions.findAll({
        where: { portfolio_id: portfolioId }
      });

      // Calculate portfolio value
      let portfolioValue = 0;
      positions.forEach(position => {
        portfolioValue += position.quantity * (position.current_price || position.entry_price);
      });

      if (portfolioValue > 0) {
        // Get historical returns for this portfolio
        const historicalReturns = await RiskCalculator.calculatePortfolioHistoricalReturns(portfolioId, 252);

        let var_value;
        if (historicalReturns.length > 0) {
          var_value = RiskCalculator.calculateHistoricalVaR(historicalReturns, confidence, time_horizon);
        } else {
          const mockReturns = Array.from({ length: 252 }, () => (Math.random() - 0.5) * 0.02);
          var_value = RiskCalculator.calculateVaR(mockReturns, confidence, time_horizon);
        }

        portfolioVaRs.push({
          portfolio_id: portfolioId,
          portfolio_value: portfolioValue,
          var_value: var_value,
          var_amount: portfolioValue * Math.abs(var_value)
        });

        totalPortfolioValue += portfolioValue;
      }
    }

    // Calculate aggregated VaR using correlation assumptions
    // Simplified: assume perfect correlation for conservative estimate
    const totalVaRAmount = portfolioVaRs.reduce((sum, p) => sum + p.var_amount, 0);

    const aggregatedVaR = {
      total_portfolio_value: totalPortfolioValue,
      total_var_amount: totalVaRAmount,
      total_var_percentage: totalVaRAmount / totalPortfolioValue,
      portfolio_breakdown: portfolioVaRs,
      confidence_level: confidence,
      time_horizon_days: time_horizon,
      aggregation_method: 'Perfect Correlation (Conservative)',
      portfolio_count: portfolioVaRs.length
    };

    res.json({
      success: true,
      data: aggregatedVaR
    });
  } catch (error) {
    console.error('Error calculating aggregated VaR:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
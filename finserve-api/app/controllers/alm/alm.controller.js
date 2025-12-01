const db = require('../../models');
const AlmCalculations = require('./alm-calculations');

console.log('DB models loaded:', Object.keys(db));
const YieldCurve = db.yield_curves;
console.log('YieldCurve model:', YieldCurve);
const CashflowProjection = db.cashflow_projections;
const AlmPosition = db.alm_positions;
const LiquidityGap = db.liquidity_gaps;
const InterestRateSensitivity = db.interest_rate_sensitivities;
const Portfolio = db.portfolios;
const Position = db.positions;

// Generate realistic yield curve based on currency and type
function generateRealisticYieldCurve(currency, curveType) {
  const baseRates = {
    EUR: {
      GOVERNMENT: 3.5,
      CORPORATE: 4.2
    },
    USD: {
      GOVERNMENT: 4.8,
      CORPORATE: 5.5
    },
    GBP: {
      GOVERNMENT: 4.0,
      CORPORATE: 4.8
    }
  };

  const baseRate = baseRates[currency]?.[curveType] || 4.0;

  // Standard maturities for yield curves
  const maturities = [0.25, 0.5, 1, 2, 3, 5, 7, 10, 15, 20, 30];

  return maturities.map(maturity => {
    let rate;

    if (maturity <= 1) {
      // Short term: lower rates
      rate = baseRate - 0.3 + (maturity * 0.1);
    } else if (maturity <= 5) {
      // Medium term: base rates
      rate = baseRate + (maturity - 2) * 0.05;
    } else {
      // Long term: slightly higher rates
      rate = baseRate + 0.3 + ((maturity - 5) * 0.02);
    }

    // Add some realistic variation
    const variation = (Math.random() - 0.5) * 0.1; // ±0.05%
    rate += variation;

    return {
      maturity: maturity,
      rate: Math.round(rate * 100) / 100 // Round to 2 decimal places
    };
  });
}

// Helper function to generate cashflows for different asset types
function generateCashflowsForPosition(position) {
  const cashflows = [];
  const startDate = new Date();

  switch (position.asset_type) {
    case 'STOCK':
      // Generate quarterly dividend payments for 5 years
      for (let quarter = 1; quarter <= 20; quarter++) { // 5 years * 4 quarters
        const dividendDate = new Date(startDate);
        dividendDate.setMonth(startDate.getMonth() + (quarter * 3));

        // Assume 2% annual dividend yield
        const annualDividend = position.market_value * 0.02;
        const quarterlyDividend = annualDividend / 4;

        cashflows.push({
          date: dividendDate.toISOString(),
          amount: quarterlyDividend,
          type: 'DIVIDEND'
        });
      }
      break;

    case 'BOND':
      // Generate semi-annual coupon payments and final principal repayment
      const faceValue = position.market_value; // Assume current price = face value
      const couponRate = 0.04; // 4% annual coupon
      const maturityYears = 5; // Assume 5-year bond

      // Semi-annual coupons
      for (let period = 1; period <= maturityYears * 2; period++) {
        const couponDate = new Date(startDate);
        couponDate.setMonth(startDate.getMonth() + (period * 6));

        const couponPayment = faceValue * couponRate / 2;
        cashflows.push({
          date: couponDate.toISOString(),
          amount: couponPayment,
          type: 'COUPON'
        });
      }

      // Final principal repayment
      const maturityDate = new Date(startDate);
      maturityDate.setFullYear(startDate.getFullYear() + maturityYears);
      cashflows.push({
        date: maturityDate.toISOString(),
        amount: faceValue,
        type: 'PRINCIPAL'
      });
      break;

    case 'ETF':
      // Similar to stocks but with potentially different dividend patterns
      for (let quarter = 1; quarter <= 20; quarter++) {
        const dividendDate = new Date(startDate);
        dividendDate.setMonth(startDate.getMonth() + (quarter * 3));

        // Assume 1.5% annual dividend yield for ETFs
        const annualDividend = position.market_value * 0.015;
        const quarterlyDividend = annualDividend / 4;

        cashflows.push({
          date: dividendDate.toISOString(),
          amount: quarterlyDividend,
          type: 'DIVIDEND'
        });
      }
      break;

    case 'CASH':
    case 'LIQUIDITY':
      // No cashflows for cash positions - they just hold value
      break;

    case 'CRYPTO':
      // No regular cashflows for crypto
      break;

    default:
      // For unknown asset types, assume small quarterly distributions
      for (let quarter = 1; quarter <= 20; quarter++) {
        const distributionDate = new Date(startDate);
        distributionDate.setMonth(startDate.getMonth() + (quarter * 3));

        const quarterlyDistribution = position.market_value * 0.005; // 0.5% quarterly

        cashflows.push({
          date: distributionDate.toISOString(),
          amount: quarterlyDistribution,
          type: 'DISTRIBUTION'
        });
      }
      break;
  }

  return cashflows;
}

// Gestion des courbes des taux
exports.createYieldCurve = async (req, res) => {
  try {
    console.log('=== CREATE YIELD CURVE START ===');
    console.log('Request body:', req.body);
    const { curve_name, currency, curve_type, maturity_points, interpolation_method, created_by } = req.body;

    if (!curve_name || !maturity_points) {
      console.log('Missing required fields:', { curve_name: !!curve_name, maturity_points: !!maturity_points, created_by: !!created_by });
      return res.status(400).json({ message: 'curve_name and maturity_points are required' });
    }

    // Validate maturity_points format
    if (!Array.isArray(maturity_points) || maturity_points.length === 0) {
      console.log('Invalid maturity_points format:', maturity_points);
      return res.status(400).json({ message: 'maturity_points must be a non-empty array' });
    }

    // Validate each maturity point
    for (const point of maturity_points) {
      if (typeof point.maturity !== 'number' || typeof point.rate !== 'number') {
        console.log('Invalid maturity point:', point);
        return res.status(400).json({ message: 'Each maturity point must have numeric maturity and rate' });
      }
    }

    // Validate that created_by is a valid UUID and user exists (optional for now)
    if (created_by) {
      const user = await db.users.findByPk(created_by);
      if (!user) {
        console.log('User not found for created_by:', created_by);
        return res.status(400).json({ message: 'Invalid user ID' });
      }
    }

    console.log('Creating yield curve with data:', { curve_name, currency, curve_type, maturity_points_length: maturity_points?.length, interpolation_method, created_by });

    const yieldCurve = await YieldCurve.create({
      curve_name,
      currency: currency || 'EUR',
      curve_type: curve_type || 'GOVERNMENT',
      maturity_points,
      interpolation_method: interpolation_method || 'LINEAR',
      created_by
    });

    console.log('Yield curve created successfully:', yieldCurve.yield_curve_id);
    res.status(201).json(yieldCurve);
  } catch (error) {
    console.error('Error creating yield curve:', error);
    // Check if it's a foreign key constraint error
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ message: 'Invalid user ID - user does not exist' });
    }
    res.status(500).json({ message: error.message });
  }
};

exports.getYieldCurves = async (req, res) => {
  try {
    console.log('=== GET YIELD CURVES START ===');
    console.log('Request received, checking database connection...');

    // Check if database is connected
    await db.sequelize.authenticate();
    console.log('Database connection OK');

    const { currency, curve_type } = req.query;
    console.log('Query params:', { currency, curve_type });

    const where = { is_active: true };
    if (currency) where.currency = currency;
    if (curve_type) where.curve_type = curve_type;

    console.log('Where clause:', where);
    console.log('YieldCurve model available:', !!YieldCurve);

    const curves = await YieldCurve.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });
    console.log('Found curves count:', curves ? curves.length : 'null');

    console.log('=== GET YIELD CURVES END ===');
    res.json(curves || []);
  } catch (error) {
    console.error('Error in getYieldCurves:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: error.message, stack: error.stack });
  }
};

exports.getYieldCurveById = async (req, res) => {
  try {
    console.log('=== GET YIELD CURVE BY ID START ===');
    const { id } = req.params;
    console.log('Curve ID:', id);

    const curve = await YieldCurve.findByPk(id);

    if (!curve) {
      return res.status(404).json({ message: 'Courbe des taux non trouvée' });
    }

    console.log('Found curve:', curve.curve_name);
    console.log('=== GET YIELD CURVE BY ID END ===');
    res.json(curve);
  } catch (error) {
    console.error('Error in getYieldCurveById:', error);
    res.status(500).json({ message: error.message });
  }
};

// Generate automatic yield curves
exports.generateYieldCurve = async (req, res) => {
  try {
    console.log('=== GENERATE YIELD CURVE START ===');
    const { currency = 'EUR', curve_type = 'GOVERNMENT' } = req.body;

    // Generate realistic yield curve based on currency and type
    const maturityPoints = generateRealisticYieldCurve(currency, curve_type);

    const curveName = `${currency} ${curve_type === 'GOVERNMENT' ? 'Government' : 'Corporate'} Curve ${new Date().getFullYear()}`;

    // Check if curve already exists
    const existingCurve = await YieldCurve.findOne({
      where: {
        curve_name: curveName,
        currency: currency,
        curve_type: curve_type
      }
    });

    if (existingCurve) {
      console.log('Curve already exists, updating...');
      await existingCurve.update({
        maturity_points: maturityPoints,
        valuation_date: new Date()
      });
      console.log('=== GENERATE YIELD CURVE END ===');
      return res.json(existingCurve);
    }

    // Create new curve
    const yieldCurve = await YieldCurve.create({
      curve_name: curveName,
      currency: currency,
      curve_type: curve_type,
      maturity_points: maturityPoints,
      interpolation_method: 'LINEAR',
      created_by: req.body.created_by
    });

    console.log('Generated yield curve:', yieldCurve.curve_name);
    console.log('=== GENERATE YIELD CURVE END ===');
    res.status(201).json(yieldCurve);
  } catch (error) {
    console.error('Error generating yield curve:', error);
    res.status(500).json({ message: error.message });
  }
};

// Projection de cashflows
exports.projectCashflows = async (req, res) => {
  try {
    console.log('=== PROJECT CASHFLOWS START ===');
    const { portfolio_id, frequency, horizon_years, created_by } = req.body;
    console.log('Request body:', { portfolio_id, frequency, horizon_years, created_by });

    // Récupérer les positions du portefeuille
    const portfolio = await Portfolio.findByPk(portfolio_id, {
      include: [{
        model: Position,
        as: 'positions',
        where: { is_archived: false },
        required: false
      }]
    });

    if (!portfolio) {
      console.log('Portfolio not found');
      return res.status(404).json({ message: 'Portefeuille non trouvé' });
    }

    console.log('Portfolio found:', portfolio.portfolio_name);
    console.log('Positions count:', portfolio.positions ? portfolio.positions.length : 0);

    // Convertir les positions en positions ALM avec génération de cashflows
    const almPositions = portfolio.positions.map(pos => {
      const cashflows = generateCashflowsForPosition(pos);
      const positionData = {
        position_id: pos.position_id,
        asset_liability: 'ASSET', // Par défaut, toutes les positions sont des actifs
        nominal_amount: pos.market_value,
        currency: pos.currency,
        maturity_date: pos.maturity_date || null,
        cashflows: cashflows,
        market_value: pos.market_value,
        asset_type: pos.asset_type,
        quantity: pos.quantity,
        average_price: pos.average_price,
        current_price: pos.current_price
      };

      // Add maturity date and YTM for bonds
      if (pos.asset_type === 'BOND') {
        const maturityDate = new Date();
        maturityDate.setFullYear(maturityDate.getFullYear() + 5); // 5-year bond
        positionData.maturity_date = maturityDate.toISOString();
        positionData.yield_to_maturity = 0.04; // 4% YTM
      }

      return positionData;
    });

    console.log('ALM positions:', almPositions.length);

    // Calculer les projections
    const projections = AlmCalculations.projectCashflows(
      almPositions,
      horizon_years || 5,
      frequency || 'MONTHLY'
    );

    console.log('Projections calculated:', {
      assetsLength: projections.assets.length,
      liabilitiesLength: projections.liabilities.length,
      sampleAssets: projections.assets.slice(0, 5),
      sampleLiabilities: projections.liabilities.slice(0, 5)
    });

    // Calculer les totaux sur toute la période
    const totalAssets = projections.assets.reduce((sum, val) => sum + val, 0);
    const totalLiabilities = projections.liabilities.reduce((sum, val) => sum + val, 0);
    const netCashflow = totalAssets - totalLiabilities;

    console.log('Totals calculated:', { totalAssets, totalLiabilities, netCashflow });

    // Use provided created_by or default to admin user
    let finalCreatedBy = created_by;
    if (!finalCreatedBy) {
      const adminUser = await db.users.findOne({ where: { email: 'admin@example.com' } });
      if (adminUser) {
        finalCreatedBy = adminUser.user_id;
      }
    }

    // Sauvegarder en base
    console.log('Creating cashflow projection...');
    const cashflowProjection = await CashflowProjection.create({
      portfolio_id,
      projection_date: new Date(),
      frequency,
      horizon_years,
      cashflows: projections,
      total_assets: totalAssets,
      total_liabilities: totalLiabilities,
      net_cashflow: netCashflow,
      currency: portfolio.base_currency,
      created_by: finalCreatedBy
    });

    console.log('Cashflow projection created successfully');
    console.log('=== PROJECT CASHFLOWS END ===');

    res.json({
      projection: cashflowProjection,
      details: projections
    });
  } catch (error) {
    console.error('Error in projectCashflows:', error);
    res.status(500).json({ message: error.message });
  }
};

// Valorisation PV
exports.calculatePV = async (req, res) => {
  try {
    const { portfolio_id, yield_curve_id } = req.body;

    // Récupérer la courbe des taux
    const yieldCurve = await YieldCurve.findByPk(yield_curve_id);
    if (!yieldCurve) {
      return res.status(404).json({ message: 'Courbe des taux non trouvée' });
    }

    // Récupérer les positions ALM
    const almPositions = await AlmPosition.findAll({
      where: { portfolio_id, is_active: true }
    });

    let totalPV = 0;
    const positionPVs = [];

    for (const position of almPositions) {
      const cashflows = position.cashflows || [];
      let positionPV = 0;

      cashflows.forEach(cashflow => {
        const cashflowDate = new Date(cashflow.date);
        const valuationDate = new Date();
        const timeToMaturity = (cashflowDate - valuationDate) / (365.25 * 24 * 60 * 60 * 1000);

        positionPV += AlmCalculations.presentValue(cashflow.amount, timeToMaturity, yieldCurve.maturity_points);
      });

      positionPVs.push({
        position_id: position.alm_position_id,
        market_value: position.market_value,
        present_value: positionPV,
        difference: positionPV - position.market_value
      });

      totalPV += positionPV;
    }

    res.json({
      portfolio_id,
      total_present_value: totalPV,
      positions: positionPVs,
      yield_curve: yieldCurve.curve_name
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Duration et Convexité
exports.calculateDurationConvexity = async (req, res) => {
  try {
    const { portfolio_id, yield_curve_id } = req.body;

    const yieldCurve = await YieldCurve.findByPk(yield_curve_id);
    if (!yieldCurve) {
      return res.status(404).json({ message: 'Courbe des taux non trouvée' });
    }

    // Use portfolio positions instead of ALM positions for calculations
    const portfolio = await Portfolio.findByPk(portfolio_id, {
      include: [{
        model: Position,
        as: 'positions',
        where: { is_archived: false },
        required: false
      }]
    });

    if (!portfolio || !portfolio.positions) {
      return res.status(404).json({ message: 'Portfolio or positions not found' });
    }

    // Convert positions to ALM format
    const almPositions = portfolio.positions.map(pos => {
      const cashflows = generateCashflowsForPosition(pos);
      const positionData = {
        position_id: pos.position_id,
        asset_liability: 'ASSET',
        nominal_amount: pos.market_value,
        currency: pos.currency,
        maturity_date: pos.maturity_date || null,
        cashflows: cashflows,
        market_value: pos.market_value,
        asset_type: pos.asset_type,
        quantity: pos.quantity,
        average_price: pos.average_price,
        current_price: pos.current_price
      };

      if (pos.asset_type === 'BOND') {
        const maturityDate = new Date();
        maturityDate.setFullYear(maturityDate.getFullYear() + 5);
        positionData.maturity_date = maturityDate.toISOString();
        positionData.yield_to_maturity = 0.04;
      }

      return positionData;
    });

    const results = [];

    for (const position of almPositions) {
      let macaulayDuration, convexity, modifiedDuration, dv01;

      if (position.cashflows && position.cashflows.length > 0) {
        // Fixed income instruments with defined cashflows
        macaulayDuration = AlmCalculations.macaulayDuration(position.cashflows, yieldCurve.maturity_points);
        convexity = AlmCalculations.convexity(position.cashflows, yieldCurve.maturity_points);
        modifiedDuration = AlmCalculations.modifiedDuration(macaulayDuration, position.yield_to_maturity || 0.04);
        dv01 = AlmCalculations.dv01(modifiedDuration, position.market_value);
      } else if (position.asset_type === 'STOCK' || position.asset_type === 'ETF') {
        // Equity instruments - use simplified duration
        macaulayDuration = 2.5; // Typical equity duration
        convexity = 10.0; // Typical equity convexity
        modifiedDuration = macaulayDuration / (1 + 0.04); // Assume 4% discount rate
        dv01 = AlmCalculations.dv01(modifiedDuration, position.market_value);
      } else {
        // Other assets - minimal duration
        macaulayDuration = 0.1;
        convexity = 0.01;
        modifiedDuration = macaulayDuration / (1 + 0.04);
        dv01 = AlmCalculations.dv01(modifiedDuration, position.market_value);
      }

      results.push({
        position_id: position.position_id,
        asset_symbol: position.asset_symbol || `Position ${position.position_id}`,
        asset_type: position.asset_type,
        macaulay_duration: macaulayDuration,
        modified_duration: modifiedDuration,
        convexity: convexity,
        dv01: dv01
      });
    }

    res.json({
      portfolio_id,
      positions: results
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Gap de liquidité
exports.calculateLiquidityGap = async (req, res) => {
  try {
    const { portfolio_id, created_by } = req.body;

    // Get portfolio with positions
    const portfolio = await Portfolio.findByPk(portfolio_id, {
      include: [{
        model: Position,
        as: 'positions',
        where: { is_archived: false },
        required: false
      }]
    });

    if (!portfolio || !portfolio.positions) {
      return res.status(404).json({ message: 'Portfolio or positions not found' });
    }

    // Convert positions to ALM format
    const almPositions = portfolio.positions.map(pos => {
      const positionData = {
        position_id: pos.position_id,
        asset_liability: 'ASSET',
        nominal_amount: pos.market_value,
        currency: pos.currency,
        maturity_date: pos.maturity_date || null,
        market_value: pos.market_value,
        asset_type: pos.asset_type,
        quantity: pos.quantity,
        average_price: pos.average_price,
        current_price: pos.current_price
      };

      if (pos.asset_type === 'BOND') {
        const maturityDate = new Date();
        maturityDate.setFullYear(maturityDate.getFullYear() + 5);
        positionData.maturity_date = maturityDate.toISOString();
      }

      return positionData;
    });

    const gapResult = AlmCalculations.calculateLiquidityGap(almPositions);

    // Use provided created_by or default to admin user
    let finalCreatedBy = created_by;
    if (!finalCreatedBy) {
      const adminUser = await db.users.findOne({ where: { email: 'admin@example.com' } });
      if (adminUser) {
        finalCreatedBy = adminUser.user_id;
      }
    }

    // Sauvegarder en base
    const liquidityGap = await LiquidityGap.create({
      portfolio_id,
      calculation_date: new Date(),
      bucket_0_1m: gapResult.gaps['0-1m'],
      bucket_1_3m: gapResult.gaps['1-3m'],
      bucket_3_12m: gapResult.gaps['3-12m'],
      bucket_1_3y: gapResult.gaps['1-3y'],
      bucket_3_5y: gapResult.gaps['3-5y'],
      bucket_5y_plus: gapResult.gaps['5y+'],
      total_gap: gapResult.total_gap,
      currency: almPositions[0]?.currency || 'EUR',
      created_by: finalCreatedBy
    });

    res.json({
      liquidity_gap: liquidityGap,
      details: gapResult
    });
  } catch (error) {
    console.error('Error in calculateLiquidityGap:', error);
    res.status(500).json({ message: error.message });
  }
};

// Sensibilités taux
exports.calculateInterestRateSensitivity = async (req, res) => {
  try {
    const { portfolio_id, yield_curve_id, scenarios, created_by } = req.body;

    const yieldCurve = await YieldCurve.findByPk(yield_curve_id);
    if (!yieldCurve) {
      return res.status(404).json({ message: 'Courbe des taux non trouvée' });
    }

    // Get portfolio with positions
    const portfolio = await Portfolio.findByPk(portfolio_id, {
      include: [{
        model: Position,
        as: 'positions',
        where: { is_archived: false },
        required: false
      }]
    });

    if (!portfolio || !portfolio.positions) {
      return res.status(404).json({ message: 'Portfolio or positions not found' });
    }

    // Convert positions to ALM format
    const almPositions = portfolio.positions.map(pos => {
      const cashflows = generateCashflowsForPosition(pos);
      const positionData = {
        position_id: pos.position_id,
        asset_liability: 'ASSET',
        nominal_amount: pos.market_value,
        currency: pos.currency,
        maturity_date: pos.maturity_date || null,
        cashflows: cashflows,
        market_value: pos.market_value,
        asset_type: pos.asset_type,
        quantity: pos.quantity,
        average_price: pos.average_price,
        current_price: pos.current_price
      };

      if (pos.asset_type === 'BOND') {
        const maturityDate = new Date();
        maturityDate.setFullYear(maturityDate.getFullYear() + 5);
        positionData.maturity_date = maturityDate.toISOString();
        positionData.yield_to_maturity = 0.04;
      }

      return positionData;
    });

    const results = [];

    for (const scenario of scenarios) {
      const sensitivity = AlmCalculations.calculateInterestRateSensitivity(
        almPositions,
        yieldCurve.maturity_points,
        scenario.shock_bps,
        scenario.scenario_type
      );

      // Sauvegarder en base
      const sensitivityRecord = await InterestRateSensitivity.create({
        portfolio_id,
        calculation_date: new Date(),
        scenario_type: scenario.scenario_type,
        shock_bps: scenario.shock_bps,
        assets_pv_change: sensitivity.assets_pv_change,
        liabilities_pv_change: sensitivity.liabilities_pv_change,
        net_pv_change: sensitivity.net_pv_change,
        assets_duration: sensitivity.assets_duration,
        liabilities_duration: sensitivity.liabilities_duration,
        duration_gap: sensitivity.duration_gap,
        currency: yieldCurve.currency,
        yield_curve_id,
        created_by
      });

      results.push({
        sensitivity: sensitivityRecord,
        details: sensitivity
      });
    }

    res.json({
      portfolio_id,
      sensitivities: results
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Ratios de liquidité
exports.calculateLiquidityRatios = async (req, res) => {
  try {
    const { portfolio_id } = req.params;

    // Récupérer le dernier gap de liquidité
    const liquidityGap = await LiquidityGap.findOne({
      where: { portfolio_id },
      order: [['calculation_date', 'DESC']]
    });

    if (!liquidityGap) {
      return res.status(404).json({ message: 'Aucun gap de liquidité trouvé pour ce portefeuille' });
    }

    const ratios = AlmCalculations.calculateLiquidityRatios({
      buckets: {
        '0-1m': { assets: 0, liabilities: 0 }, // À compléter avec les vraies données
        '1-3m': { assets: 0, liabilities: 0 }
      },
      gaps: {
        '0-1m': liquidityGap.bucket_0_1m,
        '1-3m': liquidityGap.bucket_1_3m
      }
    });

    res.json({
      portfolio_id,
      liquidity_ratios: ratios,
      liquidity_gap_date: liquidityGap.calculation_date
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Duration gap
exports.calculateDurationGap = async (req, res) => {
  try {
    const { portfolio_id } = req.params;

    const almPositions = await AlmPosition.findAll({
      where: { portfolio_id, is_active: true }
    });

    let assetsDuration = 0;
    let liabilitiesDuration = 0;

    almPositions.forEach(position => {
      const duration = position.modified_duration || 0;
      const marketValue = position.market_value || 0;

      if (position.asset_liability === 'ASSET') {
        assetsDuration += duration * marketValue;
      } else {
        liabilitiesDuration += duration * marketValue;
      }
    });

    const durationGap = assetsDuration - liabilitiesDuration;

    res.json({
      portfolio_id,
      assets_duration: assetsDuration,
      liabilities_duration: liabilitiesDuration,
      duration_gap: durationGap
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
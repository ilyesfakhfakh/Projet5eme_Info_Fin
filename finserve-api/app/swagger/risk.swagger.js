/**
 * @swagger
 * components:
 *   schemas:
 *     RiskAssessment:
 *       type: object
 *       properties:
 *         assessment_id:
 *           type: string
 *           format: uuid
 *         portfolio_id:
 *           type: string
 *           format: uuid
 *         risk_score:
 *           type: number
 *           format: float
 *         volatility:
 *           type: number
 *           format: float
 *         max_drawdown:
 *           type: number
 *           format: float
 *         sharpe_ratio:
 *           type: number
 *           format: float
 *         value_at_risk:
 *           type: number
 *           format: float
 *         recommendations:
 *           type: string
 *         assessment_date:
 *           type: string
 *           format: date-time
 *
 *     RiskAlert:
 *       type: object
 *       properties:
 *         alert_id:
 *           type: string
 *           format: uuid
 *         portfolio_id:
 *           type: string
 *           format: uuid
 *         alert_type:
 *           type: string
 *           enum: [VAR_EXCEEDED, VOLATILITY_SPIKE, DRAWDOWN_LIMIT, SHARPE_RATIO_LOW]
 *         threshold_value:
 *           type: number
 *           format: float
 *         current_value:
 *           type: number
 *           format: float
 *         message:
 *           type: string
 *         is_read:
 *           type: boolean
 *         alert_date:
 *           type: string
 *           format: date-time
 *
 *     RiskLimit:
 *       type: object
 *       properties:
 *         limit_id:
 *           type: string
 *           format: uuid
 *         portfolio_id:
 *           type: string
 *           format: uuid
 *         limit_type:
 *           type: string
 *           enum: [DAILY_LOSS, POSITION_SIZE, CONCENTRATION, VAR_LIMIT, VOLATILITY_LIMIT, DRAWDOWN_LIMIT]
 *         threshold:
 *           type: number
 *           format: float
 *         current_value:
 *           type: number
 *           format: float
 *         is_active:
 *           type: boolean
 *         alert_triggered:
 *           type: boolean
 */

/**
 * @swagger
 * /api/risk/portfolios/{portfolio_id}/assessment:
 *   post:
 *     summary: Calculate risk assessment for a portfolio
 *     tags: [Risk Management]
 *     parameters:
 *       - in: path
 *         name: portfolio_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               returns:
 *                 type: array
 *                 items:
 *                   type: number
 *               portfolio_values:
 *                 type: array
 *                 items:
 *                   type: number
 *               risk_free_rate:
 *                 type: number
 *                 default: 0.02
 *     responses:
 *       201:
 *         description: Risk assessment calculated successfully
 *       400:
 *         description: Missing required parameters
 */

/**
 * @swagger
 * /api/risk/portfolios/{portfolio_id}/dashboard:
 *   get:
 *     summary: Get comprehensive risk dashboard
 *     tags: [Risk Management]
 *     parameters:
 *       - in: path
 *         name: portfolio_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           default: "30"
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 */

/**
 * @swagger
 * /api/risk/portfolios/{portfolio_id}/alerts:
 *   get:
 *     summary: Get risk alerts for a portfolio
 *     tags: [Risk Management]
 *     parameters:
 *       - in: path
 *         name: portfolio_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: is_read
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Alerts retrieved successfully
 */

/**
 * @swagger
 * /api/risk/portfolios/{portfolio_id}/limits:
 *   get:
 *     summary: Get risk limits for a portfolio
 *     tags: [Risk Management]
 *     parameters:
 *       - in: path
 *         name: portfolio_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: active_only
 *         schema:
 *           type: boolean
 *           default: true
 *     responses:
 *       200:
 *         description: Risk limits retrieved successfully
 *   post:
 *     summary: Set a risk limit for a portfolio
 *     tags: [Risk Management]
 *     parameters:
 *       - in: path
 *         name: portfolio_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               limit_type:
 *                 type: string
 *                 enum: [DAILY_LOSS, POSITION_SIZE, CONCENTRATION, VAR_LIMIT, VOLATILITY_LIMIT, DRAWDOWN_LIMIT]
 *               threshold:
 *                 type: number
 *                 format: float
 *               is_active:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Risk limit created successfully
 *       400:
 *         description: Invalid limit type or missing parameters
 */

/**
 * @swagger
 * /api/risk/portfolios/{portfolio_id}/scenarios:
 *   post:
 *     summary: Perform scenario analysis
 *     tags: [Risk Management]
 *     parameters:
 *       - in: path
 *         name: portfolio_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               scenario_type:
 *                 type: string
 *                 enum: [STRESS_TEST, WHAT_IF, BACKTESTING]
 *               scenario_name:
 *                 type: string
 *               parameters:
 *                 type: object
 *     responses:
 *       201:
 *         description: Scenario analysis completed
 *       400:
 *         description: Invalid scenario type or missing parameters
 */

/**
 * @swagger
 * /api/risk/portfolios/{portfolio_id}/charts/var:
 *   get:
 *     summary: Get VaR distribution chart data
 *     tags: [Risk Visualization]
 *     parameters:
 *       - in: path
 *         name: portfolio_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: confidence_level
 *         schema:
 *           type: number
 *           default: 0.95
 *     responses:
 *       200:
 *         description: VaR chart data retrieved successfully
 */

/**
 * @swagger
 * /api/risk/portfolios/{portfolio_id}/charts/correlation:
 *   get:
 *     summary: Get correlation heatmap data
 *     tags: [Risk Visualization]
 *     parameters:
 *       - in: path
 *         name: portfolio_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Correlation heatmap data retrieved successfully
 */

/**
 * @swagger
 * /api/risk/portfolios/{portfolio_id}/monitoring/toggle:
 *   post:
 *     summary: Start or stop risk monitoring for a portfolio
 *     tags: [Risk Monitoring]
 *     parameters:
 *       - in: path
 *         name: portfolio_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [start, stop]
 *               options:
 *                 type: object
 *     responses:
 *       200:
 *         description: Monitoring toggled successfully
 */

/**
 * @swagger
 * /api/risk/limits/templates:
 *   get:
 *     summary: Get risk limit templates
 *     tags: [Risk Management]
 *     responses:
 *       200:
 *         description: Risk limit templates retrieved successfully
 */

/**
 * @swagger
 * /api/risk/health:
 *   get:
 *     summary: Health check for risk management service
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 service:
 *                   type: string
 *                   example: Risk Management API
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
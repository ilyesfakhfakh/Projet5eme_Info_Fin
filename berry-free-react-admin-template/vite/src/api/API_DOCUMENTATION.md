# API Services Documentation

This document provides a comprehensive overview of all available API services in the application, mapped to their backend controller endpoints.

## Table of Contents

1. [Authentication](#authentication)
2. [User Management](#user-management)
3. [Roles & Permissions](#roles--permissions)
4. [Audit Logs](#audit-logs)
5. [Orders Management](#orders-management)
6. [Portfolio Management](#portfolio-management)
7. [Trading Strategies](#trading-strategies)
8. [Order Book](#order-book)
9. [Market Data & Pricing](#market-data--pricing)
10. [Charts](#charts)
11. [Technical Indicators](#technical-indicators)
12. [Calculator](#calculator)
13. [Simulation](#simulation)
14. [Statistics](#statistics)

---

## Authentication

**File**: `auth.js`

### Methods

- `login(email, password)` - User login
- `register(payload)` - User registration (supports FormData)
- `me()` - Get current user info
- `logout()` - Logout current user
- `verifyEmail(params, otpCode)` - Verify email with OTP
- `resendVerificationCode(userId)` - Resend verification code
- `checkTwoFactorRequirement()` - Check if 2FA is required
- `verifyTwoFactorCode({ userId, code })` - Verify 2FA code

### Usage Example

```javascript
import { login, register, verifyEmail } from '@/api/auth';

// Login
const response = await login('user@example.com', 'password123');
localStorage.setItem('auth', JSON.stringify(response));

// Register
const formData = new FormData();
formData.append('email', 'new@example.com');
formData.append('password', 'password123');
const regResponse = await register(formData);

// Verify Email
await verifyEmail({ email: 'user@example.com', otp: '123456' });
```

---

## User Management

**File**: `users.js`

### Methods

- `listUsers(params)` - List users with pagination and filters
- `getUser(id)` - Get user by ID
- `createUser(userData)` - Create new user
- `updateUser(id, userData)` - Update user
- `deleteUser(id)` - Delete user
- `setUserRoles(id, roles)` - Set user roles
- `getUserStats(id)` - Get user statistics
- `unlockUser(id)` - Unlock user account
- `resetPassword(id, passwordData)` - Reset user password
- `getUserSecurityInfo(id)` - Get user security information
- `updateUserSecurity(id, securityData)` - Update security settings
- `toggleTwoFactorAuth(id, enable)` - Toggle 2FA
- `getUserAuditLogs(id, params)` - Get user audit logs
- `exportUsers(params)` - Export users to CSV

### Usage Example

```javascript
import { listUsers, getUser, updateUser } from '@/api/users';

// List users with filters
const users = await listUsers({
  page: 1,
  pageSize: 20,
  is_active: true,
  user_type: 'NOVICE'
});

// Get specific user
const user = await getUser('user-uuid');

// Update user
await updateUser('user-uuid', {
  first_name: 'John',
  last_name: 'Doe'
});
```

---

## Roles & Permissions

**File**: `roles.js`

### Methods

- `listRoles()` - List all roles
- `getRole(id)` - Get role by ID
- `createRole(roleData)` - Create new role
- `updateRole(id, { permissions })` - Update role permissions
- `deleteRole(id)` - Delete role

### Usage Example

```javascript
import { listRoles, createRole } from '@/api/roles';

// List all roles
const roles = await listRoles();

// Create new role
await createRole({
  role_name: 'TRADER',
  permissions: ['trade', 'view_portfolio']
});
```

---

## Audit Logs

**File**: `audit.js`

### Methods

- `listAuditLogs({ q, page, pageSize })` - List audit logs with search and pagination
- `getUserAuditLogs(userId, params)` - Get audit logs for specific user

### Usage Example

```javascript
import { listAuditLogs } from '@/api/audit';

const logs = await listAuditLogs({
  q: 'LOGIN',
  page: 1,
  pageSize: 10
});
```

---

## Orders Management

**File**: `orders.js`

### Methods

- `createOrder(orderData)` - Create new order
- `getOrders(filters)` - Get all orders with filters
- `getOrderById(orderId)` - Get order by ID
- `updateOrder(orderId, updateData)` - Update order
- `deleteOrder(orderId)` - Delete/cancel order
- `replaceOrder(orderId, updates)` - Replace order (modify quantity/price)
- `cancelAllOrders(portfolioId, assetId)` - Cancel all orders
- `getOpenOrders(portfolioId, assetId)` - Get open orders
- `getOrderHistory(portfolioId, options)` - Get order history
- `getOrderFillRatio(orderId)` - Get order fill ratio

### Usage Example

```javascript
import { createOrder, getOpenOrders, cancelAllOrders } from '@/api/orders';

// Create order
const order = await createOrder({
  portfolio_id: 'portfolio-uuid',
  asset_id: 'BTC',
  order_type: 'LIMIT',
  side: 'BUY',
  quantity: 0.5,
  price: 50000
});

// Get open orders
const openOrders = await getOpenOrders('portfolio-uuid', 'BTC');

// Cancel all orders
await cancelAllOrders('portfolio-uuid', 'BTC');
```

---

## Portfolio Management

**File**: `portfolio.js`

### Methods

- `getPortfolioSummary(portfolioId)` - Get portfolio summary with valuation
- `calculatePortfolioValue(portfolioId)` - Calculate and update portfolio value
- `updateAllPortfolioValues()` - Update all portfolio values (admin)

### Usage Example

```javascript
import { getPortfolioSummary, calculatePortfolioValue } from '@/api/portfolio';

// Get portfolio summary
const summary = await getPortfolioSummary('portfolio-uuid');

// Calculate portfolio value
const valuation = await calculatePortfolioValue('portfolio-uuid');
```

---

## Trading Strategies

**File**: `strategies.js`

### Methods

- `createStrategy(strategyData)` - Create new strategy
- `getStrategies(filters)` - Get all strategies
- `getStrategyById(strategyId)` - Get strategy by ID
- `updateStrategy(strategyId, updateData)` - Update strategy
- `deleteStrategy(strategyId)` - Delete strategy
- `backtestStrategy(strategyId, options)` - Backtest strategy
- `getStrategyPerformance(strategyId)` - Get strategy performance
- `activateStrategy(strategyId)` - Activate strategy
- `runStrategy(strategyId)` - Run strategy once

### Usage Example

```javascript
import { createStrategy, backtestStrategy, runStrategy } from '@/api/strategies';

// Create strategy
const strategy = await createStrategy({
  user_id: 'user-uuid',
  strategy_name: 'MA Crossover',
  description: 'Moving average crossover strategy',
  parameters: { fast_period: 10, slow_period: 30 }
});

// Backtest
const results = await backtestStrategy(strategy.strategy_id, {
  from: '2023-01-01',
  to: '2023-12-31'
});

// Run strategy
await runStrategy(strategy.strategy_id);
```

---

## Order Book

**File**: `orderBook.js`

### Methods

#### Order Book Operations
- `placeOrder(orderData)` - Place order and match
- `cancelOrder(orderId)` - Cancel order
- `getOrderBook(portfolioId, assetId)` - Get order book
- `getOrderExecutions(orderId)` - Get executions for order
- `getBestBid(assetId)` - Get best bid
- `getBestAsk(assetId)` - Get best ask
- `getMarketDepth(assetId, side, levels)` - Get market depth
- `getSpread(assetId)` - Get spread
- `getTopOfBook(assetId)` - Get top of book
- `getMarketSnapshot(assetId)` - Get market snapshot
- `purgeStaleOrders(cutoffDate)` - Purge stale orders
- `reopenOrder(orderId)` - Reopen order
- `cancelExpiredOrders()` - Cancel expired orders
- `forceMatchNow()` - Force matching cycle

#### Order Executions
- `createOrderExecution(executionData)` - Create execution
- `getAllOrderExecutions(orderId)` - Get all executions
- `getOrderExecutionById(executionId)` - Get execution by ID
- `updateOrderExecution(executionId, updateData)` - Update execution
- `deleteOrderExecution(executionId)` - Delete execution
- `getExecutionsInRange(assetId, from, to)` - Get executions in range
- `getExecutionVWAP(assetId, from, to)` - Get VWAP from executions
- `getLastTrade(assetId)` - Get last trade
- `aggregateExecutionsByOrder(orderId)` - Aggregate executions

### Usage Example

```javascript
import { 
  getOrderBook, 
  getBestBid, 
  getBestAsk, 
  getMarketDepth 
} from '@/api/orderBook';

// Get order book
const orderBook = await getOrderBook(null, 'BTC');

// Get best prices
const bestBid = await getBestBid('BTC');
const bestAsk = await getBestAsk('BTC');

// Get market depth
const depth = await getMarketDepth('BTC', 'BUY', 10);
```

---

## Market Data & Pricing

**File**: `price.js`

### Methods

#### Price Operations
- `getCurrentPrice(assetId, method)` - Get current price
- `getPriceHistory(assetId, from, to, interval)` - Get price history
- `getVWAP(assetId, period)` - Get VWAP
- `getOHLCV(assetId, interval, from, to, limit)` - Get OHLCV data
- `getTicker(assetId)` - Get 24h ticker
- `generateOHLCV(assetId, interval, hoursBack)` - Generate OHLCV (admin)
- `generateAllOHLCV(interval, hoursBack)` - Generate all OHLCV (admin)

#### OHLCV Operations
- `getOHLCVData(assetId, interval, from, to, limit)` - Get OHLCV data
- `getLatestOHLCV(assetId, interval)` - Get latest OHLCV
- `getOHLCVStats(assetId, interval, days)` - Get OHLCV statistics
- `generateOHLCVForAsset(assetId, interval, hoursBack)` - Generate OHLCV
- `generateOHLCVForAllAssets(interval, hoursBack)` - Generate all OHLCV
- `aggregateOHLCV(assetId, targetInterval, sourceInterval)` - Aggregate OHLCV

### Usage Example

```javascript
import { 
  getCurrentPrice, 
  getPriceHistory, 
  getOHLCVData 
} from '@/api/price';

// Get current price
const price = await getCurrentPrice('BTC', 'midPrice');

// Get price history
const history = await getPriceHistory(
  'BTC',
  '2024-01-01',
  '2024-01-31',
  '1h'
);

// Get OHLCV data
const ohlcv = await getOHLCVData('BTC', '1h', null, null, 100);
```

---

## Charts

**File**: `charts.js`

### Methods

- `createChart(chartData)` - Create new chart
- `getCharts(filters)` - Get all charts
- `getChartById(chartId)` - Get chart by ID
- `updateChart(chartId, updateData)` - Update chart
- `deleteChart(chartId)` - Delete chart
- `getChartsByAsset(assetId)` - Get charts by asset
- `getChartsByType(chartType)` - Get charts by type
- `updateChartAnnotations(chartId, annotations)` - Update annotations
- `getChartWithIndicators(chartId)` - Get chart with indicators

### Usage Example

```javascript
import { createChart, getChartWithIndicators } from '@/api/charts';

// Create chart
const chart = await createChart({
  asset_id: 'BTC',
  chart_type: 'CANDLESTICK',
  timeframe: '1h'
});

// Get chart with indicators
const chartData = await getChartWithIndicators(chart.chart_id);
```

---

## Technical Indicators

**File**: `technicalIndicators.js`

Comprehensive service for technical indicators with 40+ methods covering:

### CRUD Operations
- `createTechnicalIndicator(indicatorData)`
- `getTechnicalIndicators(filters)`
- `getTechnicalIndicatorById(indicatorId)`
- `updateTechnicalIndicator(indicatorId, updateData)`
- `deleteTechnicalIndicator(indicatorId)`

### Query Operations
- `getTechnicalIndicatorsByAsset(assetId)`
- `getTechnicalIndicatorsByType(indicatorType)`

### Calculation Operations
- `calculateTechnicalIndicator(indicatorId)`
- `getTechnicalIndicatorValues(indicatorId, limit)`
- `calculateIndicatorForAsset(indicatorId, assetId, period)`
- `updateIndicatorValues(indicatorId)`
- `batchRecalculateIndicators()`

### Signal Operations
- `generateSignal(indicatorValue, indicatorType)`
- `detectTrend(indicatorId, assetId)`
- `combineIndicators(primaryId, secondaryId, assetId)`

### Optimization & Analysis
- `optimizeParameters(indicatorId, assetId, parameterRanges)`
- `getHistoricalValues(indicatorId, assetId, startDate, endDate)`
- `evaluatePerformance(indicatorId, assetId, startDate, endDate)`
- `predictNextSignal(indicatorId, assetId)`

### Indicator Values
- Full CRUD for indicator values
- Bulk operations
- Date range queries
- Signal-based filtering

### Usage Example

```javascript
import { 
  createTechnicalIndicator,
  calculateTechnicalIndicator,
  getTechnicalIndicatorValues
} from '@/api/technicalIndicators';

// Create RSI indicator
const indicator = await createTechnicalIndicator({
  asset_id: 'BTC',
  indicator_type: 'RSI',
  period: 14,
  parameters: { period: 14 }
});

// Calculate indicator
await calculateTechnicalIndicator(indicator.indicator_id);

// Get values
const values = await getTechnicalIndicatorValues(indicator.indicator_id, 100);
```

---

## Calculator

**File**: `calculator.js`

### Methods

- `calculateSMA(prices, period)` - Calculate Simple Moving Average
- `calculateEMA(prices, period)` - Calculate Exponential Moving Average
- `calculateRSI(prices, period)` - Calculate RSI
- `calculateMACD(prices, fastPeriod, slowPeriod, signalPeriod)` - Calculate MACD
- `calculateBollingerBands(prices, period, stdDev)` - Calculate Bollinger Bands
- `generateSignal(indicatorType, currentValue, previousValue, parameters)` - Generate trading signal
- `calculateMultiple(prices, indicators)` - Calculate multiple indicators
- `validateParameters(indicatorType, parameters)` - Validate parameters
- `getCalculationExamples()` - Get calculation examples

### Usage Example

```javascript
import { calculateRSI, calculateMACD, generateSignal } from '@/api/calculator';

// Calculate RSI
const rsi = await calculateRSI([100, 102, 101, 105, 103], 14);

// Calculate MACD
const macd = await calculateMACD(prices, 12, 26, 9);

// Generate signal
const signal = await generateSignal('RSI', 75, 70);
```

---

## Simulation

**File**: `simulationApi.js`

Comprehensive simulation management with 20+ methods.

### State Management
- `getSimulationState()`
- `startSimulation(config)`
- `pauseSimulation()`
- `resumeSimulation()`
- `stopSimulation()`
- `resetSimulation()`
- `setSimulationSpeed(speed)`
- `jumpToDate(date)`

### Asset Management
- `initializeAsset(asset, initialPrice, params)`
- `getCurrentAssetPrice(asset)`
- `getAssetPriceHistory(asset, limit)`

### Data Import
- `importFromCSV(asset, filePath, options)`
- `importFromYahooFinance(asset, period, interval)`
- `importFromAlphaVantage(asset, apiKey, options)`
- `getImportedData(asset, startDate, endDate)`
- `validateImportedData(asset)`

### Snapshot & Metrics
- `saveSnapshot()`
- `loadSnapshot(snapshot)`
- `getSimulationMetrics()`
- `scheduleEvent(event, scheduledTime)`

### Usage Example

```javascript
import { 
  startSimulation, 
  setSimulationSpeed, 
  initializeAsset 
} from '@/api/simulationApi';

// Start simulation
await startSimulation({
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  speed: 1
});

// Initialize asset
await initializeAsset('BTC', 50000, {
  volatility: 0.02,
  drift: 0.0001
});

// Set speed
await setSimulationSpeed(10); // 10x speed
```

---

## Statistics

**File**: `stats.js`

### Methods

- `getNewUsersByMonth()` - Get new users by month
- `getUserStatistics()` - Get user statistics
- `getTradingStatistics()` - Get trading statistics
- `getPortfolioStatistics()` - Get portfolio statistics
- `getSystemStatistics()` - Get system statistics

### Usage Example

```javascript
import { getNewUsersByMonth, getTradingStatistics } from '@/api/stats';

// Get user growth
const userGrowth = await getNewUsersByMonth();

// Get trading stats
const tradingStats = await getTradingStatistics();
```

---

## Import & Usage

### Individual Import

```javascript
// Import specific service
import { login, logout } from '@/api/auth';
import { createOrder, getOrders } from '@/api/orders';
```

### Namespace Import

```javascript
// Import entire service namespace
import * as authApi from '@/api/auth';
import * as ordersApi from '@/api/orders';

// Usage
await authApi.login('user@example.com', 'password');
await ordersApi.createOrder(orderData);
```

### Index Import

```javascript
// Import from index
import { authApi, ordersApi, portfolioApi } from '@/api';

// Usage
await authApi.login('user@example.com', 'password');
```

---

## Error Handling

All API methods use the centralized HTTP client which handles:

- Authentication tokens
- Error responses
- Network errors
- Response parsing

### Example Error Handling

```javascript
try {
  const user = await getUser('user-uuid');
} catch (error) {
  if (error.status === 404) {
    console.error('User not found');
  } else if (error.status === 401) {
    console.error('Unauthorized');
    // Redirect to login
  } else {
    console.error('Error:', error.message);
  }
}
```

---

## Environment Configuration

Set your API base URL in `.env`:

```env
VITE_API_BASE_URL=http://localhost:3200/api/v1
```

The HTTP client automatically uses this URL for all requests.

---

## Backend Mapping

All services map directly to backend controller endpoints:

| Frontend Service | Backend Controller | Base Path |
|------------------|-------------------|-----------|
| auth.js | auth.controller.js | /auth |
| users.js | users.controller.js | /users |
| orders.js | orders.controller.js | /orders |
| portfolio.js | portfolio.controller.js | /portfolio |
| strategies.js | trading-strategies.controller.js | /trading-strategies |
| orderBook.js | order-book.controller.js | /order-book |
| price.js | price.controller.js | /price |
| charts.js | chart.controller.js | /charts |
| technicalIndicators.js | technical-indicator.controller.js | /technical-indicators |
| calculator.js | calculator.controller.js | /calculator |
| simulationApi.js | simulation.controller.js | /simulation |
| stats.js | stats.controller.js | /stats |
| roles.js | roles.controller.js | /roles |
| audit.js | audit.controller.js | /audit |

---

## Contributing

When adding new API methods:

1. Follow the existing pattern in the service file
2. Add JSDoc comments for documentation
3. Update this README with usage examples
4. Export methods in the default export object
5. Add to the index.js if creating a new service file

---

## Support

For issues or questions, please refer to the backend API documentation or contact the development team.

# API Services - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Import What You Need

```javascript
// Single function import
import { login } from '@/api/auth';
import { createOrder } from '@/api/orders';

// Or namespace import
import * as ordersApi from '@/api/orders';
import * as priceApi from '@/api/price';
```

### 2. Common Operations

#### Authentication

```javascript
import { login, register, logout } from '@/api/auth';

// Login
const response = await login('user@email.com', 'password');
localStorage.setItem('auth', JSON.stringify(response));

// Register
const newUser = await register({
  username: 'john_doe',
  email: 'john@email.com',
  password: 'secure123',
  first_name: 'John',
  last_name: 'Doe'
});

// Logout
await logout();
```

#### Order Management

```javascript
import { createOrder, getOrders, cancelOrder } from '@/api/orders';

// Create an order
const order = await createOrder({
  portfolio_id: 'portfolio-uuid',
  asset_id: 'BTC',
  order_type: 'LIMIT',
  side: 'BUY',
  quantity: 0.5,
  price: 50000
});

// Get all orders
const orders = await getOrders({ status: 'OPEN' });

// Cancel order
await cancelOrder(order.order_id);
```

#### Market Data

```javascript
import { getCurrentPrice, getOHLCV, getTicker } from '@/api/price';

// Get current price
const btcPrice = await getCurrentPrice('BTC');

// Get OHLCV data
const ohlcv = await getOHLCV('BTC', '1h', null, null, 100);

// Get 24h ticker
const ticker = await getTicker('BTC');
```

#### Technical Indicators

```javascript
import { 
  createTechnicalIndicator,
  calculateTechnicalIndicator,
  getTechnicalIndicatorValues 
} from '@/api/technicalIndicators';

// Create RSI indicator
const rsi = await createTechnicalIndicator({
  asset_id: 'BTC',
  indicator_type: 'RSI',
  period: 14,
  parameters: { period: 14 }
});

// Calculate it
await calculateTechnicalIndicator(rsi.indicator_id);

// Get values
const values = await getTechnicalIndicatorValues(rsi.indicator_id, 100);
```

#### Portfolio Management

```javascript
import { getPortfolioSummary, calculatePortfolioValue } from '@/api/portfolio';

// Get portfolio summary
const summary = await getPortfolioSummary('portfolio-uuid');

// Calculate portfolio value
const value = await calculatePortfolioValue('portfolio-uuid');
```

#### Trading Strategies

```javascript
import { 
  createStrategy, 
  backtestStrategy, 
  runStrategy 
} from '@/api/strategies';

// Create strategy
const strategy = await createStrategy({
  user_id: 'user-uuid',
  strategy_name: 'MA Crossover',
  description: 'Moving average crossover',
  parameters: { fast: 10, slow: 30 }
});

// Backtest
const results = await backtestStrategy(strategy.strategy_id, {
  from: '2024-01-01',
  to: '2024-12-31'
});

// Run strategy
await runStrategy(strategy.strategy_id);
```

### 3. Error Handling

```javascript
try {
  const orders = await getOrders();
} catch (error) {
  if (error.status === 401) {
    // Not authenticated - redirect to login
    window.location.href = '/login';
  } else if (error.status === 404) {
    console.error('Not found');
  } else if (error.code === 'NETWORK_ERROR') {
    console.error('Network error - check connection');
  } else {
    console.error('Error:', error.message);
  }
}
```

### 4. Available Services

| Service | Purpose | Key Methods |
|---------|---------|-------------|
| **auth** | Authentication | login, register, logout, verifyEmail |
| **users** | User management | listUsers, getUser, updateUser, deleteUser |
| **orders** | Order operations | createOrder, getOrders, cancelOrder |
| **portfolio** | Portfolio management | getPortfolioSummary, calculatePortfolioValue |
| **strategies** | Trading strategies | createStrategy, backtestStrategy |
| **orderBook** | Order book operations | getOrderBook, getBestBid, getMarketDepth |
| **price** | Market data | getCurrentPrice, getOHLCV, getTicker |
| **charts** | Chart management | createChart, getCharts, updateChart |
| **technicalIndicators** | Technical analysis | 45+ methods for indicators |
| **calculator** | Calculations | calculateRSI, calculateMACD, calculateSMA |
| **simulation** | Simulation control | startSimulation, pauseSimulation |
| **stats** | Statistics | getUserStatistics, getTradingStatistics |
| **roles** | Role management | listRoles, createRole, updateRole |
| **audit** | Audit logs | listAuditLogs, getUserAuditLogs |

### 5. Configuration

Create or update `.env`:

```env
VITE_API_BASE_URL=http://localhost:3200/api/v1
```

### 6. Complete Examples

#### Order Flow

```javascript
import { 
  getCurrentPrice, 
  getPortfolioSummary, 
  createOrder 
} from '@/api';

// Get current price
const price = await getCurrentPrice('BTC');

// Check portfolio
const portfolio = await getPortfolioSummary('portfolio-uuid');

// Create order if we have funds
if (portfolio.available_cash >= price * quantity) {
  const order = await createOrder({
    portfolio_id: portfolio.portfolio_id,
    asset_id: 'BTC',
    order_type: 'MARKET',
    side: 'BUY',
    quantity: 0.1
  });
  console.log('Order created:', order);
}
```

#### Technical Analysis Workflow

```javascript
import { 
  createTechnicalIndicator,
  calculateTechnicalIndicator,
  getTechnicalIndicatorValues,
  generateSignal 
} from '@/api/technicalIndicators';

// Create RSI
const rsi = await createTechnicalIndicator({
  asset_id: 'BTC',
  indicator_type: 'RSI',
  period: 14
});

// Calculate
await calculateTechnicalIndicator(rsi.indicator_id);

// Get latest value
const values = await getTechnicalIndicatorValues(rsi.indicator_id, 1);
const currentRSI = values[0]?.value;

// Generate signal
const signal = await generateSignal(currentRSI, 'RSI');
console.log('Signal:', signal); // BUY, SELL, or HOLD
```

#### User Management

```javascript
import { 
  listUsers, 
  getUser, 
  updateUser, 
  toggleTwoFactorAuth 
} from '@/api/users';

// List users
const users = await listUsers({
  page: 1,
  pageSize: 20,
  is_active: true
});

// Get specific user
const user = await getUser('user-uuid');

// Update user
await updateUser('user-uuid', {
  first_name: 'Jane',
  email: 'jane@example.com'
});

// Enable 2FA
await toggleTwoFactorAuth('user-uuid', true);
```

### 7. React Component Example

```jsx
import React, { useState, useEffect } from 'react';
import { getOrders, createOrder } from '@/api/orders';
import { getCurrentPrice } from '@/api/price';

function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await getOrders({ status: 'OPEN' });
      setOrders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async (orderData) => {
    try {
      await createOrder(orderData);
      await loadOrders(); // Refresh list
    } catch (err) {
      alert('Error creating order: ' + err.message);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Orders</h1>
      {orders.map(order => (
        <div key={order.order_id}>{order.asset_id}: {order.quantity}</div>
      ))}
    </div>
  );
}
```

### 8. Need More Info?

- **Full Documentation**: See `API_DOCUMENTATION.md`
- **Implementation Details**: See `IMPLEMENTATION_SUMMARY.md`
- **All Services**: Check `/src/api/` folder

### 9. Quick Tips

✅ **Always handle errors** - Network issues happen
✅ **Check authentication** - Some endpoints require login
✅ **Use loading states** - Better UX
✅ **Cache when appropriate** - Reduce API calls
✅ **Test endpoints** - Use browser console for debugging

### 10. Common Patterns

#### Loading Pattern

```javascript
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  async function load() {
    try {
      setLoading(true);
      const result = await apiMethod();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  load();
}, []);
```

#### Form Submission Pattern

```javascript
const handleSubmit = async (formData) => {
  try {
    setSubmitting(true);
    await createSomething(formData);
    navigate('/success');
  } catch (err) {
    setError(err.message);
  } finally {
    setSubmitting(false);
  }
};
```

## 🎉 You're Ready!

All 200+ backend endpoints are now available in your React app. Start building! 🚀

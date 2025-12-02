# 🏦 PROBLÈMES MÉTIER - SIMULATEUR DE TRADING

## ⚠️ LACUNES AU NIVEAU DES CONCEPTS FINANCIERS

J'ai identifié **30+ problèmes** dans la logique métier du simulateur de marché qui le rendent **non réaliste** par rapport à un vrai exchange.

---

## 🚨 PROBLÈMES CRITIQUES DE TRADING

### **1. 💸 PAS DE MARGIN CALL / LIQUIDATION**

**Problème actuel:**
```javascript
// portfolio.service.js
async function calculatePortfolioValue(portfolioId) {
  const totalValue = cashBalance + positionValue;
  const profitLoss = totalValue - initialBalance;
  
  // ❌ Aucune vérification si portfolio est en négatif!
  // ❌ Pas de liquidation automatique!
  // ❌ User peut avoir -$50,000 sans conséquence!
}
```

**Ce qui manque:**
```javascript
// ✅ Dans un vrai broker:
if (totalValue < 0) {
  // Margin call!
  await liquidatePositions(portfolioId);
  await notifyUser('MARGIN_CALL');
}

if (totalValue < initialBalance * 0.3) {
  // Warning: Approche du margin call
  await notifyUser('MARGIN_WARNING');
}
```

**Règle réelle:**
- **Maintenance Margin**: Minimum 25% du total
- Si tombe en-dessous → Liquidation automatique
- Positions vendues au market price (perte garantie)

---

### **2. 📊 ORDER BOOK IRRÉALISTE**

**Problème 1: Pas de Market Depth**
```javascript
// order-book.service.js
async function matchOrders(buyOrders, sellOrders) {
  // ❌ Match instantané sans considérer la profondeur!
  // En réalité: gros ordre consume plusieurs niveaux de prix
}
```

**Exemple réel:**
```
Order Book BTC:
ASK: $50,100 → 0.5 BTC
ASK: $50,050 → 1.0 BTC
ASK: $50,000 → 2.0 BTC
---
BID: $49,950 → 1.5 BTC

User place: BUY 3 BTC @ Market
Résultat:
- Achète 2.0 BTC @ $50,000
- Achète 1.0 BTC @ $50,050
Prix moyen: $50,016.67
```

**Ton code:**
```javascript
// ❌ Match tout au même prix
const price = buy.price || sell.price;
// Pas de partial fills à différents prix!
```

---

**Problème 2: Pas de Slippage**
```javascript
// ❌ Ton code
const executionPrice = sell.price; // Prix demandé

// ✅ Réalité
const slippage = calculateSlippage(quantity, orderBookDepth);
const executionPrice = sell.price * (1 + slippage);
// Plus grosse quantité = plus de slippage
```

**Formule réelle:**
```javascript
function calculateSlippage(quantity, availableLiquidity) {
  const liquidityRatio = quantity / availableLiquidity;
  
  if (liquidityRatio < 0.1) return 0.001; // 0.1%
  if (liquidityRatio < 0.5) return 0.005; // 0.5%
  if (liquidityRatio < 1.0) return 0.02;  // 2%
  return 0.05; // 5% pour gros ordres
}
```

---

**Problème 3: Market Orders Dangereux**
```javascript
// order-book.service.js
if (buyIsMarket) {
  price = sell.price; // ❌ Prend le premier prix!
}
```

**Problème:**
- Si order book vide → peut exécuter à n'importe quel prix!
- Flash crash possible
- User peut perdre 100% instantanément

**Solution réelle:**
```javascript
// Protection contre flash crash
const MAX_SLIPPAGE = 0.05; // 5% max
const referencePrice = getLastTradePrice(assetId);

if (Math.abs(price - referencePrice) / referencePrice > MAX_SLIPPAGE) {
  throw new Error('Price too far from market - use limit order');
}
```

---

### **3. ⏰ PAS DE MARKET HOURS / CIRCUIT BREAKERS**

**Problème:**
```javascript
// ❌ Marché ouvert 24/7 pour tout!
// Stocks tradent même à 3h du matin
// Pas de pauses
// Pas de circuit breakers
```

**Réalité:**
- **NYSE/NASDAQ**: 9:30 AM - 4:00 PM EST
- **Pre-market**: 4:00 AM - 9:30 AM
- **After-hours**: 4:00 PM - 8:00 PM
- **Weekend**: FERMÉ

**Circuit Breakers:**
```javascript
// ✅ À implémenter
const CIRCUIT_BREAKER_LEVELS = {
  LEVEL_1: 0.07,  // -7%  → Pause 15 min
  LEVEL_2: 0.13,  // -13% → Pause 15 min
  LEVEL_3: 0.20   // -20% → Fermeture journée
};

async function checkCircuitBreaker(assetId) {
  const openPrice = await getOpenPrice(assetId);
  const currentPrice = await getCurrentPrice(assetId);
  const drop = (openPrice - currentPrice) / openPrice;
  
  if (drop >= CIRCUIT_BREAKER_LEVELS.LEVEL_3) {
    await haltTrading(assetId, 'DAY');
    return 'HALTED';
  }
  // ... autres niveaux
}
```

---

### **4. 💰 SHORT SELLING MAL IMPLÉMENTÉ**

**Problème:**
```javascript
// order.service.js
if (side === 'SELL') {
  // Vérifie position
  if (position.quantity < quantity) {
    throw new Error('Insufficient position');
  }
}
```

**Ce qui manque:**
- Pas de distinction entre **SELL** et **SHORT SELL**
- Pas de margin requirement pour short
- Pas de stock borrowing fees
- Pas de forced buyback (short squeeze)

**Short Selling réel:**
```javascript
async function shortSell(portfolioId, assetId, quantity) {
  // 1. Vérifier margin requirement (150% minimum)
  const portfolio = await db.portfolios.findByPk(portfolioId);
  const price = await getCurrentPrice(assetId);
  const requiredMargin = quantity * price * 1.5;
  
  if (portfolio.current_balance < requiredMargin) {
    throw new Error('Insufficient margin for short');
  }
  
  // 2. Emprunter les actions (borrow fee)
  const borrowFee = quantity * price * 0.05; // 5% annuel
  await chargeBorrowFee(portfolioId, borrowFee);
  
  // 3. Créer position SHORT
  await db.positions.create({
    portfolio_id: portfolioId,
    asset_id: assetId,
    quantity: -quantity, // NÉGATIF!
    entry_price: price,
    position_type: 'SHORT',
    margin_posted: requiredMargin
  });
  
  // 4. Surveiller pour margin call
  await monitorShortPosition(portfolioId, assetId);
}

// Short squeeze scenario
async function checkShortCovering(assetId) {
  const price = await getCurrentPrice(assetId);
  const shortPositions = await db.positions.findAll({
    where: { 
      asset_id: assetId, 
      position_type: 'SHORT' 
    }
  });
  
  for (const pos of shortPositions) {
    const loss = (price - pos.entry_price) * Math.abs(pos.quantity);
    const equity = pos.margin_posted - loss;
    
    // Margin call si equity < 30%
    if (equity < pos.margin_posted * 0.3) {
      await forceBuyToCover(pos); // Liquidation forcée!
    }
  }
}
```

---

### **5. 📉 PAS DE FEES / COMMISSIONS RÉALISTES**

**Problème:**
```javascript
// order-execution.service.js
const commission = quantity * price * 0.001; // 0.1%
```

**Problèmes:**
- Commission fixe 0.1% → trop simple
- Pas de spread bid/ask
- Pas de SEC fees (USA)
- Pas de maker/taker fees
- Pas de volume-based tiers

**Structure réelle:**
```javascript
const COMMISSION_STRUCTURE = {
  // Maker fees (ajoute liquidité)
  maker: {
    tier1: 0.0010,  // < $100k/mois
    tier2: 0.0008,  // $100k-$1M
    tier3: 0.0005,  // > $1M
  },
  // Taker fees (prend liquidité)
  taker: {
    tier1: 0.0020,
    tier2: 0.0015,
    tier3: 0.0010,
  },
  // Fees additionnels
  sec_fee: 0.0000231,     // SEC Transaction Fee
  finra_fee: 0.000119,    // FINRA Trading Activity Fee
  clearing_fee: 0.0002    // Clearing fees
};

async function calculateRealFees(order, isMaker) {
  const volume = await getUserMonthlyVolume(order.user_id);
  const tier = getTier(volume);
  
  const baseFee = isMaker 
    ? COMMISSION_STRUCTURE.maker[tier]
    : COMMISSION_STRUCTURE.taker[tier];
  
  const secFee = order.quantity * order.price * COMMISSION_STRUCTURE.sec_fee;
  const finraFee = order.quantity * order.price * COMMISSION_STRUCTURE.finra_fee;
  
  return {
    commission: order.quantity * order.price * baseFee,
    sec_fee: secFee,
    finra_fee: finraFee,
    total: (order.quantity * order.price * baseFee) + secFee + finraFee
  };
}
```

---

### **6. 🎯 PAS DE ORDER TYPES AVANCÉS**

**Ce qui manque:**
```javascript
// Types d'ordres absents:
- STOP LOSS (automatique)
- TRAILING STOP
- OCO (One-Cancels-Other)
- ICEBERG orders
- TWAP (Time-Weighted Average Price)
- VWAP (Volume-Weighted Average Price)
```

**Exemple: Stop Loss**
```javascript
async function createStopLoss(portfolioId, assetId, triggerPrice, quantity) {
  // Ordre dormant qui s'active si prix atteint triggerPrice
  await db.orders.create({
    portfolio_id: portfolioId,
    asset_id: assetId,
    order_type: 'STOP_LOSS',
    side: 'SELL',
    quantity: quantity,
    trigger_price: triggerPrice,
    status: 'PENDING_TRIGGER'
  });
  
  // Monitor en background
  watchPrice(assetId, async (currentPrice) => {
    if (currentPrice <= triggerPrice) {
      await activateStopLoss(orderId);
      await placeMarketOrder(portfolioId, assetId, 'SELL', quantity);
    }
  });
}
```

**Exemple: Trailing Stop**
```javascript
// Stop qui suit le prix si monte
async function createTrailingStop(portfolioId, assetId, trailPercent) {
  let highestPrice = await getCurrentPrice(assetId);
  let stopPrice = highestPrice * (1 - trailPercent);
  
  watchPrice(assetId, async (currentPrice) => {
    // Update highest
    if (currentPrice > highestPrice) {
      highestPrice = currentPrice;
      stopPrice = highestPrice * (1 - trailPercent);
    }
    
    // Trigger si tombe
    if (currentPrice <= stopPrice) {
      await placeMarketOrder(...);
    }
  });
}
```

---

### **7. 📊 PRICE DISCOVERY IRRÉALISTE**

**Problème:**
```javascript
// price.service.js
async function simulatePrice(assetId) {
  const randomShock = (Math.random() - 0.5) * 2 * volatility;
  const newPrice = lastPrice + (lastPrice * randomShock);
  // ❌ Prix change sans raison!
}
```

**Ce qui manque:**
- Pas de volume-price relationship
- Pas de support/resistance levels
- Pas d'impact des news
- Pas de correlation entre assets
- Pas de market sentiment

**Simulation réaliste:**
```javascript
async function simulatePriceRealistic(assetId) {
  // 1. Calculer supply/demand du order book
  const { buyVolume, sellVolume } = await getOrderBookVolume(assetId);
  const pressureRatio = buyVolume / sellVolume;
  
  // 2. Impact du volume
  const recentTrades = await getRecentTrades(assetId, '5m');
  const volumeImpact = calculateVolumeImpact(recentTrades);
  
  // 3. Support/Resistance
  const sr = await getSupportResistance(assetId);
  const currentPrice = await getLastPrice(assetId);
  
  let priceMovement = 0;
  
  // Pression acheteuse
  if (pressureRatio > 1.2) {
    priceMovement += 0.001 * Math.log(pressureRatio);
  }
  
  // Resistance
  if (currentPrice >= sr.resistance * 0.99) {
    priceMovement -= 0.002; // Sell pressure
  }
  
  // Support
  if (currentPrice <= sr.support * 1.01) {
    priceMovement += 0.002; // Buy pressure
  }
  
  // Random walk
  const randomWalk = (Math.random() - 0.5) * volatility;
  
  const newPrice = currentPrice * (1 + priceMovement + randomWalk);
  
  return Math.max(0.01, newPrice); // Pas de prix négatif
}
```

---

### **8. 💹 PAS DE DIVIDENDES / SPLITS**

**Ce qui manque:**
```javascript
// Dividendes
- Pas de versement périodique
- Pas d'ex-dividend date
- Pas de dividend yield

// Stock Splits
- Pas de 2-for-1 split
- Pas d'ajustement des positions
- Pas d'ajustement de l'historique
```

**Dividendes réels:**
```javascript
async function processDividend(assetId, dividendPerShare, exDate, payDate) {
  // 1. Trouver tous les holders à la ex-date
  const positions = await db.positions.findAll({
    where: { 
      asset_id: assetId,
      created_at: { [Op.lt]: exDate }
    }
  });
  
  // 2. Payer dividendes
  for (const pos of positions) {
    const dividend = pos.quantity * dividendPerShare;
    
    await db.portfolios.increment('current_balance', {
      by: dividend,
      where: { portfolio_id: pos.portfolio_id }
    });
    
    await db.transactions.create({
      portfolio_id: pos.portfolio_id,
      asset_id: assetId,
      type: 'DIVIDEND',
      amount: dividend,
      executed_at: payDate
    });
  }
  
  // 3. Update asset price (baisse du dividend)
  const currentPrice = await getCurrentPrice(assetId);
  await updatePrice(assetId, currentPrice - dividendPerShare);
}
```

**Stock Split:**
```javascript
async function processStockSplit(assetId, ratio) {
  // Ex: 2-for-1 split → ratio = 2
  
  // 1. Update toutes les positions
  await db.positions.update({
    quantity: db.sequelize.literal(`quantity * ${ratio}`),
    average_price: db.sequelize.literal(`average_price / ${ratio}`)
  }, {
    where: { asset_id: assetId }
  });
  
  // 2. Update prix actuel
  const currentPrice = await getCurrentPrice(assetId);
  await updatePrice(assetId, currentPrice / ratio);
  
  // 3. Ajuster historique
  await db.ohlcvs.update({
    open: db.sequelize.literal(`open / ${ratio}`),
    high: db.sequelize.literal(`high / ${ratio}`),
    low: db.sequelize.literal(`low / ${ratio}`),
    close: db.sequelize.literal(`close / ${ratio}`),
    volume: db.sequelize.literal(`volume * ${ratio}`)
  }, {
    where: { asset_id: assetId }
  });
}
```

---

### **9. 🌍 PAS DE MULTI-CURRENCY / FX**

**Problème:**
```javascript
// Tout en USD
// Pas de conversion EUR/USD, GBP/USD
// Pas de forex spread
// Pas de currency risk
```

**Forex réel:**
```javascript
const FX_PAIRS = {
  'EUR/USD': { bid: 1.0850, ask: 1.0852, spread: 0.0002 },
  'GBP/USD': { bid: 1.2640, ask: 1.2643, spread: 0.0003 },
  'USD/JPY': { bid: 149.50, ask: 149.55, spread: 0.05 }
};

async function convertCurrency(amount, fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) return amount;
  
  const pair = `${fromCurrency}/${toCurrency}`;
  const inversePair = `${toCurrency}/${fromCurrency}`;
  
  if (FX_PAIRS[pair]) {
    // Use ask price for buying
    return amount * FX_PAIRS[pair].ask;
  } else if (FX_PAIRS[inversePair]) {
    // Use bid price for selling
    return amount / FX_PAIRS[inversePair].bid;
  }
  
  throw new Error('Currency pair not supported');
}

async function tradeInternationalStock(portfolioId, symbol, quantity) {
  // Ex: Acheter Vodafone (UK) depuis portfolio USD
  const stockPrice = await getPrice(symbol); // en GBP
  const fxRate = FX_PAIRS['GBP/USD'].ask;
  
  const costInGBP = quantity * stockPrice;
  const costInUSD = costInGBP * fxRate;
  
  // Currency risk: si GBP/USD baisse, perte même si stock monte!
  
  await deductFromPortfolio(portfolioId, costInUSD, 'USD');
  await createPosition(portfolioId, symbol, quantity, stockPrice, 'GBP');
}
```

---

### **10. 📊 PAS DE RISK METRICS AVANCÉS**

**Ce qui manque:**
```javascript
// Portfolio risk
- Sharpe Ratio (mal calculé)
- Sortino Ratio (absent)
- Max Drawdown (absent)
- Beta vs market (absent)
- Value at Risk (VaR) (absent)
- Conditional VaR (CVaR) (absent)

// Position risk
- Concentration risk (pas de limite)
- Correlation analysis (absent)
- Stress testing (absent)
```

**Métriques réelles:**
```javascript
async function calculateAdvancedRisk(portfolioId) {
  const positions = await getPositions(portfolioId);
  const returns = await getPortfolioReturns(portfolioId, '1y');
  
  // 1. Sharpe Ratio (correct)
  const avgReturn = mean(returns);
  const stdDev = standardDeviation(returns);
  const riskFreeRate = 0.04 / 252; // T-Bill annualisé
  const sharpeRatio = (avgReturn - riskFreeRate) / stdDev;
  
  // 2. Sortino Ratio (downside risk only)
  const downsideReturns = returns.filter(r => r < 0);
  const downsideDev = standardDeviation(downsideReturns);
  const sortinoRatio = (avgReturn - riskFreeRate) / downsideDev;
  
  // 3. Max Drawdown
  let peak = 0;
  let maxDrawdown = 0;
  let currentValue = initialBalance;
  
  for (const ret of returns) {
    currentValue *= (1 + ret);
    if (currentValue > peak) peak = currentValue;
    const drawdown = (peak - currentValue) / peak;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }
  
  // 4. VaR (95% confidence)
  const sortedReturns = returns.sort((a, b) => a - b);
  const varIndex = Math.floor(returns.length * 0.05);
  const var95 = sortedReturns[varIndex];
  
  // 5. Concentration Risk
  const totalValue = positions.reduce((sum, p) => sum + p.market_value, 0);
  const concentrations = positions.map(p => p.market_value / totalValue);
  const maxConcentration = Math.max(...concentrations);
  
  // 6. Beta vs SPY
  const marketReturns = await getMarketReturns('SPY', '1y');
  const beta = calculateBeta(returns, marketReturns);
  
  return {
    sharpe_ratio: sharpeRatio,
    sortino_ratio: sortinoRatio,
    max_drawdown: maxDrawdown,
    var_95: var95,
    beta: beta,
    concentration_risk: maxConcentration > 0.2 ? 'HIGH' : 'MODERATE'
  };
}
```

---

### **11. 🔄 PAS DE PORTFOLIO REBALANCING**

**Ce qui manque:**
```javascript
// Auto-rebalancing
// Target allocation
// Tax-loss harvesting
// Dollar-cost averaging
```

**Rebalancing réel:**
```javascript
async function rebalancePortfolio(portfolioId, targetAllocation) {
  // Target: { 'AAPL': 0.30, 'MSFT': 0.30, 'GOOGL': 0.40 }
  
  const portfolio = await getPortfolio(portfolioId);
  const totalValue = portfolio.total_value;
  
  const positions = await getPositions(portfolioId);
  const currentAllocation = {};
  
  for (const pos of positions) {
    const symbol = await getAssetSymbol(pos.asset_id);
    currentAllocation[symbol] = pos.market_value / totalValue;
  }
  
  // Calculer trades nécessaires
  const trades = [];
  
  for (const [symbol, targetPct] of Object.entries(targetAllocation)) {
    const currentPct = currentAllocation[symbol] || 0;
    const diff = targetPct - currentPct;
    
    if (Math.abs(diff) > 0.01) { // > 1% difference
      const targetValue = totalValue * targetPct;
      const currentValue = totalValue * currentPct;
      const tradeValue = targetValue - currentValue;
      
      const assetId = await getAssetId(symbol);
      const price = await getCurrentPrice(assetId);
      const quantity = Math.abs(tradeValue / price);
      
      trades.push({
        asset_id: assetId,
        side: tradeValue > 0 ? 'BUY' : 'SELL',
        quantity: quantity,
        reason: 'REBALANCE'
      });
    }
  }
  
  // Exécuter trades
  for (const trade of trades) {
    await createOrder(portfolioId, trade);
  }
  
  return { 
    trades_executed: trades.length,
    target_allocation: targetAllocation,
    new_allocation: await getCurrentAllocation(portfolioId)
  };
}
```

---

### **12. 📉 PAS DE STRESS TESTING**

**Ce qui manque:**
```javascript
// Scénarios de crash
// Impact de crises (2008, COVID)
// Backtesting sur données historiques
```

**Stress Test:**
```javascript
async function stressTest(portfolioId) {
  const scenarios = [
    { name: '2008 Financial Crisis', changes: { stocks: -0.50, bonds: -0.10 } },
    { name: 'COVID-19 Crash', changes: { stocks: -0.35, oil: -0.60 } },
    { name: 'Tech Bubble Burst', changes: { tech: -0.70, other: -0.20 } },
    { name: 'Rate Hike Shock', changes: { bonds: -0.15, reits: -0.25 } }
  ];
  
  const results = [];
  
  for (const scenario of scenarios) {
    const positions = await getPositions(portfolioId);
    let simulatedValue = 0;
    
    for (const pos of positions) {
      const asset = await getAsset(pos.asset_id);
      const change = scenario.changes[asset.category] || -0.10;
      const newValue = pos.market_value * (1 + change);
      simulatedValue += newValue;
    }
    
    const currentValue = await getPortfolioValue(portfolioId);
    const loss = currentValue - simulatedValue;
    const lossPct = loss / currentValue;
    
    results.push({
      scenario: scenario.name,
      current_value: currentValue,
      simulated_value: simulatedValue,
      loss: loss,
      loss_percentage: lossPct,
      survives: simulatedValue > 0
    });
  }
  
  return results;
}
```

---

## 📊 RÉSUMÉ DES LACUNES MÉTIER

| Catégorie | Problème | Impact | Criticité |
|-----------|----------|--------|-----------|
| **Risk Management** | Pas de margin call | Portfolio peut être très négatif | 🔴 CRITIQUE |
| **Order Book** | Pas de slippage | Prix irréalistes sur gros ordres | 🔴 CRITIQUE |
| **Market Mechanics** | Pas de market hours | Trading 24/7 irrealistic | 🟠 MAJEUR |
| **Short Selling** | Mal implémenté | Pas de borrow fees, margin | 🟠 MAJEUR |
| **Fees** | Trop simplifiés | Pas de maker/taker, SEC fees | 🟠 MAJEUR |
| **Order Types** | Manquants | Pas de stop loss, trailing stop | 🟠 MAJEUR |
| **Price Discovery** | Random walk simple | Pas réaliste vs vrai marché | 🟡 MODÉRÉ |
| **Corporate Actions** | Absents | Pas de dividendes, splits | 🟡 MODÉRÉ |
| **Multi-Currency** | Absent | Tout en USD | 🟡 MODÉRÉ |
| **Risk Metrics** | Incomplets | Sharpe mal calculé, VaR absent | 🟡 MODÉRÉ |
| **Rebalancing** | Absent | Pas d'auto-rebalance | 🟢 MINEUR |
| **Stress Testing** | Absent | Pas de scénarios de crash | 🟢 MINEUR |

---

## 🎯 PRIORISATION DES FIXES

### **Phase 1: Sécurité et Intégrité (Urgent)**
1. ✅ Margin call / Liquidation automatique
2. ✅ Order book avec slippage
3. ✅ Protection flash crash

### **Phase 2: Réalisme Trading (Important)**
4. ✅ Market hours et circuit breakers
5. ✅ Short selling complet
6. ✅ Fee structure réaliste
7. ✅ Stop loss et trailing stops

### **Phase 3: Fonctionnalités Avancées**
8. ✅ Dividendes et splits
9. ✅ Multi-currency / Forex
10. ✅ Risk metrics avancés
11. ✅ Rebalancing automatique
12. ✅ Stress testing

---

## 💡 RECOMMANDATION FINALE

**Ton simulateur est bon pour:**
- ✅ Apprendre les bases du trading
- ✅ Tester des stratégies simples
- ✅ Comprendre buy/sell

**Mais pas réaliste pour:**
- ❌ Simuler un vrai broker
- ❌ Backtesting professionnel
- ❌ Gestion de risque avancée
- ❌ Trading institutionnel

**Pour le rendre production-ready:**
1. Implémente margin call (critique!)
2. Ajoute slippage et market depth
3. Ajoute market hours
4. Implémente short selling correct
5. Ajoute fee structure réelle

**Veux-tu que je t'aide à implémenter ces fonctionnalités?** 🚀

# 🤖 TRADING BOT BUILDER - GUIDE COMPLET

## ✅ CE QUI EST FAIT (BACKEND)

### **1. Base de Données** ✅
- `trading_bots` - Stocke les bots créés
- `bot_executions` - Historique des trades
- `backtest_results` - Résultats des backtests
- `bot_reviews` - Avis sur les bots (marketplace)
- `bot_templates` - Templates prédéfinis

### **2. Models Sequelize** ✅
- `trading-bot.model.js`
- `bot-execution.model.js`
- `backtest-result.model.js`

### **3. Services** ✅
- `bot-builder.service.js` - Logique des bots
- `backtesting.service.js` - Simulations historiques

### **4. API Routes** ✅
```
POST   /api/v1/bots                    - Créer un bot
GET    /api/v1/bots                    - Liste des bots
GET    /api/v1/bots/:botId             - Détails d'un bot
PUT    /api/v1/bots/:botId             - Modifier un bot
DELETE /api/v1/bots/:botId             - Supprimer un bot
POST   /api/v1/bots/:botId/start       - Démarrer un bot
POST   /api/v1/bots/:botId/stop        - Arrêter un bot
GET    /api/v1/bots/:botId/executions  - Historique trades
POST   /api/v1/bots/:botId/backtest    - Lancer backtest
GET    /api/v1/bots/:botId/backtests   - Résultats backtests
```

---

## 🎨 STRUCTURE D'UN BOT

### **Format JSON:**
```json
{
  "bot_id": "uuid",
  "name": "Mon Bot Scalping",
  "description": "Bot pour scalping BTC",
  "status": "ACTIVE",
  "config": {
    "nodes": [
      {
        "id": "trigger1",
        "type": "trigger",
        "data": {
          "name": "Prix > 100k",
          "condition": "price",
          "operator": ">",
          "value": 100000
        }
      },
      {
        "id": "action1",
        "type": "action",
        "data": {
          "name": "Acheter BTC",
          "type": "BUY",
          "quantity": 10,
          "symbol": "BTC"
        }
      }
    ],
    "edges": [
      {
        "source": "trigger1",
        "target": "action1"
      }
    ]
  },
  "settings": {
    "maxInvestment": 1000,
    "stopLoss": 5,
    "takeProfit": 10
  }
}
```

---

## 📝 TYPES DE NODES

### **1. TRIGGERS (Conditions)**
```javascript
{
  type: 'trigger',
  data: {
    condition: 'price' | 'volume' | 'rsi' | 'macd',
    operator: '>' | '<' | '>=' | '<=' | '==',
    value: number
  }
}
```

**Exemples:**
- Prix BTC > $100,000
- RSI < 30 (survente)
- Volume > 1,000,000
- MACD croise 0

### **2. ACTIONS (Trades)**
```javascript
{
  type: 'action',
  data: {
    type: 'BUY' | 'SELL',
    quantity: number,      // % du capital
    symbol: 'BTC' | 'ETH' | ...
  }
}
```

**Exemples:**
- Acheter 10% du capital en BTC
- Vendre tout l'ETH
- Acheter 500 USDT de BTC

### **3. CONDITIONS (Filtres)**
```javascript
{
  type: 'condition',
  data: {
    operator: 'AND' | 'OR',
    conditions: [...]
  }
}
```

---

## 🧪 BACKTESTING

### **Lancer un Backtest:**
```javascript
POST /api/v1/bots/:botId/backtest

Body:
{
  "startDate": "2024-01-01",
  "endDate": "2024-12-01",
  "initialCapital": 10000,
  "asset": "BTC"
}
```

### **Résultat:**
```json
{
  "backtest_id": "uuid",
  "total_trades": 45,
  "winning_trades": 28,
  "losing_trades": 17,
  "win_rate": 62.22,
  "total_profit": 3500,
  "total_loss": 1200,
  "net_profit": 2300,
  "roi": 23.00,
  "max_drawdown": 8.5,
  "sharpe_ratio": 1.45,
  "equity_curve": [
    { "date": "2024-01-01", "capital": 10000 },
    { "date": "2024-01-02", "capital": 10150 },
    ...
  ],
  "trades_data": [
    {
      "type": "BUY",
      "date": "2024-01-01T10:00:00Z",
      "symbol": "BTC",
      "price": 45000,
      "quantity": 0.22,
      "total": 9900
    },
    ...
  ]
}
```

---

## 🚀 INSTALLATION & DÉMARRAGE

### **1. Créer les tables:**
```bash
# Dans phpMyAdmin, exécuter:
finserve-api/database/bot-builder-tables.sql
```

### **2. Redémarrer le backend:**
```bash
cd finserve-api
npm start

# Vérifier dans la console:
✅ Bot Builder routes loaded
```

### **3. Tester l'API:**
```bash
# Créer un bot
curl -X POST http://localhost:3200/api/v1/bots \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mon Premier Bot",
    "description": "Bot de test",
    "config": {
      "nodes": [
        {
          "id": "t1",
          "type": "trigger",
          "data": {
            "name": "Prix > 50k",
            "condition": "price",
            "operator": ">",
            "value": 50000
          }
        },
        {
          "id": "a1",
          "type": "action",
          "data": {
            "name": "Acheter",
            "type": "BUY",
            "quantity": 10,
            "symbol": "BTC"
          }
        }
      ],
      "edges": [
        { "source": "t1", "target": "a1" }
      ]
    }
  }'

# Récupérer tous les bots
curl http://localhost:3200/api/v1/bots?userId=demo-user

# Lancer un backtest
curl -X POST http://localhost:3200/api/v1/bots/{botId}/backtest \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2024-01-01",
    "endDate": "2024-06-01",
    "initialCapital": 10000,
    "asset": "BTC"
  }'
```

---

## 📦 PROCHAINES ÉTAPES (FRONTEND)

### **Composants React à créer:**

1. **`BotBuilder.jsx`** - Interface drag & drop
   - Utiliser `react-flow` ou `react-dnd`
   - Palette de nodes (triggers, actions)
   - Canvas pour assembler

2. **`BotList.jsx`** - Liste des bots
   - Cards avec stats
   - Filtres (status, category)
   - Boutons start/stop

3. **`BotDashboard.jsx`** - Dashboard d'un bot
   - Stats en temps réel
   - Graphiques de performance
   - Historique des trades

4. **`BacktestResults.jsx`** - Résultats backtest
   - Equity curve (ApexCharts)
   - Métriques détaillées
   - Liste des trades

5. **`BotMarketplace.jsx`** - Marketplace
   - Bots publics
   - Ratings & reviews
   - Import/download

---

## 🎯 EXEMPLE D'UTILISATION

### **Créer un Bot "Scalping RSI":**

```javascript
const bot = {
  name: "Scalping RSI",
  description: "Achète quand RSI < 30, vend quand RSI > 70",
  config: {
    nodes: [
      // Trigger: RSI Survente
      {
        id: "rsi-low",
        type: "trigger",
        data: {
          name: "RSI < 30",
          condition: "rsi",
          operator: "<",
          value: 30
        }
      },
      // Action: Acheter
      {
        id: "buy-action",
        type: "action",
        data: {
          name: "Acheter 20%",
          type: "BUY",
          quantity: 20,
          symbol: "BTC"
        }
      },
      // Trigger: RSI Surachat
      {
        id: "rsi-high",
        type: "trigger",
        data: {
          name: "RSI > 70",
          condition: "rsi",
          operator: ">",
          value: 70
        }
      },
      // Action: Vendre
      {
        id: "sell-action",
        type: "action",
        data: {
          name: "Vendre tout",
          type: "SELL",
          quantity: 100,
          symbol: "BTC"
        }
      }
    ],
    edges: [
      { source: "rsi-low", target: "buy-action" },
      { source: "rsi-high", target: "sell-action" }
    ]
  },
  settings: {
    maxInvestment: 5000,
    stopLoss: 3,
    takeProfit: 5,
    maxConcurrentTrades: 1
  }
};
```

---

## 📊 MÉTRIQUES IMPORTANTES

- **Win Rate**: % de trades gagnants
- **ROI**: Return on Investment
- **Max Drawdown**: Perte maximale depuis un sommet
- **Sharpe Ratio**: Rendement ajusté au risque
- **Total Trades**: Nombre total de trades
- **Avg Trade Duration**: Durée moyenne d'un trade

---

## 🔥 FONCTIONNALITÉS AVANCÉES (À VENIR)

- ✅ Templates de bots prédéfinis
- ✅ Marketplace (partage/vente)
- ✅ Paper trading (simulation temps réel)
- ✅ Copy trading d'autres users
- ✅ Alertes par email/SMS
- ✅ Multi-assets (plusieurs cryptos)
- ✅ Stratégies complexes (ML/AI)
- ✅ Optimisation automatique
- ✅ Social features (likes, comments)
- ✅ Leaderboard des meilleurs bots

---

**LE BACKEND EST PRÊT! ON PASSE AU FRONTEND?** 🎨🚀

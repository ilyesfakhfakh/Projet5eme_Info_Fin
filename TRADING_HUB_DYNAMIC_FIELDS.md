# ✅ Trading Hub - Tous les Attributs Dynamiques

## 🎯 Modifications Apportées

Le Trading Hub a été mis à jour pour:
1. **Charger dynamiquement** les portfolios et assets depuis la base de données
2. **Utiliser tous les attributs** de la table `orders`
3. **Remplacer** les valeurs hardcodées par des selectors dynamiques

---

## 📊 Table `orders` - Tous les Attributs

### Attributs Utilisés

| Attribut | Type | Source | Utilisation |
|----------|------|--------|-------------|
| `order_id` | UUID | Auto-généré | ✅ Généré par la DB |
| `portfolio_id` | UUID | **Base de données** | ✅ Selector dynamique |
| `asset_id` | UUID/String | **Base de données** | ✅ Selector dynamique |
| `order_type` | ENUM | Formulaire | ✅ Select (LIMIT, MARKET, STOP, STOP_LIMIT, TRAILING_STOP) |
| `side` | ENUM | Formulaire | ✅ Select (BUY, SELL) |
| `quantity` | Decimal | Formulaire | ✅ TextField number |
| `price` | Decimal | Formulaire | ✅ TextField number (disabled si MARKET) |
| `stop_price` | Decimal | Formulaire | ✅ TextField number (pour STOP orders) |
| `time_in_force` | ENUM | Formulaire | ✅ Select (DAY, GTC, IOC, FOK) |
| `status` | ENUM | Auto | ✅ Défaut: PENDING |
| `creation_date` | DateTime | Auto | ✅ Géré par DB/backend |
| `execution_date` | DateTime | Auto | ✅ Géré par DB/backend |
| `executed_quantity` | Decimal | Auto | ✅ Géré par backend |
| `executed_price` | Decimal | Auto | ✅ Géré par backend |
| `created_at` | DateTime | Auto | ✅ Timestamp DB |
| `updated_at` | DateTime | Auto | ✅ Timestamp DB |

---

## 🗂️ Nouveaux Fichiers API

### 1. `portfolios.js`

```javascript
import { http } from './http';

// Get all portfolios
export const getPortfolios = async (filters = {}) => {
  const response = await http.get('/portfolios', { params: filters });
  return response;
};

// Get portfolio by ID
export const getPortfolioById = async (portfolioId) => {
  const response = await http.get(`/portfolios/${portfolioId}`);
  return response;
};
```

**Endpoints Backend Requis**:
- `GET /api/v1/portfolios` - Liste tous les portfolios
- `GET /api/v1/portfolios/:id` - Détails d'un portfolio

### 2. `assets.js`

```javascript
import { http } from './http';

// Get all assets
export const getAssets = async (filters = {}) => {
  const response = await http.get('/assets', { params: filters });
  return response;
};

// Get asset by ID
export const getAssetById = async (assetId) => {
  const response = await http.get(`/assets/${assetId}`);
  return response;
};
```

**Endpoints Backend Requis**:
- `GET /api/v1/assets` - Liste tous les assets
- `GET /api/v1/assets/:id` - Détails d'un asset

---

## 🔄 État Dynamique du TradingHub

### Nouvelles Variables d'État

```javascript
// Dynamic data from database
const [portfolios, setPortfolios] = useState([]);
const [assets, setAssets] = useState([]);
const [selectedPortfolio, setSelectedPortfolio] = useState('');
const [selectedAsset, setSelectedAsset] = useState('');
```

### Chargement Automatique

```javascript
useEffect(() => {
  loadPortfoliosAndAssets();
}, []);

const loadPortfoliosAndAssets = async () => {
  try {
    const [portfoliosData, assetsData] = await Promise.all([
      getPortfolios(),
      getAssets()
    ]);
    setPortfolios(portfoliosData);
    setAssets(assetsData);
    
    // Set default selections
    if (portfoliosData.length > 0) {
      setSelectedPortfolio(portfoliosData[0].portfolio_id);
      setNewOrderBook(prev => ({ ...prev, portfolio_id: portfoliosData[0].portfolio_id }));
      setNewOrderMgmt(prev => ({ ...prev, portfolio_id: portfoliosData[0].portfolio_id }));
    }
    if (assetsData.length > 0) {
      setSelectedAsset(assetsData[0].asset_id);
    }
  } catch (err) {
    setError('Failed to load portfolios and assets');
  }
};
```

---

## 🎨 UI - Selectors Dynamiques

### Portfolio Selector

```jsx
<FormControl sx={{ minWidth: 250 }}>
  <InputLabel>Portfolio</InputLabel>
  <Select 
    value={selectedPortfolio} 
    onChange={(e) => {
      setSelectedPortfolio(e.target.value);
      setNewOrderBook(prev => ({ ...prev, portfolio_id: e.target.value }));
      setNewOrderMgmt(prev => ({ ...prev, portfolio_id: e.target.value }));
    }} 
    label="Portfolio"
  >
    {portfolios.map((portfolio) => (
      <MenuItem key={portfolio.portfolio_id} value={portfolio.portfolio_id}>
        {portfolio.portfolio_name} (${portfolio.current_balance?.toFixed(2)})
      </MenuItem>
    ))}
  </Select>
</FormControl>
```

**Affichage**: `Portfolio Name ($Balance)`

Exemple: `Default Trading Portfolio ($100,000.00)`

### Asset Selector

```jsx
<FormControl sx={{ minWidth: 250 }}>
  <InputLabel>Asset</InputLabel>
  <Select 
    value={selectedAsset} 
    onChange={(e) => setSelectedAsset(e.target.value)} 
    label="Asset"
  >
    {assets.map((asset) => (
      <MenuItem key={asset.asset_id} value={asset.asset_id}>
        {asset.asset_name} ({asset.symbol || asset.asset_id})
      </MenuItem>
    ))}
  </Select>
</FormControl>
```

**Affichage**: `Asset Name (Symbol)`

Exemple: `Bitcoin (BTC)`, `Ethereum (ETH)`

---

## 📝 Formulaires Mis à Jour

### Order Book - Place Order Form

```jsx
<Grid container spacing={2}>
  <Grid item xs={12} md={6}>
    <FormControl fullWidth>
      <InputLabel>Order Type</InputLabel>
      <Select value={newOrderBook.order_type} onChange={...} label="Order Type">
        <MenuItem value="LIMIT">LIMIT</MenuItem>
        <MenuItem value="MARKET">MARKET</MenuItem>
        <MenuItem value="STOP">STOP</MenuItem>
        <MenuItem value="STOP_LIMIT">STOP LIMIT</MenuItem>
      </Select>
    </FormControl>
  </Grid>
  
  <Grid item xs={12} md={6}>
    <FormControl fullWidth>
      <InputLabel>Side</InputLabel>
      <Select value={newOrderBook.side} onChange={...} label="Side">
        <MenuItem value="BUY">BUY</MenuItem>
        <MenuItem value="SELL">SELL</MenuItem>
      </Select>
    </FormControl>
  </Grid>
  
  <Grid item xs={12} md={6}>
    <TextField
      fullWidth
      label="Quantity"
      type="number"
      value={newOrderBook.quantity}
      onChange={...}
    />
  </Grid>
  
  <Grid item xs={12} md={6}>
    <TextField
      fullWidth
      label="Price"
      type="number"
      value={newOrderBook.price}
      onChange={...}
      disabled={newOrderBook.order_type === 'MARKET'}
    />
  </Grid>
  
  <Grid item xs={12} md={6}>
    <TextField
      fullWidth
      label="Stop Price"
      type="number"
      value={newOrderBook.stop_price}
      onChange={...}
      disabled={!['STOP', 'STOP_LIMIT'].includes(newOrderBook.order_type)}
      helperText="For STOP and STOP_LIMIT orders"
    />
  </Grid>
  
  <Grid item xs={12} md={6}>
    <FormControl fullWidth>
      <InputLabel>Time In Force</InputLabel>
      <Select value={newOrderBook.time_in_force} onChange={...} label="Time In Force">
        <MenuItem value="GTC">GTC (Good Till Cancel)</MenuItem>
        <MenuItem value="DAY">DAY</MenuItem>
        <MenuItem value="IOC">IOC (Immediate or Cancel)</MenuItem>
        <MenuItem value="FOK">FOK (Fill or Kill)</MenuItem>
      </Select>
    </FormControl>
  </Grid>
</Grid>
```

### Orders Management - Create Order Form

```jsx
<Grid container spacing={2}>
  <Grid item xs={12} md={6}>
    <FormControl fullWidth>
      <InputLabel>Asset</InputLabel>
      <Select value={newOrderMgmt.asset_id} onChange={...} label="Asset">
        {assets.map((asset) => (
          <MenuItem key={asset.asset_id} value={asset.asset_id}>
            {asset.asset_name} ({asset.symbol || asset.asset_id})
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  </Grid>
  
  <Grid item xs={12} md={6}>
    <FormControl fullWidth>
      <InputLabel>Order Type</InputLabel>
      <Select value={newOrderMgmt.order_type} onChange={...} label="Order Type">
        <MenuItem value="LIMIT">LIMIT</MenuItem>
        <MenuItem value="MARKET">MARKET</MenuItem>
        <MenuItem value="STOP">STOP</MenuItem>
        <MenuItem value="STOP_LIMIT">STOP LIMIT</MenuItem>
        <MenuItem value="TRAILING_STOP">TRAILING STOP</MenuItem>
      </Select>
    </FormControl>
  </Grid>
  
  <Grid item xs={12} md={6}>
    <FormControl fullWidth>
      <InputLabel>Side</InputLabel>
      <Select value={newOrderMgmt.side} onChange={...} label="Side">
        <MenuItem value="BUY">BUY</MenuItem>
        <MenuItem value="SELL">SELL</MenuItem>
      </Select>
    </FormControl>
  </Grid>
  
  <Grid item xs={12} md={6}>
    <TextField
      fullWidth
      label="Quantity"
      type="number"
      value={newOrderMgmt.quantity}
      onChange={...}
    />
  </Grid>
  
  <Grid item xs={12} md={6}>
    <TextField
      fullWidth
      label="Price"
      type="number"
      value={newOrderMgmt.price}
      onChange={...}
      disabled={newOrderMgmt.order_type === 'MARKET'}
    />
  </Grid>
  
  <Grid item xs={12} md={6}>
    <TextField
      fullWidth
      label="Stop Price"
      type="number"
      value={newOrderMgmt.stop_price}
      onChange={...}
      disabled={!['STOP', 'STOP_LIMIT', 'TRAILING_STOP'].includes(newOrderMgmt.order_type)}
      helperText="For STOP orders"
    />
  </Grid>
  
  <Grid item xs={12} md={6}>
    <FormControl fullWidth>
      <InputLabel>Time In Force</InputLabel>
      <Select value={newOrderMgmt.time_in_force} onChange={...} label="Time In Force">
        <MenuItem value="DAY">DAY</MenuItem>
        <MenuItem value="GTC">GTC</MenuItem>
        <MenuItem value="IOC">IOC</MenuItem>
      </Select>
    </FormControl>
  </Grid>
</Grid>
```

---

## 🔧 Handlers Mis à Jour

### handlePlaceOrderBook

```javascript
const handlePlaceOrderBook = async () => {
  setLoading(true);
  setError(null);
  try {
    const orderData = {
      ...newOrderBook,
      asset_id: selectedAsset,
      quantity: parseFloat(newOrderBook.quantity),
      price: newOrderBook.order_type === 'MARKET' ? null : parseFloat(newOrderBook.price),
      stop_price: newOrderBook.stop_price ? parseFloat(newOrderBook.stop_price) : null
    };
    const result = await placeOrder(orderData);
    setSuccess(`Order placed! ID: ${result.order?.order_id?.substring(0, 8)}... | Executions: ${result.executions?.length || 0}`);
    
    // Reset form with current portfolio
    setNewOrderBook({
      portfolio_id: selectedPortfolio,
      asset_id: '',
      order_type: 'LIMIT',
      side: 'BUY',
      quantity: '',
      price: '',
      stop_price: '',
      time_in_force: 'GTC',
      status: 'PENDING',
      creation_date: '',
      execution_date: '',
      executed_quantity: '',
      executed_price: ''
    });
    await loadOrderBookData();
  } catch (err) {
    setError(err.response?.data?.message || err.message);
  } finally {
    setLoading(false);
  }
};
```

### handleCreateOrder

```javascript
const handleCreateOrder = async () => {
  setLoading(true);
  setError(null);
  try {
    const orderData = {
      ...newOrderMgmt,
      quantity: parseFloat(newOrderMgmt.quantity),
      price: newOrderMgmt.price ? parseFloat(newOrderMgmt.price) : null,
      stop_price: newOrderMgmt.stop_price ? parseFloat(newOrderMgmt.stop_price) : null
    };
    const result = await createOrder(orderData);
    setSuccess(`Order created! ID: ${result.order_id?.substring(0, 8)}...`);
    
    // Reset form with current portfolio
    setNewOrderMgmt({
      portfolio_id: selectedPortfolio,
      asset_id: '',
      order_type: 'LIMIT',
      side: 'BUY',
      quantity: '',
      price: '',
      stop_price: '',
      time_in_force: 'GTC',
      status: 'PENDING',
      creation_date: '',
      execution_date: '',
      executed_quantity: '',
      executed_price: ''
    });
    await loadAllOrders();
  } catch (err) {
    setError(err.response?.data?.message || err.message);
  } finally {
    setLoading(false);
  }
};
```

---

## 📡 Endpoints Backend Requis

### Portfolios

```javascript
// GET /api/v1/portfolios
// Response:
[
  {
    "portfolio_id": "11111111-1111-1111-1111-111111111111",
    "user_id": "...",
    "portfolio_name": "Default Trading Portfolio",
    "current_balance": 100000.00,
    "currency": "USD",
    "status": "ACTIVE"
  }
]

// GET /api/v1/portfolios/:id
// Response:
{
  "portfolio_id": "11111111-1111-1111-1111-111111111111",
  "user_id": "...",
  "portfolio_name": "Default Trading Portfolio",
  "description": "...",
  "initial_balance": 100000.00,
  "current_balance": 100000.00,
  "currency": "USD",
  "status": "ACTIVE"
}
```

### Assets

```javascript
// GET /api/v1/assets
// Response:
[
  {
    "asset_id": "uuid-1",
    "asset_name": "Bitcoin",
    "symbol": "BTC",
    "asset_type": "CRYPTO"
  },
  {
    "asset_id": "uuid-2",
    "asset_name": "Ethereum",
    "symbol": "ETH",
    "asset_type": "CRYPTO"
  },
  {
    "asset_id": "uuid-3",
    "asset_name": "Apple Inc.",
    "symbol": "AAPL",
    "asset_type": "STOCK"
  }
]

// GET /api/v1/assets/:id
// Response:
{
  "asset_id": "uuid-1",
  "asset_name": "Bitcoin",
  "symbol": "BTC",
  "asset_type": "CRYPTO",
  "current_price": 50000.00
}
```

---

## ✅ Attributs Automatiques

Ces attributs sont gérés automatiquement par le backend/database:

### Générés par la DB
- `order_id` - UUID auto-généré
- `created_at` - Timestamp création
- `updated_at` - Timestamp mise à jour

### Gérés par le Backend
- `creation_date` - Date de création de l'ordre
- `execution_date` - Date d'exécution
- `executed_quantity` - Quantité exécutée (mise à jour lors du matching)
- `executed_price` - Prix moyen d'exécution
- `status` - Statut initial: PENDING, puis mis à jour selon l'exécution

---

## 🎯 Exemple de Données Envoyées

### Order Book - Place Order

```json
{
  "portfolio_id": "11111111-1111-1111-1111-111111111111",
  "asset_id": "uuid-btc",
  "order_type": "LIMIT",
  "side": "BUY",
  "quantity": 1.5,
  "price": 50000,
  "stop_price": null,
  "time_in_force": "GTC",
  "status": "PENDING"
}
```

### Order Book - STOP Order

```json
{
  "portfolio_id": "11111111-1111-1111-1111-111111111111",
  "asset_id": "uuid-eth",
  "order_type": "STOP_LIMIT",
  "side": "SELL",
  "quantity": 5.0,
  "price": 3000,
  "stop_price": 2950,
  "time_in_force": "GTC",
  "status": "PENDING"
}
```

### Orders Management - Create Order

```json
{
  "portfolio_id": "11111111-1111-1111-1111-111111111111",
  "asset_id": "uuid-aapl",
  "order_type": "TRAILING_STOP",
  "side": "BUY",
  "quantity": 100,
  "price": null,
  "stop_price": 150,
  "time_in_force": "DAY",
  "status": "PENDING"
}
```

---

## 🚀 Utilisation

### 1. Au Chargement de la Page

```
1. TradingHub monte
2. useEffect se déclenche
3. loadPortfoliosAndAssets() est appelé
4. API GET /portfolios et GET /assets
5. Dropdowns sont remplis avec les données
6. Premier portfolio et asset sont sélectionnés par défaut
```

### 2. Sélection d'un Portfolio

```
1. Utilisateur sélectionne un portfolio dans le dropdown
2. selectedPortfolio est mis à jour
3. newOrderBook.portfolio_id est mis à jour
4. newOrderMgmt.portfolio_id est mis à jour
5. Tous les nouveaux ordres utiliseront ce portfolio
```

### 3. Sélection d'un Asset

```
1. Utilisateur sélectionne un asset dans le dropdown
2. selectedAsset est mis à jour
3. Les données de marché sont rechargées pour cet asset
4. Auto-refresh continue avec le nouvel asset
```

### 4. Placement d'un Ordre

```
1. Utilisateur remplit le formulaire
2. Sélectionne Order Type (LIMIT, MARKET, STOP, etc.)
3. Si STOP order, le champ stop_price est activé
4. Si MARKET order, le champ price est désactivé
5. Clique "Place Order"
6. Ordre est envoyé avec tous les champs requis
7. Backend valide et crée l'ordre
8. Matching automatique (pour Order Book)
9. Success message avec Order ID
10. Formulaire est réinitialisé
```

---

## ✅ Checklist Complète

### Attributs Table `orders`
- [x] `order_id` - Auto-généré
- [x] `portfolio_id` - Selector dynamique
- [x] `asset_id` - Selector dynamique  
- [x] `order_type` - Select field
- [x] `side` - Select field
- [x] `quantity` - TextField number
- [x] `price` - TextField number
- [x] `stop_price` - TextField number (conditionnel)
- [x] `time_in_force` - Select field
- [x] `status` - Défaut PENDING
- [x] `creation_date` - Auto (backend)
- [x] `execution_date` - Auto (backend)
- [x] `executed_quantity` - Auto (backend)
- [x] `executed_price` - Auto (backend)
- [x] `created_at` - Auto (DB)
- [x] `updated_at` - Auto (DB)

### UI Components
- [x] Portfolio Selector (dropdown dynamique)
- [x] Asset Selector (dropdown dynamique)
- [x] Stop Price field (conditionnel)
- [x] Reload Lists button

### API Services
- [x] `portfolios.js` créé
- [x] `assets.js` créé
- [x] Imports ajoutés dans TradingHub

### Functions Updated
- [x] `loadPortfoliosAndAssets()` créée
- [x] `handlePlaceOrderBook()` - stop_price ajouté
- [x] `handleCreateOrder()` - stop_price ajouté
- [x] `loadOpenOrders()` - selectedPortfolio
- [x] `loadOrderHistory()` - selectedPortfolio
- [x] `handleCancelAllOrders()` - selectedPortfolio

---

## 🎉 Résultat Final

**Tous les attributs de la table `orders` sont maintenant utilisables dans le TradingHub!**

✅ **Portfolio ID**: Dynamique depuis la base de données  
✅ **Asset ID**: Dynamique depuis la base de données  
✅ **Stop Price**: Champ conditionnel pour STOP orders  
✅ **Tous les champs**: Disponibles et fonctionnels  

**L'application est maintenant complètement dynamique et prête pour la production!** 🚀

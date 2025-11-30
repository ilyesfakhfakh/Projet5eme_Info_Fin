# ✅ Manual ID Input - Portfolio & Asset

## 🎯 Nouvelle Fonctionnalité

Vous pouvez maintenant **saisir manuellement** les `portfolio_id` et `asset_id` au lieu de seulement les sélectionner dans les dropdowns!

---

## 🎨 Interface

### Mode Toggle Button

Chaque selector (Portfolio et Asset) a maintenant un **bouton "Manual"** à côté:

```
┌─────────────────────────────────┐  ┌────────┐
│  Portfolio Dropdown             │  │ Manual │
└─────────────────────────────────┘  └────────┘
```

**Cliquer "Manual"** transforme le dropdown en champ de texte:

```
┌─────────────────────────────────┐  ┌────────┐
│  Portfolio ID (Manual)          │  │ Select │
│  [Paste or type Portfolio ID]  │  └────────┘
└─────────────────────────────────┘
```

---

## 📋 Utilisation

### Portfolio ID

#### Mode Select (Défaut)
1. Dropdown affiche la liste des portfolios depuis la DB
2. Sélectionnez un portfolio dans la liste
3. Format affiché: `Portfolio Name ($Balance)`

#### Mode Manual
1. Cliquez sur le bouton **"Manual"**
2. Le dropdown devient un TextField
3. **Tapez ou collez** le `portfolio_id` (UUID)
4. Exemple: `11111111-1111-1111-1111-111111111111`

**Helper Text**: "Paste or type Portfolio ID"

### Asset ID

#### Mode Select (Défaut)
1. Dropdown affiche la liste des assets depuis la DB
2. Sélectionnez un asset dans la liste
3. Format affiché: `Asset Name (Symbol)`

#### Mode Manual
1. Cliquez sur le bouton **"Manual"**
2. Le dropdown devient un TextField
3. **Tapez** soit:
   - L'`asset_id` (UUID): `uuid-btc-123`
   - Le symbole: `BTC`, `ETH`, `AAPL`

**Helper Text**: "Type Asset ID or Symbol"

---

## 🔄 Workflow Complet

### Scénario 1: Utiliser un Portfolio Existant

1. **Mode Select** (défaut)
2. Choisir "Default Trading Portfolio ($100,000.00)"
3. Le `portfolio_id` est automatiquement utilisé
4. ✅ Créer des ordres avec ce portfolio

### Scénario 2: Saisir un Portfolio ID Manuellement

1. Cliquer **"Manual"** à côté de Portfolio
2. Coller: `22222222-2222-2222-2222-222222222222`
3. Le `portfolio_id` est utilisé directement
4. ✅ Créer des ordres avec ce portfolio (même s'il n'est pas dans la liste)

### Scénario 3: Saisir un Asset Manuellement

1. Cliquer **"Manual"** à côté de Asset
2. Taper: `BTC` ou `ETH`
3. L'`asset_id` est utilisé directement
4. ✅ Voir les données de marché pour cet asset

---

## 💡 Cas d'Usage

### Pourquoi Utiliser le Mode Manual?

#### 1. **Portfolio Non Chargé**
```
Problème: Le portfolio n'apparaît pas dans la liste
Solution: Saisir manuellement son UUID
```

#### 2. **Tester avec des IDs Spécifiques**
```
Problème: Vouloir tester un portfolio/asset particulier
Solution: Coller directement l'ID sans chercher dans la liste
```

#### 3. **IDs de Test**
```
Problème: Utiliser des IDs hardcodés pour les tests
Solution: 
- Portfolio: 11111111-1111-1111-1111-111111111111
- Asset: BTC, ETH, AAPL
```

#### 4. **Assets avec Symbole Direct**
```
Problème: Vouloir utiliser "BTC" au lieu de l'UUID
Solution: Mode manual → Taper "BTC" directement
```

---

## 🎯 État Synchronisé

Les valeurs saisies manuellement sont **synchronisées** avec tout le système:

### Portfolio ID Manual

```javascript
// Quand vous tapez dans le champ manual
setManualPortfolioId(value)
setSelectedPortfolio(value)
setNewOrderBook({ ...prev, portfolio_id: value })
setNewOrderMgmt({ ...prev, portfolio_id: value })
setOrdersFilter({ ...prev, portfolio_id: value })
```

**Résultat**: Tous les formulaires utilisent le portfolio saisi manuellement!

### Asset ID Manual

```javascript
// Quand vous tapez dans le champ manual
setManualAssetId(value)
setSelectedAsset(value)
```

**Résultat**: Toutes les requêtes de marché utilisent l'asset saisi!

---

## 🎨 Design

### Bouton Toggle

**Mode Select** (défaut):
```
┌──────────┐
│  Manual  │  ← Bouton outlined
└──────────┘
```

**Mode Manual** (actif):
```
┌──────────┐
│  Select  │  ← Bouton contained (rempli)
└──────────┘
```

### TextField Manual

```
┌─────────────────────────────────────────────┐
│  Portfolio ID (Manual)                      │
│  [11111111-1111-1111-1111-111111111111]    │
│  Paste or type Portfolio ID                │
└─────────────────────────────────────────────┘
```

**Caractéristiques**:
- Label: "Portfolio ID (Manual)" ou "Asset ID (Manual)"
- Placeholder: Instructions claires
- Helper Text: Guide d'utilisation
- Full width: Prend toute la largeur disponible

---

## 📱 Layout Responsive

### Desktop (md et plus grand)

```
┌─────────────────────────┬─────────────────────────┬──────────┐
│  Portfolio Selector     │  Asset Selector         │ Refresh  │
│  [Dropdown or TextField]│  [Dropdown or TextField]│ Button   │
└─────────────────────────┴─────────────────────────┴──────────┘
     5 colonnes (md=5)         5 colonnes (md=5)      2 cols
```

### Mobile (xs)

```
┌──────────────────────────────────┐
│  Portfolio Selector              │
│  [Dropdown or TextField]         │
└──────────────────────────────────┘
     12 colonnes (xs=12)

┌──────────────────────────────────┐
│  Asset Selector                  │
│  [Dropdown or TextField]         │
└──────────────────────────────────┘
     12 colonnes (xs=12)

┌──────────────────────────────────┐
│  Refresh Button                  │
└──────────────────────────────────┘
     12 colonnes (xs=12)
```

---

## 🔧 Code Technique

### État Ajouté

```javascript
// Manual input mode
const [manualPortfolioMode, setManualPortfolioMode] = useState(false);
const [manualAssetMode, setManualAssetMode] = useState(false);
const [manualPortfolioId, setManualPortfolioId] = useState('');
const [manualAssetId, setManualAssetId] = useState('');
```

### Composant Portfolio Selector

```jsx
<Stack direction="row" spacing={1} alignItems="center">
  <Box sx={{ flexGrow: 1 }}>
    {!manualPortfolioMode ? (
      <FormControl fullWidth>
        <InputLabel>Portfolio</InputLabel>
        <Select 
          value={selectedPortfolio} 
          onChange={(e) => {
            setSelectedPortfolio(e.target.value);
            setNewOrderBook(prev => ({ ...prev, portfolio_id: e.target.value }));
            setNewOrderMgmt(prev => ({ ...prev, portfolio_id: e.target.value }));
            setOrdersFilter(prev => ({ ...prev, portfolio_id: e.target.value }));
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
    ) : (
      <TextField
        fullWidth
        label="Portfolio ID (Manual)"
        value={manualPortfolioId}
        onChange={(e) => {
          setManualPortfolioId(e.target.value);
          setSelectedPortfolio(e.target.value);
          setNewOrderBook(prev => ({ ...prev, portfolio_id: e.target.value }));
          setNewOrderMgmt(prev => ({ ...prev, portfolio_id: e.target.value }));
          setOrdersFilter(prev => ({ ...prev, portfolio_id: e.target.value }));
        }}
        placeholder="Enter Portfolio UUID"
        helperText="Paste or type Portfolio ID"
      />
    )}
  </Box>
  <Button
    variant={manualPortfolioMode ? "contained" : "outlined"}
    onClick={() => setManualPortfolioMode(!manualPortfolioMode)}
    size="small"
  >
    {manualPortfolioMode ? "Select" : "Manual"}
  </Button>
</Stack>
```

### Composant Asset Selector

```jsx
<Stack direction="row" spacing={1} alignItems="center">
  <Box sx={{ flexGrow: 1 }}>
    {!manualAssetMode ? (
      <FormControl fullWidth>
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
    ) : (
      <TextField
        fullWidth
        label="Asset ID (Manual)"
        value={manualAssetId}
        onChange={(e) => {
          setManualAssetId(e.target.value);
          setSelectedAsset(e.target.value);
        }}
        placeholder="Enter Asset ID or Symbol (e.g., BTC, ETH)"
        helperText="Type Asset ID or Symbol"
      />
    )}
  </Box>
  <Button
    variant={manualAssetMode ? "contained" : "outlined"}
    onClick={() => setManualAssetMode(!manualAssetMode)}
    size="small"
  >
    {manualAssetMode ? "Select" : "Manual"}
  </Button>
</Stack>
```

---

## ✅ Avantages

### 1. **Flexibilité**
- ✅ Choisir dans la liste OU saisir manuellement
- ✅ Switcher facilement entre les deux modes

### 2. **Rapidité**
- ✅ Coller directement un UUID
- ✅ Taper un symbole court (BTC au lieu d'un UUID)

### 3. **Test & Debug**
- ✅ Utiliser des IDs de test rapidement
- ✅ Tester des portfolios/assets non listés

### 4. **UX Améliorée**
- ✅ Bouton toggle clair
- ✅ Helper text pour guider
- ✅ Placeholder descriptif

---

## 🎯 Exemples d'Utilisation

### Exemple 1: Portfolio Hardcodé

**Besoin**: Utiliser le portfolio par défaut `11111111-1111-1111-1111-111111111111`

**Steps**:
1. Cliquer **"Manual"** à côté de Portfolio
2. Coller: `11111111-1111-1111-1111-111111111111`
3. ✅ Tous les ordres utilisent ce portfolio

### Exemple 2: Asset BTC

**Besoin**: Trader du Bitcoin

**Option A - Select**:
1. Ouvrir le dropdown Asset
2. Choisir "Bitcoin (BTC)"
3. ✅ Asset sélectionné

**Option B - Manual**:
1. Cliquer **"Manual"** à côté de Asset
2. Taper: `BTC`
3. ✅ Asset sélectionné (plus rapide!)

### Exemple 3: Mix des Deux

**Besoin**: Portfolio de la liste + Asset manuel

**Steps**:
1. Portfolio: Laisser en mode Select → Choisir dans la liste
2. Asset: Passer en mode Manual → Taper `ETH`
3. ✅ Mix parfait!

---

## 🚀 Impact sur les Fonctionnalités

### Order Book Controller

**Place Order Tab**:
- ✅ Utilise `selectedPortfolio` (manuel ou sélectionné)
- ✅ Utilise `selectedAsset` (manuel ou sélectionné)

### Orders Management Controller

**Create Order Tab**:
- ✅ `portfolio_id` = manuel ou sélectionné
- ✅ `asset_id` = manuel ou sélectionné (ou du dropdown dans le form)

**All Orders Tab**:
- ✅ Filtres utilisent `selectedPortfolio`

**Open Orders & History**:
- ✅ Requêtes utilisent `selectedPortfolio`

---

## 🎨 UI States

### État Initial
```
Portfolio: [Select Mode] → Liste vide ou avec portfolios
Asset: [Select Mode] → Liste vide ou avec assets
```

### Après Chargement
```
Portfolio: [Select Mode] → "Default Trading Portfolio ($100,000.00)"
Asset: [Select Mode] → "Bitcoin (BTC)"
```

### Mode Manual Activé
```
Portfolio: [Manual Mode] → TextField vide
Asset: [Manual Mode] → TextField vide
```

### Mode Manual avec Valeur
```
Portfolio: [Manual Mode] → "11111111-1111-1111-1111-111111111111"
Asset: [Manual Mode] → "BTC"
```

---

## ✅ Checklist

- [x] État pour mode manual ajouté
- [x] État pour valeurs manuelles ajouté
- [x] Bouton toggle Portfolio
- [x] Bouton toggle Asset
- [x] TextField Portfolio avec helper text
- [x] TextField Asset avec helper text
- [x] Synchronisation avec tous les formulaires
- [x] Layout responsive (Grid)
- [x] Bouton variant change selon le mode
- [x] Placeholder descriptifs
- [x] Full width sur TextFields

---

## 🎉 Résultat

**Vous pouvez maintenant**:
- ✅ **Sélectionner** dans la liste (mode facile)
- ✅ **Saisir manuellement** les IDs (mode rapide/test)
- ✅ **Switcher** entre les deux modes à tout moment
- ✅ **Taper** des symboles courts comme "BTC" au lieu d'UUIDs

**Flexibilité maximale pour tous les cas d'usage!** 🚀

---

## 📝 Notes Techniques

### Validation
- Aucune validation stricte sur les IDs saisis
- Le backend validera si le portfolio/asset existe
- Erreurs affichées via les Alerts si ID invalide

### Performance
- Pas d'appel API lors de la saisie manuelle
- Les valeurs sont utilisées directement
- Pas de debounce nécessaire

### Compatibilité
- Fonctionne avec tous les onglets du Trading Hub
- Compatible Order Book Controller ET Orders Management
- Pas d'impact sur les fonctionnalités existantes

# 🌱 Guide d'Utilisation des Scripts de Seed

## 📋 Scripts Disponibles

### 1. **seed-all-data.js** (RECOMMANDÉ)
Script principal qui exécute tous les autres scripts dans le bon ordre.

```bash
cd finserve-api/scripts
node seed-all-data.js
```

### 2. **seed-market-data.js**
Remplit uniquement les tables du module Market.

```bash
cd finserve-api/scripts
node seed-market-data.js
```

### 3. **seed-news-data.js**
Remplit uniquement les tables du module News.

```bash
cd finserve-api/scripts
node seed-news-data.js
```

---

## 🚀 Utilisation Rapide

### Prérequis
1. **Serveur API lancé**: Assurez-vous que votre API tourne sur `http://localhost:5000`
2. **Base de données créée**: Les tables doivent exister

### Commandes Rapides

#### Tout remplir en une commande:
```bash
cd c:\Users\Marwan\Desktop\ccccccccccccccc\Projet5eme_Info_Fin\finserve-api\scripts
node seed-all-data.js
```

#### Ou étape par étape:

**Étape 1 - Market Data:**
```bash
node seed-market-data.js
```

**Étape 2 - News Data:**
```bash
node seed-news-data.js
```

---

## 📊 Données Créées

### Module MARKET

#### Assets (12 assets)
- **Stocks**: AAPL, GOOGL, MSFT, TSLA
- **Crypto**: BTC, ETH
- **Forex**: EUR/USD, GBP/USD
- **Commodities**: GOLD, OIL
- **Index**: SPY
- **Bonds**: US10Y

#### Market Data
- **~160 entrées** (20 par asset × 8 assets)
- Prix, OHLC, Volume, Changes
- Données sur 20 jours

#### Historical Data
- **~180 entrées** (30 par asset × 6 assets)
- Données OHLC quotidiennes
- 90 jours d'historique

#### Price Alerts
- **~25 alertes** (2-3 par asset × 10 assets)
- Types: ABOVE, BELOW, PERCENTAGE_CHANGE
- Mix d'alertes actives/inactives/déclenchées

---

### Module NEWS

#### News Articles (8 articles)
- Catégories: MARKET, ECONOMIC, COMPANY, POLITICAL
- Sentiments: POSITIVE, NEUTRAL, NEGATIVE
- Impact: LOW, MEDIUM, HIGH
- Avec auteurs et sources

#### Economic Events (10 événements)
- Pays: USA, EU, UK, China, Japan
- Importance: LOW, MEDIUM, HIGH
- Catégories: Employment, GDP, Interest Rate, Inflation, etc.
- Valeurs: Previous, Forecast, Actual

#### Market News (10 news)
- Priorités: LOW, MEDIUM, HIGH, URGENT
- Avec tags multiples
- Timestamps récents (dernières 24h)

---

## 🔍 Vérification

### Vérifier les données créées:

**API Endpoints:**
```bash
# Assets
curl http://localhost:5000/api/assets

# Market Data
curl http://localhost:5000/api/market-data

# News Articles
curl http://localhost:5000/api/news-articles

# Economic Events
curl http://localhost:5000/api/economic-events

# Market News
curl http://localhost:5000/api/market-news
```

**Interface Web:**
- Market: http://localhost:3000/free/modules/market
- News: http://localhost:3000/free/modules/news

---

## ⚠️ Résolution de Problèmes

### Erreur "Cannot connect to API"
```bash
# Vérifier que l'API tourne
cd finserve-api
npm start
```

### Erreur "Table doesn't exist"
```bash
# Créer les tables d'abord
cd finserve-api
node create-missing-tables.js
```

### Erreur "Duplicate entry"
C'est normal! Les scripts ignorent les doublons automatiquement.

### Port déjà utilisé
Modifiez `API_BASE_URL` dans les scripts:
```javascript
const API_BASE_URL = 'http://localhost:VOTRE_PORT/api';
```

---

## 🎯 Ordre d'Exécution Recommandé

1. **Démarrer l'API** ✅
   ```bash
   cd finserve-api
   npm start
   ```

2. **Vérifier les tables** ✅
   ```bash
   node create-missing-tables.js
   ```

3. **Lancer le seed complet** ✅
   ```bash
   cd scripts
   node seed-all-data.js
   ```

4. **Tester l'interface** ✅
   - Ouvrir http://localhost:3000
   - Naviguer vers Market ou News
   - Tester les filtres, tri, pagination, etc.

---

## 🧹 Nettoyage (Optionnel)

Pour supprimer toutes les données de test:

```sql
-- Market
DELETE FROM price_alerts;
DELETE FROM historical_data;
DELETE FROM market_data;
DELETE FROM assets;

-- News
DELETE FROM news_articles;
DELETE FROM economic_events;
DELETE FROM market_news;
```

Puis relancer les scripts pour recréer les données.

---

## 📈 Résultats Attendus

Après exécution de `seed-all-data.js`:

```
✅ Assets: 12
✅ Market Data: ~160
✅ Historical Data: ~180
✅ Price Alerts: ~25
✅ News Articles: 8
✅ Economic Events: 10
✅ Market News: 10

Total: ~405 entrées créées
```

---

## 🎊 Fonctionnalités à Tester

### Module Market
- [x] Filtrer par type d'asset
- [x] Rechercher par symbole
- [x] Trier par prix/volume
- [x] Voir les graphiques
- [x] Exporter en CSV
- [x] Alertes de prix

### Module News
- [x] Filtrer par catégorie/sentiment
- [x] Aperçu des articles
- [x] Trier par date/priorité
- [x] Filtrer événements par pays
- [x] Voir les tags
- [x] Exporter en CSV

---

## 💡 Conseils

1. **Première fois**: Utilisez `seed-all-data.js`
2. **Ajout de données**: Lancez les scripts individuels
3. **Test rapide**: Les scripts s'arrêtent aux erreurs mais continuent
4. **Performance**: ~30-60 secondes pour tout remplir

---

## 📞 Support

En cas de problème:
1. Vérifier que l'API tourne
2. Vérifier les logs de l'API
3. Vérifier la console du script
4. Relancer le script si nécessaire

---

**🎉 Bon test avec vos nouvelles fonctionnalités!**

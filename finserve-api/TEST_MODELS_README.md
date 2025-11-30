# Test des Modèles Market & News

## Description

Script de test automatique pour les 8 modèles Sequelize:

### 📊 MARKET MODELS (5 fichiers)
1. **Asset Model** - Gestion des actifs financiers (stocks, bonds, crypto, etc.)
2. **Market Data Model** - Données de marché (prix, volumes, variations)
3. **Realtime Quote Model** - Cotations en temps réel
4. **Historical Data Model** - Données historiques
5. **Price Alert Model** - Alertes de prix

### 📰 NEWS MODELS (3 fichiers)
1. **Economic Event Model** - Événements économiques
2. **Market News Model** - Actualités du marché
3. **News Article Model** - Articles de news détaillés

## Utilisation

### Lancer les tests:
```bash
npm run test:models
```

Ou directement:
```bash
node test-models.js
```

## Tests effectués

Pour chaque modèle, le script teste:
- ✅ **CREATE** - Création d'enregistrements
- ✅ **READ** - Lecture par ID
- ✅ **UPDATE** - Mise à jour
- ✅ **FIND** - Recherches avec filtres
- ✅ **RELATIONS** - Associations entre modèles
- 🧹 **CLEANUP** - Nettoyage automatique des données de test

## Résultat attendu

```
╔═══════════════════════════════════════════════════════════╗
║  TEST MODELS: MARKET (5) + NEWS (3)                       ║
╚═══════════════════════════════════════════════════════════╝

======================================================================
📊 TEST 1/8: Asset Model
======================================================================

✓ CREATE Asset ID: abc-123
✓ READ Asset
✓ UPDATE Asset
✓ FIND ALL Assets 5 found

... (autres tests)

======================================================================
📊 RÉSUMÉ FINAL
======================================================================

MARKET MODELS (5): Asset, MarketData, RealtimeQuote, HistoricalData, PriceAlert
NEWS MODELS (3): EconomicEvent, MarketNews, NewsArticle

Total: 32
Réussis: 30
Échoués: 2
Taux: 93.75%
```

## Prérequis

1. Base de données configurée et accessible
2. Tables créées (via migration Sequelize)
3. Au moins un utilisateur existant (pour les tests de Price Alert)

## Notes

- Le script nettoie automatiquement les données de test après exécution
- Certains modèles (Historical Data, Price Alert) peuvent ne pas être disponibles selon votre configuration
- Le script gère ces cas automatiquement

## Dépannage

### Erreur de connexion DB
```
Unable to connect to the database
```
**Solution:** Vérifiez vos paramètres de connexion dans `app/config/db.config.js`

### Model not available
```
Historical Data Model - Model not available
```
**Solution:** Normal si le modèle n'est pas encore implémenté. Le test est skip automatiquement.

### No asset available
```
No asset available
```
**Solution:** Créez au moins un asset manuellement ou via le seeder avant de lancer les tests.

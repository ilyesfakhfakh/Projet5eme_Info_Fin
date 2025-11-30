z# ⚡ Fix Rapide - Tables Manquantes

## 🎯 Vous avez 2 options:

---

## ✅ Option 1: Migration Sequelize (Professionnel)

```bash
npm run migrate
```

C'est tout! La migration crée automatiquement les 2 tables.

---

## ✅ Option 2: Script Setup (Rapide & Complet)

```bash
npm run setup
```

Crée les tables + utilisateur de test + asset de test.

---

## 🧪 Tester ensuite

```bash
npm run test:models
```

**Résultat attendu: 100% de réussite (34/34 tests)**

---

## 📋 Fichiers créés

1. **Migration:** `migrations/20241123000001-create-historical-data-and-price-alerts.js`
2. **Config Sequelize:** `.sequelizerc`
3. **Scripts:**
   - `setup-all.js` - Configuration complète
   - `create-missing-tables.js` - Crée uniquement les tables

## 🔧 Commandes disponibles

| Commande | Description |
|----------|-------------|
| `npm run migrate` | Exécute toutes les migrations |
| `npm run migrate:status` | Vérifie le statut des migrations |
| `npm run migrate:undo` | Annule la dernière migration |
| `npm run setup` | Configuration complète (tables + data) |
| `npm run test:models` | Lance les tests |

---

## 💡 Recommandation

**Pour la première fois:** `npm run setup`  
**Pour la production:** `npm run migrate`

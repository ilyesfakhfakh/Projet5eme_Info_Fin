# 🔄 Guide de Migration - Historical Data & Price Alerts

## ✅ Migration créée

Fichier: `migrations/20241123000001-create-historical-data-and-price-alerts.js`

Cette migration crée deux tables:
- ✅ `historical_data` - Données historiques des assets
- ✅ `price_alerts` - Alertes de prix pour les utilisateurs

## 🚀 Méthode 1: Exécuter la migration avec Sequelize CLI (Recommandé)

### Installer Sequelize CLI globalement (si nécessaire)
```bash
npm install -g sequelize-cli
```

### Exécuter la migration
```bash
npx sequelize-cli db:migrate
```

### Résultat attendu
```
Sequelize CLI [Node: 18.x.x, CLI: 6.x.x, ORM: 6.x.x]

Loaded configuration file "app\config\db.config.js".
== 20241123000001-create-historical-data-and-price-alerts: migrating =======
✓ Table historical_data créée avec succès
✓ Table price_alerts créée avec succès
== 20241123000001-create-historical-data-and-price-alerts: migrated (0.234s)
```

### Vérifier les migrations exécutées
```bash
npx sequelize-cli db:migrate:status
```

### Annuler la dernière migration (si besoin)
```bash
npx sequelize-cli db:migrate:undo
```

## 🚀 Méthode 2: Script automatique (Alternative)

Si vous préférez, utilisez toujours le script setup:
```bash
npm run setup
```

## 🔍 Vérifier que les tables existent

### Via MySQL
```bash
mysql -u root -p
```

```sql
USE finserve;
SHOW TABLES;
DESCRIBE historical_data;
DESCRIBE price_alerts;
```

### Via le script
```bash
npm run create:tables
```

## 📋 Structure des tables créées

### Table: historical_data
```sql
CREATE TABLE historical_data (
  history_id CHAR(36) PRIMARY KEY,
  asset_id CHAR(36) NOT NULL,
  date DATE NOT NULL,
  open_price DECIMAL(18,6) NOT NULL DEFAULT 0,
  high_price DECIMAL(18,6) NOT NULL DEFAULT 0,
  low_price DECIMAL(18,6) NOT NULL DEFAULT 0,
  close_price DECIMAL(18,6) NOT NULL DEFAULT 0,
  adjusted_close DECIMAL(18,6) NOT NULL DEFAULT 0,
  volume BIGINT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY unique_asset_date (asset_id, date),
  KEY idx_date (date),
  FOREIGN KEY (asset_id) REFERENCES assets(asset_id) 
    ON DELETE CASCADE ON UPDATE CASCADE
);
```

### Table: price_alerts
```sql
CREATE TABLE price_alerts (
  alert_id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  asset_id CHAR(36) NOT NULL,
  alert_type ENUM('ABOVE', 'BELOW', 'PERCENTAGE_CHANGE') NOT NULL DEFAULT 'ABOVE',
  target_price DECIMAL(18,6) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  is_triggered TINYINT(1) NOT NULL DEFAULT 0,
  triggered_at DATETIME,
  message TEXT,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  KEY idx_price_alerts_user_id (user_id),
  KEY idx_price_alerts_asset_id (asset_id),
  KEY idx_price_alerts_is_active (is_active),
  FOREIGN KEY (user_id) REFERENCES users(user_id) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (asset_id) REFERENCES assets(asset_id) 
    ON DELETE CASCADE ON UPDATE CASCADE
);
```

## 🧪 Tester après la migration

```bash
npm run test:models
```

Vous devriez voir:
```
======================================================================
📉 TEST 4/8: Historical Data Model
======================================================================

✓ CREATE Historical Data ID: xxx
✓ READ Historical Data
✓ UPDATE Historical Data
✓ FIND by Asset 1 records

======================================================================
🔔 TEST 5/8: Price Alert Model
======================================================================

✓ CREATE Alert ID: xxx
✓ READ Alert
✓ UPDATE Alert
✓ FIND by User 1 alerts
✓ FIND Active Alerts 0 active
```

## ⚠️ Prérequis

Assurez-vous que ces tables existent avant d'exécuter la migration:
- ✅ `users` (pour price_alerts)
- ✅ `assets` (pour historical_data et price_alerts)

Si ces tables n'existent pas, la migration échouera à cause des contraintes de clés étrangères.

## 🔄 Ordre d'exécution recommandé

1. **Vérifier la base de données:**
   ```bash
   npm start
   # Laissez tourner quelques secondes puis Ctrl+C
   ```

2. **Exécuter la migration:**
   ```bash
   npx sequelize-cli db:migrate
   ```

3. **Créer un utilisateur de test (si nécessaire):**
   ```bash
   npm run setup
   ```

4. **Lancer les tests:**
   ```bash
   npm run test:models
   ```

## 📦 Ajouter la commande au package.json

Vous pouvez ajouter ces scripts:
```json
"scripts": {
  "migrate": "sequelize-cli db:migrate",
  "migrate:undo": "sequelize-cli db:migrate:undo",
  "migrate:status": "sequelize-cli db:migrate:status"
}
```

Puis utiliser:
```bash
npm run migrate
npm run migrate:status
```

## ❌ Dépannage

### Erreur: SequelizeDatabaseError: Table already exists
➜ Normal si vous avez déjà créé les tables avec `npm run setup`. La migration vérifie automatiquement.

### Erreur: Foreign key constraint fails
➜ Assurez-vous que les tables `users` et `assets` existent avant d'exécuter la migration.

### Erreur: Cannot find module 'sequelize-cli'
```bash
npm install -g sequelize-cli
# ou
npx sequelize-cli db:migrate
```

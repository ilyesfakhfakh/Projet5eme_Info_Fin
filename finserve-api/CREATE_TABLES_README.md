# 🔧 Création des Tables Manquantes

## Problème

Les tables `historical_data` et `price_alerts` n'existent pas dans votre base de données.

## ✅ Solution Rapide

### Méthode 1: Script automatique (Recommandé)

Exécutez cette commande pour créer les tables manquantes:

```bash
npm run create:tables
```

Ce script va:
- ✅ Vérifier la connexion à la base de données
- ✅ Créer la table `historical_data`
- ✅ Créer la table `price_alerts`
- ✅ Afficher la structure des tables créées

### Méthode 2: Démarrer le serveur

Le serveur crée automatiquement les tables au démarrage:

```bash
npm start
```

Attendez le message:
```
Database resync done successfully
```

Puis arrêtez le serveur (Ctrl+C).

### Méthode 3: SQL Manuel

Connectez-vous à MySQL et exécutez:

```sql
USE finserve;

-- Table historical_data
CREATE TABLE IF NOT EXISTS historical_data (
  history_id CHAR(36) PRIMARY KEY,
  asset_id CHAR(36) NOT NULL,
  date DATE NOT NULL,
  open_price DECIMAL(18,6) NOT NULL DEFAULT 0,
  high_price DECIMAL(18,6) NOT NULL DEFAULT 0,
  low_price DECIMAL(18,6) NOT NULL DEFAULT 0,
  close_price DECIMAL(18,6) NOT NULL DEFAULT 0,
  adjusted_close DECIMAL(18,6) NOT NULL DEFAULT 0,
  volume BIGINT NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_asset_date (asset_id, date),
  KEY idx_date (date),
  FOREIGN KEY (asset_id) REFERENCES assets(asset_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Table price_alerts
CREATE TABLE IF NOT EXISTS price_alerts (
  alert_id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  asset_id CHAR(36) NOT NULL,
  alert_type ENUM('ABOVE', 'BELOW', 'PERCENTAGE_CHANGE') NOT NULL DEFAULT 'ABOVE',
  target_price DECIMAL(18,6) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  is_triggered TINYINT(1) NOT NULL DEFAULT 0,
  triggered_at DATETIME,
  message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (asset_id) REFERENCES assets(asset_id) ON DELETE CASCADE ON UPDATE CASCADE
);
```

## 🧪 Vérifier que les tables existent

```bash
# Méthode 1: Via MySQL
mysql -u root -p
USE finserve;
SHOW TABLES;

# Vous devriez voir:
# - historical_data
# - price_alerts
```

```bash
# Méthode 2: Relancer les tests
npm run test:models
```

## ⚠️ Problème "Asset or User not available"

Si vous voyez cette erreur pour `price_alerts`, cela signifie qu'il n'y a pas d'utilisateur dans votre base de données.

### Solution:

1. **Créer un utilisateur via le script seed:**
```bash
npm run seed:auth
```

2. **Ou démarrer le serveur et créer un utilisateur via l'API:**
```bash
npm start
```

Puis dans un autre terminal:
```bash
curl -X POST http://localhost:3200/api/v1/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"testuser\",\"email\":\"test@test.com\",\"password\":\"Test123!\",\"firstName\":\"Test\",\"lastName\":\"User\"}"
```

## 📊 Ordre d'exécution recommandé

```bash
# 1. Créer les tables
npm run create:tables

# 2. Créer un utilisateur (si nécessaire)
npm run seed:auth

# 3. Lancer les tests
npm run test:models
```

## ✅ Résultat attendu

Après avoir créé les tables, vous devriez voir:

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

Total: 34
Réussis: 34
Échoués: 0
Taux: 100.00%
```

## 🔍 Dépannage

### Les tables ne se créent pas

1. Vérifiez que MySQL est démarré
2. Vérifiez les permissions de l'utilisateur root
3. Vérifiez que la base de données `finserve` existe

### Erreur de clé étrangère

Si vous avez une erreur de foreign key, assurez-vous que:
- La table `assets` existe et contient au moins un enregistrement
- La table `users` existe et contient au moins un enregistrement

# 🎰 ROULETTE - CRÉATION MANUELLE DES TABLES MYSQL

## ❌ PROBLÈME
Les tables de roulette ne sont pas créées automatiquement dans MySQL XAMPP.

## ✅ SOLUTION - CRÉATION MANUELLE

### ÉTAPE 1: Ouvrir phpMyAdmin

1. Démarrer **XAMPP Control Panel**
2. S'assurer que **MySQL** est démarré (bouton Start)
3. Ouvrir le navigateur: **http://localhost/phpmyadmin**

### ÉTAPE 2: Sélectionner la base de données

1. Dans la colonne de gauche, cliquer sur **`finserve`**
2. Si la base n'existe pas, la créer:
   - Cliquer "Nouvelle base de données"
   - Nom: `finserve`
   - Interclassement: `utf8mb4_unicode_ci`
   - Cliquer "Créer"

### ÉTAPE 3: Exécuter le script SQL

1. Cliquer sur l'onglet **"SQL"** en haut
2. Copier TOUT le contenu du fichier:
   ```
   finserve-api/database/roulette_tables.sql
   ```
3. Coller dans la zone de texte SQL
4. Cliquer sur le bouton **"Exécuter"** (Go)
5. Vous devriez voir: ✅ "Roulette tables created successfully!"

### ÉTAPE 4: Vérifier les tables créées

Dans phpMyAdmin, vous devriez maintenant voir **4 nouvelles tables**:

1. ✅ **wallets** (54 colonnes selon vos besoins)
   - `wallet_id` (UUID)
   - `user_id` (VARCHAR)
   - `balance` (DECIMAL) - $1,000 par défaut
   - `currency` (VARCHAR) - USD
   - `locked_balance`, `total_wagered`, `total_won`
   - `created_at`, `updated_at`

2. ✅ **roulette_games**
   - `game_id` (UUID)
   - `game_number` (INT AUTO_INCREMENT)
   - `result_type` (ENUM: RED/BLACK/GREEN/SECTOR/STOCK)
   - `result_value` (VARCHAR)
   - `multiplier` (DECIMAL)
   - `server_seed`, `client_seed`, `result_hash`
   - `total_bets`, `total_payouts`
   - `volatility_index`
   - `status` (ENUM: PENDING/SPINNING/COMPLETED)
   - `spun_at`, `created_at`, `updated_at`

3. ✅ **roulette_bets**
   - `bet_id` (UUID)
   - `game_id` (UUID) - FK vers roulette_games
   - `user_id` (VARCHAR)
   - `bet_type` (ENUM: RED/BLACK/GREEN/SECTOR/STOCK)
   - `bet_value` (VARCHAR) - Nom secteur/action
   - `amount` (DECIMAL)
   - `potential_payout` (DECIMAL)
   - `actual_payout` (DECIMAL)
   - `result` (ENUM: PENDING/WIN/LOSS)
   - `created_at`, `updated_at`

4. ✅ **jackpots**
   - `jackpot_id` (UUID)
   - `current_amount` (DECIMAL) - $1,000 par défaut
   - `contribution_rate` (DECIMAL) - 1% (0.0100)
   - `last_winner` (VARCHAR)
   - `last_win_amount` (DECIMAL)
   - `last_win_date` (DATETIME)
   - `total_paid` (DECIMAL)
   - `created_at`, `updated_at`

### ÉTAPE 5: Vérifier les données initiales

Exécuter cette requête SQL:

```sql
SELECT * FROM jackpots;
```

Vous devriez voir **1 ligne** avec:
- `current_amount`: 1000.00
- `contribution_rate`: 0.0100
- `total_paid`: 0.00

### ÉTAPE 6: Redémarrer le backend

1. Arrêter le serveur backend (Ctrl+C dans le terminal)
2. Redémarrer:
   ```bash
   cd finserve-api
   npm start
   ```

### ÉTAPE 7: Tester l'application

1. Ouvrir: **http://localhost:3000/free/administration**
2. Le jeu devrait se charger sans erreur 500
3. Vous devriez voir:
   - Balance: $1,000
   - Jackpot: $1,000
   - Volatility: MODERATE

4. Placer un pari et tourner la roulette
5. Vérifier dans phpMyAdmin:
   ```sql
   SELECT * FROM wallets;
   SELECT * FROM roulette_games;
   SELECT * FROM roulette_bets;
   ```

---

## 🔍 VÉRIFICATION DES TABLES

### Voir toutes les tables roulette:
```sql
SHOW TABLES LIKE '%roulette%';
SHOW TABLES LIKE 'wallets';
SHOW TABLES LIKE 'jackpots';
```

### Voir la structure:
```sql
DESCRIBE wallets;
DESCRIBE roulette_games;
DESCRIBE roulette_bets;
DESCRIBE jackpots;
```

### Compter les lignes:
```sql
SELECT 
  (SELECT COUNT(*) FROM wallets) AS wallets_count,
  (SELECT COUNT(*) FROM roulette_games) AS games_count,
  (SELECT COUNT(*) FROM roulette_bets) AS bets_count,
  (SELECT COUNT(*) FROM jackpots) AS jackpots_count;
```

---

## 🛠️ DÉPANNAGE

### Erreur: Table already exists
```sql
-- Supprimer les tables existantes d'abord
DROP TABLE IF EXISTS roulette_bets;
DROP TABLE IF EXISTS roulette_games;
DROP TABLE IF EXISTS jackpots;
DROP TABLE IF EXISTS wallets;

-- Puis réexécuter le script roulette_tables.sql
```

### Erreur: Foreign key constraint fails
Les foreign keys sont déjà gérées dans le script SQL.

### Erreur 500 sur /roulette/wallet
1. Vérifier que la table `wallets` existe
2. Vérifier les logs du backend pour l'erreur exacte
3. Tester manuellement:
   ```sql
   INSERT INTO wallets (wallet_id, user_id, balance)
   VALUES (UUID(), 'demo-user', 1000.00);
   ```

### Erreur 500 sur /roulette/jackpot
1. Vérifier que la table `jackpots` existe
2. Vérifier qu'il y a au moins 1 ligne:
   ```sql
   SELECT * FROM jackpots;
   ```
3. Si vide, insérer:
   ```sql
   INSERT INTO jackpots (jackpot_id, current_amount, contribution_rate, total_paid)
   VALUES (UUID(), 1000.00, 0.0100, 0.00);
   ```

---

## 📊 REQUÊTES UTILES

### Voir les dernières parties:
```sql
SELECT 
  game_number,
  result_type,
  result_value,
  multiplier,
  total_bets,
  total_payouts,
  created_at
FROM roulette_games
ORDER BY game_number DESC
LIMIT 10;
```

### Voir les paris d'un utilisateur:
```sql
SELECT 
  b.bet_id,
  g.game_number,
  b.bet_type,
  b.bet_value,
  b.amount,
  b.result,
  b.actual_payout,
  b.created_at
FROM roulette_bets b
JOIN roulette_games g ON b.game_id = g.game_id
WHERE b.user_id = 'demo-user'
ORDER BY b.created_at DESC
LIMIT 20;
```

### Statistiques globales:
```sql
SELECT 
  COUNT(DISTINCT game_id) AS total_games,
  COUNT(*) AS total_bets,
  SUM(amount) AS total_wagered,
  SUM(actual_payout) AS total_paid_out,
  SUM(amount) - SUM(actual_payout) AS house_profit
FROM roulette_bets;
```

### Top gagnants:
```sql
SELECT 
  user_id,
  COUNT(*) AS total_bets,
  SUM(amount) AS total_wagered,
  SUM(actual_payout) AS total_won,
  SUM(actual_payout) - SUM(amount) AS profit
FROM roulette_bets
GROUP BY user_id
ORDER BY profit DESC
LIMIT 10;
```

---

## ✅ RÉSULTAT ATTENDU

Après avoir suivi ces étapes:

1. ✅ 4 tables créées dans MySQL `finserve`
2. ✅ 1 jackpot initialisé à $1,000
3. ✅ Backend démarre sans erreur
4. ✅ Frontend charge le jeu
5. ✅ Aucune erreur 500
6. ✅ Peut jouer et miser
7. ✅ Données sauvegardées dans MySQL

---

**🎰 Tables de Roulette prêtes dans MySQL XAMPP! 🎉**

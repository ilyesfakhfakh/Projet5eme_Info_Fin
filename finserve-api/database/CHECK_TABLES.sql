-- VÉRIFICATION DES TABLES ROULETTE
-- Exécutez ce script dans phpMyAdmin pour vérifier l'état des tables

-- 1. Lister toutes les tables roulette
SELECT 
    TABLE_NAME,
    TABLE_ROWS,
    CREATE_TIME,
    UPDATE_TIME
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'finserve'
  AND TABLE_NAME IN ('wallets', 'roulette_games', 'roulette_bets', 'jackpots')
ORDER BY TABLE_NAME;

-- 2. Compter les lignes dans chaque table
SELECT 
    'wallets' AS table_name,
    COUNT(*) AS row_count
FROM wallets
UNION ALL
SELECT 
    'roulette_games',
    COUNT(*)
FROM roulette_games
UNION ALL
SELECT 
    'roulette_bets',
    COUNT(*)
FROM roulette_bets
UNION ALL
SELECT 
    'jackpots',
    COUNT(*)
FROM jackpots;

-- 3. Vérifier le jackpot initial
SELECT * FROM jackpots;

-- 4. Vérifier la structure de roulette_games
DESCRIBE roulette_games;

-- 5. Vérifier la structure de wallets
DESCRIBE wallets;

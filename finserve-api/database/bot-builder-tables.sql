-- ============================================
-- TRADING BOT BUILDER - Database Schema
-- ============================================

-- 1. Bots Table (Les bots créés par les users)
CREATE TABLE IF NOT EXISTS `trading_bots` (
  `bot_id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `status` ENUM('DRAFT', 'ACTIVE', 'PAUSED', 'STOPPED') DEFAULT 'DRAFT',
  `is_public` BOOLEAN DEFAULT FALSE,
  `category` VARCHAR(100) DEFAULT 'custom',
  `risk_level` ENUM('LOW', 'MEDIUM', 'HIGH') DEFAULT 'MEDIUM',
  
  -- Configuration du bot
  `config` JSON NOT NULL, -- Structure du bot (nodes, edges)
  `settings` JSON, -- Settings généraux (max investment, stop loss, etc.)
  
  -- Stats
  `total_trades` INT DEFAULT 0,
  `win_rate` DECIMAL(5,2) DEFAULT 0,
  `total_profit` DECIMAL(15,2) DEFAULT 0,
  `total_loss` DECIMAL(15,2) DEFAULT 0,
  `roi` DECIMAL(10,2) DEFAULT 0,
  
  -- Marketplace
  `downloads` INT DEFAULT 0,
  `rating` DECIMAL(3,2) DEFAULT 0,
  `price` DECIMAL(10,2) DEFAULT 0, -- 0 = gratuit
  
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX `idx_user` (`user_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_public` (`is_public`),
  INDEX `idx_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Bot Executions (Historique d'exécution)
CREATE TABLE IF NOT EXISTS `bot_executions` (
  `execution_id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `bot_id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(255) NOT NULL,
  
  -- Trade info
  `asset_symbol` VARCHAR(20) NOT NULL,
  `action` ENUM('BUY', 'SELL') NOT NULL,
  `quantity` DECIMAL(15,8) NOT NULL,
  `price` DECIMAL(15,8) NOT NULL,
  `total_value` DECIMAL(15,2) NOT NULL,
  
  -- Résultat
  `profit_loss` DECIMAL(15,2) DEFAULT 0,
  `profit_loss_percent` DECIMAL(10,2) DEFAULT 0,
  
  -- Context
  `trigger_rule` VARCHAR(255), -- Quelle règle a déclenché
  `market_conditions` JSON, -- Conditions du marché au moment
  
  `executed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`bot_id`) REFERENCES `trading_bots`(`bot_id`) ON DELETE CASCADE,
  INDEX `idx_bot` (`bot_id`),
  INDEX `idx_user` (`user_id`),
  INDEX `idx_asset` (`asset_symbol`),
  INDEX `idx_executed` (`executed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Backtesting Results
CREATE TABLE IF NOT EXISTS `backtest_results` (
  `backtest_id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `bot_id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(255) NOT NULL,
  
  -- Période de test
  `start_date` DATETIME NOT NULL,
  `end_date` DATETIME NOT NULL,
  `initial_capital` DECIMAL(15,2) NOT NULL,
  
  -- Résultats
  `final_capital` DECIMAL(15,2) NOT NULL,
  `total_trades` INT NOT NULL,
  `winning_trades` INT DEFAULT 0,
  `losing_trades` INT DEFAULT 0,
  `win_rate` DECIMAL(5,2) DEFAULT 0,
  `total_profit` DECIMAL(15,2) DEFAULT 0,
  `total_loss` DECIMAL(15,2) DEFAULT 0,
  `net_profit` DECIMAL(15,2) DEFAULT 0,
  `roi` DECIMAL(10,2) DEFAULT 0,
  `max_drawdown` DECIMAL(10,2) DEFAULT 0,
  `sharpe_ratio` DECIMAL(10,4) DEFAULT 0,
  
  -- Détails
  `trades_data` JSON, -- Liste de tous les trades
  `equity_curve` JSON, -- Evolution du capital
  
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`bot_id`) REFERENCES `trading_bots`(`bot_id`) ON DELETE CASCADE,
  INDEX `idx_bot` (`bot_id`),
  INDEX `idx_user` (`user_id`),
  INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Bot Ratings & Reviews (pour Marketplace)
CREATE TABLE IF NOT EXISTS `bot_reviews` (
  `review_id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `bot_id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(255) NOT NULL,
  `rating` INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  `comment` TEXT,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`bot_id`) REFERENCES `trading_bots`(`bot_id`) ON DELETE CASCADE,
  INDEX `idx_bot` (`bot_id`),
  INDEX `idx_user` (`user_id`),
  UNIQUE KEY `unique_user_bot` (`bot_id`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Bot Templates (Prédéfinis)
CREATE TABLE IF NOT EXISTS `bot_templates` (
  `template_id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `category` VARCHAR(100) DEFAULT 'strategy',
  `difficulty` ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED') DEFAULT 'BEGINNER',
  `config` JSON NOT NULL,
  `preview_image` VARCHAR(500),
  `is_featured` BOOLEAN DEFAULT FALSE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  INDEX `idx_category` (`category`),
  INDEX `idx_featured` (`is_featured`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT '✅ Bot Builder tables created successfully!' AS message;

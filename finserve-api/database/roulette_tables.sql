-- ROULETTE GAME TABLES FOR MYSQL
-- Execute this in phpMyAdmin to create the tables manually

-- 1. Wallets Table
CREATE TABLE IF NOT EXISTS `wallets` (
  `wallet_id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(255) NOT NULL UNIQUE,
  `balance` DECIMAL(15,2) NOT NULL DEFAULT 1000.00,
  `currency` VARCHAR(3) NOT NULL DEFAULT 'USD',
  `locked_balance` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `total_wagered` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `total_won` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

BLACK', 'GREEN', 'SECTOR', 'STOCK') DEFAULT NULL,
  `result_value` VARCHAR(255) DEFAULT NULL,
  `multiplier` DECIMAL(10,2) DEFAULT NULL,
  `server_seed` VARCHAR(255) NOT NULL,
  `client_seed` VARCHAR(255) DEFAULT NULL,
  `result_hash` VARCHAR(255) DEFAULT NULL,
  `total_bets` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `total_payouts` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `volatility_index` DECIMAL(5,2) DEFAULT NULL,
  `status` ENUM('PENDING', 'SPINNING', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
  `spun_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`game_number`),
  UNIQUE KEY `unique_game_id` (`game_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Roulette Bets Table
CREATE TABLE IF NOT EXISTS `roulette_bets` (
  `bet_id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `game_id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(255) NOT NULL,
  `bet_type` ENUM('RED', 'BLACK', 'GREEN', 'SECTOR', 'STOCK') NOT NULL,
  `bet_value` VARCHAR(255) DEFAULT NULL COMMENT 'Specific sector or stock name if applicable',
  `amount` DECIMAL(15,2) NOT NULL,
  `potential_payout` DECIMAL(15,2) NOT NULL,
  `actual_payout` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `result` ENUM('PENDING', 'WIN', 'LOSS') NOT NULL DEFAULT 'PENDING',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_game_id` (`game_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_bet_type` (`bet_type`),
  INDEX `idx_result` (`result`),
  FOREIGN KEY (`game_id`) REFERENCES `roulette_games`(`game_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Jackpots Table
CREATE TABLE IF NOT EXISTS `jackpots` (
  `jackpot_id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `current_amount` DECIMAL(15,2) NOT NULL DEFAULT 1000.00,
  `contribution_rate` DECIMAL(5,4) NOT NULL DEFAULT 0.0100 COMMENT 'Percentage of each bet that goes to jackpot (e.g., 0.01 = 1%)',
  `last_winner` VARCHAR(255) DEFAULT NULL,
  `last_win_amount` DECIMAL(15,2) DEFAULT NULL,
  `last_win_date` DATETIME DEFAULT NULL,
  `total_paid` DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Total amount paid out in jackpots',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert initial jackpot record
INSERT INTO `jackpots` (`jackpot_id`, `current_amount`, `contribution_rate`, `total_paid`)
VALUES (UUID(), 1000.00, 0.0100, 0.00)
ON DUPLICATE KEY UPDATE `jackpot_id` = `jackpot_id`;

-- Success message
SELECT 'Roulette tables created successfully!' AS message;

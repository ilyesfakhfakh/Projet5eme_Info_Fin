-- MATCH-3 GAME TABLES FOR MYSQL
-- Execute this in phpMyAdmin to create the tables manually

-- 1. Match-3 Games Table
CREATE TABLE IF NOT EXISTS `match3_games` (
  `game_id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(255) NOT NULL,
  `level` INT NOT NULL DEFAULT 1,
  `score` INT NOT NULL DEFAULT 0,
  `moves_left` INT NOT NULL DEFAULT 30,
  `target_score` INT NOT NULL DEFAULT 1000,
  `board_state` TEXT DEFAULT NULL COMMENT 'JSON string of the game board',
  `power_ups` TEXT DEFAULT NULL COMMENT 'JSON string of available power-ups',
  `status` ENUM('IN_PROGRESS', 'WON', 'LOST') NOT NULL DEFAULT 'IN_PROGRESS',
  `coins_earned` INT NOT NULL DEFAULT 0,
  `completed_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_level` (`level`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Match-3 High Scores Table
CREATE TABLE IF NOT EXISTS `match3_highscores` (
  `score_id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(255) NOT NULL,
  `level` INT NOT NULL,
  `score` INT NOT NULL,
  `moves_used` INT NOT NULL,
  `coins_earned` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_user_level` (`user_id`, `level`),
  INDEX `idx_level` (`level`),
  INDEX `idx_score` (`score`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Success message
SELECT 'Match-3 game tables created successfully! ✅' AS message;

-- ============================================
-- CRÉATION DES TABLES STREAMING
-- Exécuter ce fichier dans phpMyAdmin
-- ============================================

-- 1. Streams (les lives)
CREATE TABLE IF NOT EXISTS `streams` (
  `stream_id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `streamer_id` VARCHAR(255) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `thumbnail_url` VARCHAR(500),
  `status` ENUM('LIVE', 'ENDED', 'SCHEDULED') DEFAULT 'LIVE',
  `viewer_count` INT DEFAULT 0,
  `peak_viewers` INT DEFAULT 0,
  `started_at` DATETIME NOT NULL,
  `ended_at` DATETIME,
  `duration_seconds` INT,
  `category` VARCHAR(100) DEFAULT 'trading',
  `is_recording` BOOLEAN DEFAULT TRUE,
  `recording_url` VARCHAR(500),
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_streamer` (`streamer_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_started` (`started_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Messages du chat
CREATE TABLE IF NOT EXISTS `stream_messages` (
  `message_id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `stream_id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(255) NOT NULL,
  `username` VARCHAR(100) NOT NULL,
  `message` TEXT NOT NULL,
  `message_type` ENUM('TEXT', 'EMOJI', 'TIP', 'ALERT') DEFAULT 'TEXT',
  `tip_amount` DECIMAL(10,2),
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`stream_id`) REFERENCES `streams`(`stream_id`) ON DELETE CASCADE,
  INDEX `idx_stream` (`stream_id`),
  INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Viewers (tracking)
CREATE TABLE IF NOT EXISTS `stream_viewers` (
  `viewer_id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `stream_id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(255) NOT NULL,
  `joined_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `left_at` DATETIME,
  `watch_duration_seconds` INT DEFAULT 0,
  FOREIGN KEY (`stream_id`) REFERENCES `streams`(`stream_id`) ON DELETE CASCADE,
  INDEX `idx_stream` (`stream_id`),
  INDEX `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tips (donations)
CREATE TABLE IF NOT EXISTS `stream_tips` (
  `tip_id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `stream_id` VARCHAR(36) NOT NULL,
  `from_user_id` VARCHAR(255) NOT NULL,
  `to_user_id` VARCHAR(255) NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `currency` VARCHAR(3) DEFAULT 'USD',
  `message` TEXT,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`stream_id`) REFERENCES `streams`(`stream_id`) ON DELETE CASCADE,
  INDEX `idx_stream` (`stream_id`),
  INDEX `idx_to_user` (`to_user_id`),
  INDEX `idx_from_user` (`from_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vérification
SELECT 'Tables streaming créées avec succès!' AS message;

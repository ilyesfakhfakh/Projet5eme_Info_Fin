# 🎮 Match-3 Puzzle Game - Setup Guide

## 📋 Vue d'ensemble

Jeu de puzzle Match-3 avec thème financier intégré dans l'application Gaming.

### 🎯 Fonctionnalités

- **Gameplay Match-3**: Alignez 3+ symboles identiques
- **Symboles financiers**: 💰 💎 📈 📉 🪙 ⭐
- **Système de niveaux**: Difficulté progressive
- **Récompenses**: Gagnez des coins virtuels
- **Statistiques**: Suivez vos performances
- **Leaderboard**: Comparez vos scores

---

## 🗄️ ÉTAPE 1: Créer les tables MySQL

### Ouvrir phpMyAdmin

1. Aller sur: `http://localhost/phpmyadmin`
2. Sélectionner la base de données `finserve`
3. Cliquer sur l'onglet **SQL**

### Exécuter le script

Copier et exécuter le contenu de:
```
finserve-api/database/match3_tables.sql
```

**OU** copier directement ce script:

```sql
-- 1. Match-3 Games Table
CREATE TABLE IF NOT EXISTS `match3_games` (
  `game_id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(255) NOT NULL,
  `level` INT NOT NULL DEFAULT 1,
  `score` INT NOT NULL DEFAULT 0,
  `moves_left` INT NOT NULL DEFAULT 30,
  `target_score` INT NOT NULL DEFAULT 1000,
  `board_state` TEXT DEFAULT NULL,
  `power_ups` TEXT DEFAULT NULL,
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
```

### Vérifier

Vous devriez voir:
```
✅ match3_games (créée)
✅ match3_highscores (créée)
```

---

## 🚀 ÉTAPE 2: Tester l'application

### Backend (déjà démarré)
```
http://localhost:3200
```

### Frontend
```
http://localhost:3000/free/administration
```

### Sélectionner le jeu

1. Cliquer sur l'onglet **💎 Match-3 Puzzle**
2. Le jeu se charge automatiquement

---

## 🎮 ÉTAPE 3: Comment jouer

### Règles du jeu

1. **Objectif**: Atteindre le score cible avant de manquer de coups
2. **Mouvement**: Cliquez sur 2 tuiles adjacentes pour les échanger
3. **Match**: Alignez 3+ symboles identiques (horizontal ou vertical)
4. **Cascades**: Les nouvelles tuiles tombent après chaque match
5. **Score**: Plus de matches = plus de points

### Symboles & Valeurs

| Symbole | Nom | Valeur |
|---------|-----|--------|
| 💰 | Money Bag | 10 pts |
| 💎 | Diamond | 10 pts |
| 📈 | Trending Up | 10 pts |
| 📉 | Trending Down | 10 pts |
| 🪙 | Coin | 10 pts |
| ⭐ | Star | 10 pts |

### Bonus

- **3 matches**: 30 points
- **4 matches**: 50 points + power-up potentiel
- **5+ matches**: 70+ points + power-up spécial

### Niveaux

| Niveau | Score Cible | Coups |
|--------|-------------|-------|
| 1 | 1,000 | 30 |
| 2 | 1,500 | 30 |
| 3 | 2,000 | 29 |
| 4 | 2,500 | 29 |
| 5 | 3,000 | 28 |
| ... | ... | ... |

---

## 🔧 API Endpoints

### Créer une partie
```http
POST /api/v1/match3/game/create?userId=demo-user
Body: { "level": 1 }
```

### Faire un mouvement
```http
POST /api/v1/match3/game/{gameId}/move
Body: {
  "pos1": { "row": 0, "col": 0 },
  "pos2": { "row": 0, "col": 1 }
}
```

### Obtenir une partie
```http
GET /api/v1/match3/game/{gameId}
```

### Statistiques utilisateur
```http
GET /api/v1/match3/stats?userId=demo-user
```

### Leaderboard
```http
GET /api/v1/match3/leaderboard/{level}?limit=10
```

### Configuration
```http
GET /api/v1/match3/config
```

---

## 📊 Structures de données

### Game Object
```javascript
{
  game_id: "uuid",
  user_id: "demo-user",
  level: 1,
  score: 450,
  moves_left: 25,
  target_score: 1000,
  board_state: [...], // Grille 8x8
  status: "IN_PROGRESS",
  coins_earned: 0
}
```

### Board State
```javascript
[
  [
    { symbol: "💰", id: "0-0" },
    { symbol: "💎", id: "0-1" },
    ...
  ],
  ...
]
```

---

## 🎨 Interface utilisateur

### Composants

- **Match3Game.jsx**: Composant principal du jeu
- **Gaming.jsx**: Page avec tabs (Roulette + Match-3)
- **Tabs Material-UI**: Navigation entre les jeux

### Animations

- **PopIn**: Animation d'apparition des tuiles
- **Match**: Animation des matches trouvés
- **Float**: Animation de victoire

---

## 🐛 Dépannage

### Les tables n'existent pas
```sql
-- Vérifier les tables
SHOW TABLES LIKE 'match3_%';

-- Recréer si nécessaire
DROP TABLE IF EXISTS match3_games;
DROP TABLE IF EXISTS match3_highscores;
-- Puis réexécuter le script
```

### Erreur 500 Backend
```bash
# Vérifier les logs
cd finserve-api
npm start

# Regarder la console pour les erreurs
```

### Le jeu ne se charge pas
```bash
# Vérifier que les tables existent
# Vérifier que le backend tourne sur :3200
# Vérifier la console du navigateur (F12)
```

---

## ✨ Fonctionnalités futures

- [ ] Power-ups actifs (Bomb, Horizontal, Vertical, Color)
- [ ] Animations de cascade
- [ ] Son et effets sonores
- [ ] Mode multijoueur
- [ ] Défis quotidiens
- [ ] Événements spéciaux
- [ ] Boutique de power-ups
- [ ] Système de quêtes

---

## 🎯 Architecture

```
Backend:
├── models/match3/
│   ├── match3-game.model.js
│   └── match3-highscore.model.js
├── services/
│   └── match3.service.js
├── controllers/
│   └── match3.controller.js
└── routes/
    └── match3.routes.js

Frontend:
├── views/games/
│   └── Match3Game.jsx
└── views/pages/
    └── Gaming.jsx (avec tabs)
```

---

**🎮 Bon jeu! Amusez-vous bien avec le Match-3 Puzzle! 💎✨**

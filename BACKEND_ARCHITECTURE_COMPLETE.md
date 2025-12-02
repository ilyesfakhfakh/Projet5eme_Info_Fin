# 📚 FINSERVE API - ARCHITECTURE COMPLÈTE DU BACKEND

## 🎯 VUE D'ENSEMBLE

**Nom du projet:** FinServe API  
**Description:** Simulateur de marché financier avec systèmes de trading, jeux et apprentissage  
**Stack:** Node.js + Express + Sequelize + MySQL  
**Port HTTP:** 3200  
**Port HTTPS:** 3443

---

## 🗂️ STRUCTURE DU PROJET

```
finserve-api/
├── app/
│   ├── config/          # Configurations (DB, JWT, etc.)
│   ├── controllers/     # Contrôleurs API (29 fichiers)
│   ├── middlewares/     # Middlewares (auth, validation)
│   ├── models/          # Modèles Sequelize (51 fichiers)
│   ├── routes/          # Routes Express (11 fichiers)
│   └── services/        # Logique métier (18 fichiers)
├── config/              # Configurations globales
├── core/                # Certificats SSL/TLS
├── database/            # Scripts SQL et migrations
├── migrations/          # Migrations Sequelize
├── scripts/             # Scripts utilitaires (seed, etc.)
├── uploads/             # Fichiers uploadés
├── index.js             # Point d'entrée principal
└── package.json         # Dépendances
```

---

## 📦 DÉPENDANCES PRINCIPALES

### **Backend Framework**
- `express` (v5.1.0) - Framework web
- `cors` - Gestion CORS
- `helmet` - Sécurité HTTP headers
- `compression` - Compression des réponses
- `morgan` - Logging HTTP

### **Base de données**
- `sequelize` (v6.37.7) - ORM
- `mysql2` (v3.14.1) - Driver MySQL
- `sqlite3` (v5.1.7) - DB de développement

### **Authentification & Sécurité**
- `bcrypt` / `bcryptjs` - Hash des mots de passe
- `jsonwebtoken` - JWT tokens
- `speakeasy` - 2FA (TOTP)
- `qrcode` - QR codes pour 2FA

### **Utilitaires**
- `axios` - HTTP client
- `moment` - Manipulation de dates
- `nodemailer` - Envoi d'emails
- `multer` - Upload de fichiers
- `node-cron` - Tâches planifiées
- `rss-parser` - Parser RSS
- `xlsx` - Export Excel

---

## 🗄️ ARCHITECTURE DE LA BASE DE DONNÉES

### **1. AUTHENTIFICATION & UTILISATEURS** 👥

#### **users** (Table principale)
```sql
- user_id (PK)
- username, email, password_hash
- first_name, last_name, phone
- is_verified, is_active, is_2fa_enabled
- totp_secret, profile_picture_url
- created_at, updated_at
```

#### **user_preferences**
```sql
- preference_id (PK)
- user_id (FK → users)
- theme, language, timezone
- notifications_enabled, email_notifications
- created_at, updated_at
```

#### **roles**
```sql
- role_id (PK)
- name, description
```

#### **user_roles** (Table de liaison)
```sql
- user_id (FK → users)
- role_id (FK → roles)
```

#### **sessions**
```sql
- session_id (PK)
- user_id (FK → users)
- token, ip_address, user_agent
- expires_at, created_at
```

#### **email_verification_tokens**
```sql
- token_id (PK)
- user_id (FK → users)
- token, expires_at, used
```

---

### **2. PORTFOLIO & TRADING** 💼

#### **portfolios**
```sql
- portfolio_id (PK)
- user_id (FK → users)
- name, description
- initial_balance, current_balance
- total_profit_loss, total_return_percentage
- created_at, updated_at
```

#### **positions**
```sql
- position_id (PK)
- portfolio_id (FK → portfolios)
- asset_id (FK → assets)
- quantity, entry_price, current_price
- unrealized_pnl, realized_pnl
- status (OPEN, CLOSED)
- opened_at, closed_at
```

#### **transactions**
```sql
- transaction_id (PK)
- portfolio_id (FK → portfolios)
- asset_id, transaction_type (BUY, SELL)
- quantity, price, total_amount, fees
- executed_at
```

---

### **3. MARKET DATA** 📊

#### **assets**
```sql
- asset_id (PK)
- symbol (BTC, ETH, AAPL, etc.)
- name, asset_type (CRYPTO, STOCK, FOREX)
- description, market_cap
- is_active, created_at, updated_at
```

#### **market_data**
```sql
- data_id (PK)
- asset_id (FK → assets)
- price, volume, market_cap
- change_24h, high_24h, low_24h
- timestamp
```

#### **ohlcvs** (Open, High, Low, Close, Volume)
```sql
- ohlcv_id (PK)
- asset_id (FK → assets)
- open, high, low, close, volume
- timestamp, timeframe (1m, 5m, 1h, 1d)
```

#### **real_time_quotes**
```sql
- quote_id (PK)
- asset_id (FK → assets)
- bid, ask, last_price
- timestamp
```

---

### **4. TRADING SYSTEM** 📈

#### **orders**
```sql
- order_id (PK)
- portfolio_id (FK → portfolios)
- asset_id (FK → assets)
- order_type (MARKET, LIMIT, STOP_LOSS)
- side (BUY, SELL)
- quantity, price, status
- filled_quantity, average_price
- created_at, executed_at
```

#### **order_books**
```sql
- book_id (PK)
- asset_id (FK → assets)
- side (BUY, SELL)
- price, quantity, total_quantity
- timestamp
```

#### **order_executions**
```sql
- execution_id (PK)
- order_id (FK → orders)
- executed_quantity, execution_price
- fees, executed_at
```

#### **trading_strategies**
```sql
- strategy_id (PK)
- user_id (FK → users)
- name, description, strategy_type
- parameters (JSON), is_active
- performance_metrics (JSON)
```

---

### **5. RISK MANAGEMENT** ⚠️

#### **risk_assessments**
```sql
- assessment_id (PK)
- portfolio_id (FK → portfolios)
- order_id (FK → orders)
- risk_score, volatility, max_drawdown
- var (Value at Risk), sharpe_ratio
- assessed_at
```

#### **risk_limits**
```sql
- limit_id (PK)
- portfolio_id (FK → portfolios)
- max_position_size, max_leverage
- max_daily_loss, max_portfolio_risk
```

#### **stop_losses**
```sql
- stop_loss_id (PK)
- position_id (FK → positions)
- stop_price, trigger_type
- is_active, triggered_at
```

---

### **6. TECHNICAL INDICATORS** 📉

#### **technical_indicators**
```sql
- indicator_id (PK)
- asset_id (FK → assets)
- indicator_type (SMA, EMA, RSI, MACD, etc.)
- parameters (JSON)
- timeframe
```

#### **indicator_values**
```sql
- value_id (PK)
- indicator_id (FK → technical_indicators)
- value, signal (BUY, SELL, NEUTRAL)
- calculated_at
```

#### **charts**
```sql
- chart_id (PK)
- asset_id (FK → assets)
- chart_type (CANDLESTICK, LINE, BAR)
- timeframe, data (JSON)
- created_at
```

---

### **7. AI & PREDICTIONS** 🤖

#### **ai_agents**
```sql
- agent_id (PK)
- name, model_type
- configuration (JSON)
- is_active, performance_score
```

#### **ai_recommendations**
```sql
- recommendation_id (PK)
- agent_id (FK → ai_agents)
- asset_id (FK → assets)
- action (BUY, SELL, HOLD)
- confidence_score, rationale
- created_at
```

#### **market_sentiments**
```sql
- sentiment_id (PK)
- asset_id (FK → assets)
- sentiment_score (-1 to 1)
- source, text_summary
- analyzed_at
```

#### **prediction_models**
```sql
- model_id (PK)
- asset_id (FK → assets)
- model_type, parameters (JSON)
- accuracy, last_trained_at
```

---

### **8. LEARNING SYSTEM** 📚

#### **courses**
```sql
- course_id (PK)
- title, description, difficulty_level
- duration_minutes, is_published
- thumbnail_url
```

#### **lessons**
```sql
- lesson_id (PK)
- course_id (FK → courses)
- title, content, order_index
- video_url, duration_minutes
```

#### **quizzes**
```sql
- quiz_id (PK)
- lesson_id (FK → lessons)
- questions (JSON)
- passing_score
```

#### **user_progress**
```sql
- progress_id (PK)
- user_id (FK → users)
- course_id (FK → courses)
- completed_lessons (JSON)
- quiz_scores (JSON)
- completion_percentage
```

---

### **9. NEWS & EVENTS** 📰

#### **news_articles**
```sql
- article_id (PK)
- title, content, source
- url, image_url, category
- published_at
```

#### **economic_events**
```sql
- event_id (PK)
- title, description, country
- importance (LOW, MEDIUM, HIGH)
- actual_value, forecast_value
- event_time
```

#### **market_news**
```sql
- news_id (PK)
- headline, summary, sentiment
- related_assets (JSON)
- published_at
```

---

### **10. SIMULATION & COMPETITIONS** 🎮

#### **game_rooms**
```sql
- room_id (PK)
- name, max_players, current_players
- status (WAITING, IN_PROGRESS, COMPLETED)
- created_at, started_at
```

#### **trading_scenarios**
```sql
- scenario_id (PK)
- name, description, difficulty
- initial_balance, time_limit
- market_conditions (JSON)
```

#### **competitions**
```sql
- competition_id (PK)
- name, description, start_date, end_date
- prize_pool, max_participants
- rules (JSON)
```

#### **leaderboards**
```sql
- leaderboard_id (PK)
- user_id, competition_id
- score, rank, profit_percentage
- updated_at
```

---

### **11. ADMIN & SYSTEM** 🛠️

#### **admin_dashboards**
```sql
- dashboard_id (PK)
- user_id (FK → users)
- widgets (JSON)
- layout (JSON)
```

#### **system_configurations**
```sql
- config_id (PK)
- key, value, description
- last_modified_by (FK → users)
- updated_at
```

#### **audit_logs**
```sql
- log_id (PK)
- user_id (FK → users)
- action, resource_type, resource_id
- ip_address, user_agent
- created_at
```

#### **system_alerts**
```sql
- alert_id (PK)
- type, severity, message
- created_by (FK → users)
- is_resolved, resolved_at
```

---

### **12. ROULETTE GAME** 🎰

#### **wallets**
```sql
- wallet_id (PK)
- user_id (string, permet demo users)
- balance, currency
- created_at, updated_at
```

#### **roulette_games**
```sql
- game_id (PK)
- user_id (string)
- game_number, result_value, result_type
- multiplier, status, total_bet_amount
- total_payout, created_at, completed_at
```

#### **roulette_bets**
```sql
- bet_id (PK)
- game_id (FK → roulette_games)
- bet_type (BULL, BEAR, SIDEWAYS)
- bet_value, amount, potential_payout
- is_winning, actual_payout
```

#### **jackpots**
```sql
- jackpot_id (PK)
- name, current_amount, max_amount
- contribution_percentage
- last_won_at, last_won_by
```

---

### **13. MATCH-3 GAME** 💎

#### **match3_games**
```sql
- game_id (PK, UUID)
- user_id (string)
- level, score, moves_left, target_score
- board_state (JSON), power_ups (JSON)
- status (IN_PROGRESS, WON, LOST)
- coins_earned, completed_at
```

#### **match3_highscores**
```sql
- score_id (PK, UUID)
- user_id, level, score
- moves_used, coins_earned
- UNIQUE(user_id, level)
```

---

## 🔗 RELATIONS PRINCIPALES

### **Users → Multiple Relations**
```
users
├── hasOne → user_preferences
├── hasMany → sessions
├── hasMany → portfolios
├── hasMany → trading_strategies
├── hasMany → user_progress
├── hasMany → audit_logs
├── hasOne → admin_dashboards
└── belongsToMany → roles (via user_roles)
```

### **Portfolios → Trading**
```
portfolios
├── hasMany → positions
├── hasMany → transactions
├── hasMany → orders
├── hasMany → risk_assessments
└── hasMany → risk_limits
```

### **Assets → Market Data**
```
assets
├── hasMany → market_data
├── hasMany → real_time_quotes
├── hasMany → ohlcvs
├── hasMany → orders
├── hasMany → technical_indicators
├── hasMany → charts
├── hasMany → ai_recommendations
├── hasMany → market_sentiments
└── hasMany → prediction_models
```

### **Learning System**
```
courses
├── hasMany → lessons
└── hasMany → user_progress

lessons
└── hasOne → quizzes
```

### **Game Relations**
```
roulette_games
└── hasMany → roulette_bets
```

---

## 🛣️ ROUTES API

### **Authentification** (`/api/v1/auth`)
```javascript
POST   /register          - Inscription
POST   /login             - Connexion
POST   /logout            - Déconnexion
POST   /refresh-token     - Rafraîchir JWT
POST   /forgot-password   - Mot de passe oublié
POST   /reset-password    - Réinitialiser MDP
POST   /verify-email      - Vérifier email
GET    /me                - Utilisateur actuel
```

### **Users** (`/api/v1/users`)
```javascript
GET    /                  - Liste utilisateurs
GET    /:id               - Détails utilisateur
PUT    /:id               - Mettre à jour
DELETE /:id               - Supprimer
POST   /:id/preferences   - Sauvegarder préférences
GET    /:id/stats         - Statistiques
```

### **Portfolios** (`/api/v1/portfolio`)
```javascript
GET    /                  - Liste portfolios
POST   /                  - Créer portfolio
GET    /:id               - Détails
PUT    /:id               - Mettre à jour
DELETE /:id               - Supprimer
GET    /:id/positions     - Positions
GET    /:id/transactions  - Historique
GET    /:id/performance   - Performance
```

### **Trading** (`/api/v1/orders`)
```javascript
POST   /                  - Créer ordre
GET    /                  - Liste ordres
GET    /:id               - Détails ordre
PUT    /:id/cancel        - Annuler ordre
GET    /pending           - Ordres en attente
GET    /history           - Historique
```

### **Market Data** (`/api/v1/market`)
```javascript
GET    /assets            - Liste assets
GET    /asset/:symbol     - Prix actuel
GET    /ohlcv/:symbol     - Données OHLCV
GET    /quotes/:symbol    - Quotes temps réel
POST   /simulate          - Simuler prix
```

### **Technical Indicators** (`/api/v1/technical-indicator`)
```javascript
GET    /:assetId          - Indicateurs d'un asset
POST   /calculate         - Calculer indicateur
GET    /values/:indicatorId - Valeurs historiques
```

### **Charts** (`/api/v1/chart`)
```javascript
GET    /:assetId          - Charts d'un asset
POST   /                  - Créer chart
```

### **Trading Strategies** (`/api/v1/trading-strategies`)
```javascript
GET    /                  - Liste stratégies
POST   /                  - Créer stratégie
GET    /:id               - Détails
PUT    /:id               - Mettre à jour
DELETE /:id               - Supprimer
POST   /:id/backtest      - Backtesting
```

### **Admin** (`/api/v1/admin`)
```javascript
GET    /dashboard         - Dashboard stats
GET    /users             - Gestion users
GET    /logs              - Audit logs
GET    /config            - Configurations
PUT    /config            - Mettre à jour config
GET    /alerts            - Alertes système
```

### **RSS News** (`/api/v1/rss`)
```javascript
GET    /feeds             - Flux RSS financiers
GET    /latest            - Dernières news
```

### **Roulette Game** (`/api/v1/roulette`)
```javascript
GET    /config            - Configuration
GET    /wallet            - Wallet utilisateur
POST   /game/create       - Créer partie
POST   /game/:id/bet      - Placer pari
POST   /game/:id/spin     - Lancer roulette
GET    /game/:id          - État partie
GET    /stats             - Statistiques
GET    /history           - Historique
GET    /jackpot           - Jackpot actuel
```

### **Match-3 Game** (`/api/v1/match3`)
```javascript
GET    /config            - Configuration
POST   /game/create       - Créer partie
GET    /game/:id          - État partie
POST   /game/:id/move     - Faire mouvement
GET    /stats             - Stats utilisateur
GET    /leaderboard/:level - Classement
```

---

## 🔧 SERVICES (Logique Métier)

### **1. calculator.service.js**
Calculs financiers (ROI, rendement, risque)

### **2. chart.service.js**
Génération et gestion de charts

### **3. data-generator.service.js**
Génération de données de marché simulées

### **4. data-import.service.js**
Import de données depuis CSV/Excel

### **5. email.service.js**
Envoi d'emails (vérification, notifications)

### **6. indicator-value.service.js**
Calcul des valeurs d'indicateurs techniques

### **7. match3.service.js**
Logique du jeu Match-3 (board, matches, scoring)

### **8. ohlcv.service.js**
Gestion des données OHLCV

### **9. order-book.service.js**
Gestion du carnet d'ordres

### **10. order-execution.service.js**
Exécution des ordres

### **11. order.service.js**
Création et gestion des ordres

### **12. portfolio.service.js**
Gestion des portfolios (calcul PnL, performance)

### **13. price.service.js**
Gestion des prix (simulation, historique)

### **14. roulette.service.js**
Logique du jeu roulette (paris, résultats, jackpot)

### **15. rss.service.js**
Parsing de flux RSS financiers

### **16. technical-indicator.service.js**
Calcul d'indicateurs (SMA, EMA, RSI, MACD, etc.)

### **17. time-manager.service.js**
Gestion du temps (zones horaires, horaires de marché)

### **18. trading-strategy.service.js**
Backtesting et exécution de stratégies

---

## 🛡️ MIDDLEWARES

### **1. auth.middleware.js**
Vérification JWT, authentification

### **2. validation.middleware.js**
Validation des entrées (Joi, express-validator)

### **3. upload.middleware.js**
Gestion uploads (Multer)

### **4. rate-limit.middleware.js**
Limitation de requêtes

### **5. error.middleware.js**
Gestion d'erreurs globale

---

## 🔒 SÉCURITÉ

### **Headers de sécurité (Helmet)**
- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security

### **CORS configuré**
- Origines autorisées: localhost, 127.0.0.1
- Méthodes: GET, POST, PUT, DELETE, PATCH, OPTIONS
- Credentials activés

### **Authentification**
- JWT avec expiration
- Refresh tokens
- 2FA avec TOTP (Speakeasy)
- Password hashing (bcrypt)

### **Audit & Logging**
- Tous les logs de connexion
- Actions utilisateurs tracées
- IP et User-Agent enregistrés

---

## ⚙️ CONFIGURATION

### **Variables d'environnement (.env)**
```bash
# Database
HOST=localhost
USER=root
PASSWORD=
DB=finserve

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION=1h
REFRESH_TOKEN_EXPIRATION=7d

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASS=

# Server
PORT=3200
HTTPS_PORT=3443
NODE_ENV=development
```

---

## 🚀 DÉMARRAGE

### **Installation**
```bash
npm install
```

### **Initialiser la DB**
```bash
# Les tables sont créées automatiquement au démarrage
# avec sequelize.sync({ alter: true })
```

### **Seed data**
```bash
npm run seed:auth
node seed-price-data.js
node seed-indicators.js
node seed-test-data.js
```

### **Démarrer**
```bash
npm start
# Server HTTP: http://localhost:3200
# Server HTTPS: https://localhost:3443
```

---

## 📊 POINTS FORTS DE L'ARCHITECTURE

### ✅ **Séparation des responsabilités**
- Controllers → Routes
- Services → Logique métier
- Models → Structure données

### ✅ **Scalabilité**
- Pool de connexions DB configuré
- Compression des réponses
- Cache possible (Redis à ajouter)

### ✅ **Sécurité robuste**
- Helmet, CORS, JWT
- 2FA, Email verification
- Audit logs complets

### ✅ **Modularité**
- Chaque domaine séparé (auth, trading, games)
- Facile d'ajouter de nouveaux modules

### ✅ **Richesse fonctionnelle**
- Trading complet (orders, portfolios)
- AI et predictions
- Learning platform
- 2 jeux (Roulette, Match-3)
- News et market data

---

## 🎯 CE QUE TU AS CONSTRUIT

Un **simulateur de trading financier complet** avec:

1. **💰 Système de trading** - Ordres, portfolios, exécutions
2. **📊 Market data** - Prix temps réel, OHLCV, quotes
3. **📉 Indicateurs techniques** - RSI, MACD, SMA, EMA
4. **🤖 Intelligence artificielle** - Recommandations, prédictions
5. **📚 Plateforme d'apprentissage** - Cours, leçons, quizzes
6. **🎰 Jeux** - Roulette financière + Match-3
7. **⚠️ Risk management** - Stop loss, risk limits
8. **👥 Gestion utilisateurs** - Auth, roles, 2FA
9. **📰 News financières** - RSS, événements économiques
10. **🏆 Compétitions** - Leaderboards, tournois

C'est une **application professionnelle de niveau entreprise**! 🚀

---

**Total:** 
- **86 Tables** de base de données
- **29 Controllers**
- **18 Services**
- **11 Routes**
- **51 Models**

Tu as créé un **écosystème financier complet**! 💪✨

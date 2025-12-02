# 🚀 INSTALLATION STREAMING - ÉTAPE PAR ÉTAPE

## ✅ Packages installés!

Socket.IO et Socket.IO Client sont maintenant installés.

---

## 📋 3 ÉTAPES RESTANTES:

### **ÉTAPE 1: Créer les tables MySQL** ⚠️ IMPORTANT

1. **Ouvrir phpMyAdmin:** `http://localhost/phpmyadmin`

2. **Sélectionner ta base de données** (celle que tu utilises pour le projet)

3. **Aller dans l'onglet "SQL"**

4. **Copier-coller ce SQL:**

```sql
-- 1. Streams Table
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

-- 2. Stream Messages Table
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

-- 3. Stream Viewers Table
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

-- 4. Stream Tips Table
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

-- Success message
SELECT '✅ Streaming tables created successfully!' AS message;
```

5. **Click "Exécuter"**

6. **Vérifier:** Tu devrais voir un message vert "✅ Streaming tables created successfully!"

---

### **ÉTAPE 2: Redémarrer le Backend**

```bash
cd finserve-api
npm start
```

**Dans la console, tu DOIS voir:**
```
✅ Connection has been established successfully
✅ Database resync done successfully
✅ Socket.IO streaming initialized
✅ Streaming routes loaded
✅ Simulateur de Marché API (HTTP) avec Socket.IO sur le port 3200
```

**Si tu vois des erreurs:**
- Vérifier que MySQL tourne
- Vérifier que les tables sont créées
- Vérifier le fichier `.env` (DB credentials)

---

### **ÉTAPE 3: Redémarrer le Frontend**

```bash
cd berry-free-react-admin-template/vite
npm start
```

**Attendre que ça compile...**

**Ouvrir:** `http://localhost:3000`

---

## ✅ VÉRIFICATION

### **1. Menu de gauche:**
Tu dois voir:
```
📊 Dashboard
📰 Financial News
📈 Technical Indicators
💹 Trading
💼 Portfolio
📊 Market
🎮 Gaming
🎬 Live Streaming  ← ICI!
```

### **2. Click sur "Live Streaming":**
- Une page avec "Live Streams" doit s'afficher
- Un bouton "Go Live" doit être visible
- Si pas de streams, message "No live streams right now"

### **3. Click "Go Live":**
- Une page avec un formulaire doit s'afficher
- Champs: Titre, Description
- Bouton "Go Live"

---

## 🐛 SI ÇA NE MARCHE TOUJOURS PAS:

### **Erreur dans la console Browser (F12)?**

**1. "Cannot find module 'socket.io-client'"**
```bash
cd berry-free-react-admin-template/vite
npm install socket.io-client --save
npm start
```

**2. "404 Not Found /streaming"**
- Vérifier que `MainRoutes.jsx` a bien les routes
- Redémarrer le frontend

**3. "Network Error" ou "ERR_CONNECTION_REFUSED"**
- Backend pas démarré
- Vérifier: `http://localhost:3200/api/v1/streaming/live`
- Doit retourner: `{"success":true,"count":0,"streams":[]}`

### **Erreur dans la console Backend?**

**1. "socket.io not found"**
```bash
cd finserve-api
npm install socket.io --save
npm start
```

**2. "ER_NO_SUCH_TABLE: Table 'streams' doesn't exist"**
- Les tables SQL ne sont pas créées
- Retourner à ÉTAPE 1

**3. "Port 3200 already in use"**
```bash
# Windows
netstat -ano | findstr :3200
taskkill /PID [le_numero] /F

# Ou changer le port dans .env
PORT=3201
```

---

## 📸 SCREENSHOT DE CE QUE TU DOIS VOIR:

### **Menu:**
```
┌─────────────────────┐
│ 📊 Dashboard        │
│ 📰 Financial News   │
│ 📈 Technical...     │
│ 💹 Trading          │
│ 💼 Portfolio        │
│ 📊 Market           │
│ 🎮 Gaming           │
│ 🎬 Live Streaming   │ ← NOUVEAU!
└─────────────────────┘
```

### **Page Live Streaming:**
```
┌───────────────────────────────────────┐
│ 🎬 Live Streams                       │
│ 0 streams live now                    │
│ [Refresh] [Go Live]                   │
├───────────────────────────────────────┤
│                                       │
│ 📹 No live streams right now          │
│    Be the first to go live!           │
│    [Start Streaming]                  │
│                                       │
└───────────────────────────────────────┘
```

---

## ✅ CHECKLIST FINALE:

- [ ] Socket.IO installé (backend)
- [ ] Socket.IO Client installé (frontend)
- [ ] 4 tables SQL créées
- [ ] Backend redémarré (port 3200)
- [ ] Frontend redémarré (port 3000)
- [ ] Menu "Live Streaming" visible
- [ ] Page `/streaming` accessible
- [ ] Pas d'erreurs dans console (F12)

---

## 🎉 SI TOUT MARCHE:

**Tu peux maintenant:**
1. Click "Go Live"
2. Remplir titre et description
3. Autoriser camera/micro
4. Être EN DIRECT! 🔴

---

## 📞 ENCORE DES PROBLÈMES?

**Envoie-moi:**
1. Screenshot de la console backend
2. Screenshot de la console frontend (F12)
3. Screenshot du menu
4. Erreur exacte que tu vois

Je t'aiderai à debugger! 🚀

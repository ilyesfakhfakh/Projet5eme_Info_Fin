# 🚀 DÉMARRAGE RAPIDE DU PROJET

## ✅ MÉTHODE SIMPLE (RECOMMANDÉE):

### **Pour démarrer TOUT:**
```
Double-click sur: START_ALL.bat
```

Cela va:
- ✅ Démarrer le Backend (port 3200)
- ✅ Démarrer le Frontend (port 3000)
- ✅ Ouvrir 2 fenêtres de terminal (une pour chaque serveur)

**IMPORTANT:** Ne fermez PAS ces fenêtres tant que vous utilisez l'application!

---

### **Pour arrêter TOUT:**
```
Double-click sur: STOP_ALL.bat
```

Cela va:
- ✅ Arrêter tous les serveurs Node.js
- ✅ Libérer les ports 3000 et 3200

---

## 🔧 MÉTHODE MANUELLE:

### **Démarrer Backend:**
```bash
cd finserve-api
npm start
```

### **Démarrer Frontend (dans un autre terminal):**
```bash
cd berry-free-react-admin-template\vite
npm start
```

### **Arrêter les serveurs:**
```
Ctrl+C dans chaque terminal
```

---

## 🎬 ACCÉDER À L'APPLICATION:

### **URL Principale:**
```
http://localhost:3000/free
```

### **Page Live Streaming:**
```
http://localhost:3000/free/streaming
```

### **Dashboard Streamer:**
```
http://localhost:3000/free/streaming/streamer
```

---

## 🧹 UTILITAIRES:

### **Nettoyer les streams actifs:**
```bash
cd finserve-api
node cleanup-streams.js
```

### **Vérifier les tables DB:**
```bash
cd finserve-api
node check-tables.js
```

### **Tester l'API:**
```bash
cd finserve-api
node test-api.js
```

---

## 🐛 DÉPANNAGE:

### **Erreur "Port already in use":**
```
1. Double-click sur STOP_ALL.bat
2. Attendre 5 secondes
3. Redémarrer avec START_ALL.bat
```

### **Erreur "ERR_CONNECTION_REFUSED":**
```
Les serveurs ne sont pas démarrés!
→ Double-click sur START_ALL.bat
```

### **Stream "already active":**
```bash
1. cd finserve-api
2. node cleanup-streams.js
3. Redémarrer backend: STOP_ALL.bat puis START_ALL.bat
```

### **Page blanche ou erreurs 404:**
```
1. Vérifier que les 2 serveurs tournent
2. Ouvrir: http://localhost:3000/free (avec /free à la fin!)
3. Si problème persiste: F5 pour rafraîchir
```

---

## 📦 PORTS UTILISÉS:

| Service | Port | URL |
|---------|------|-----|
| Backend API | 3200 | http://localhost:3200 |
| Frontend React | 3000 | http://localhost:3000/free |
| Socket.IO | 3200 | http://localhost:3200/streaming |

---

## ✅ CHECKLIST DE DÉMARRAGE:

- [ ] MySQL/XAMPP démarré
- [ ] Double-click sur `START_ALL.bat`
- [ ] Attendre 10 secondes
- [ ] Voir 2 fenêtres de terminal ouvertes
- [ ] Backend dit: "Simulateur de Marché API (HTTP) avec Socket.IO sur le port 3200"
- [ ] Frontend dit: "VITE v7.1.9 ready"
- [ ] Ouvrir: http://localhost:3000/free
- [ ] L'application charge correctement

---

## 🎉 PRÊT À STREAMER!

**Une fois que tout est démarré:**

1. Menu → NEW FEATURES → Live Streaming
2. Click "Go Live"
3. Autoriser caméra/micro
4. Remplir titre et description
5. Click "Start Stream"
6. Vous êtes EN DIRECT! 🔴

---

**BON STREAMING!** 🎬✨

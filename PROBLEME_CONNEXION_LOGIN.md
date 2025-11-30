# 🔴 Problème de Connexion - Diagnostic

## ❌ Erreur Affichée
```
"Erreur de connexion. Vérifiez votre connexion internet."
```

---

## 🔍 Diagnostic

### ✅ Backend Actif
- Le backend est **EN COURS D'EXÉCUTION** sur le port **3200**
- Endpoint: `http://localhost:3200/api/v1`

### ✅ Frontend Configuré
- URL API: `http://localhost:3200/api/v1`
- Frontend: `http://localhost:3000/free`

### ✅ Contrôleur Auth Existe
- Fichier: `finserve-api/app/controllers/auth.controller.js`
- Fonction `login()` existe (ligne 211)

---

## 🐛 Causes Possibles

### 1️⃣ **Aucun Utilisateur dans la Base de Données**
**Probabilité**: ⭐⭐⭐⭐⭐ (TRÈS ÉLEVÉE)

Le problème le plus probable est qu'il n'y a **aucun utilisateur créé** dans la base de données.

**Solution**: Créer un utilisateur de test

```bash
# Dans le dossier finserve-api
cd finserve-api
node scripts/seed-auth.js
```

Ou **s'inscrire** depuis l'interface:
```
http://localhost:3000/free/register
```

---

### 2️⃣ **Problème CORS**
**Probabilité**: ⭐⭐⭐

Le serveur backend peut bloquer les requêtes du frontend.

**Vérification**:
1. Ouvrir le navigateur
2. Appuyer sur `F12` (Dev Tools)
3. Aller sur l'onglet **Console**
4. Essayer de se connecter
5. Chercher des erreurs CORS:
   ```
   Access to XMLHttpRequest blocked by CORS policy
   ```

**Solution**: Vérifier `finserve-api/server.js` pour la configuration CORS

---

### 3️⃣ **Backend ne Répond Pas**
**Probabilité**: ⭐⭐

Le backend tourne mais ne répond pas aux requêtes.

**Test**:
```bash
# Tester l'endpoint manuellement
curl http://localhost:3200/api/v1/auth/login ^
  -X POST ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@test.com\",\"password\":\"password\"}"
```

---

### 4️⃣ **Base de Données non Démarrée**
**Probabilité**: ⭐⭐

MySQL/MariaDB n'est pas démarré.

**Vérification**:
```bash
# Windows
net start MySQL80
# ou
net start MariaDB
```

**Test de connexion**:
```bash
mysql -u root -p
```

---

## ✅ Solutions par Ordre de Priorité

### 🥇 SOLUTION 1: Créer un Utilisateur de Test

#### Option A: Via Script Seed
```bash
cd c:\Users\Admin\Desktop\Projet5eme_Info_Fin-dhie\Projet5eme_Info_Fin-dhie\finserve-api
node scripts/seed-auth.js
```

Ce script va créer:
- Utilisateur: `admin@finserve.com`
- Mot de passe: `admin123`
- Rôles: Admin, User

#### Option B: S'inscrire via l'Interface
1. Aller sur: http://localhost:3000/free/register
2. Remplir le formulaire:
   - Email: `test@test.com`
   - Mot de passe: `password123`
   - Prénom: `Test`
   - Nom: `User`
3. S'inscrire
4. Vérifier l'email (si nécessaire)
5. Se connecter

---

### 🥈 SOLUTION 2: Vérifier les Logs Backend

#### Voir les Logs en Temps Réel
Le terminal où le backend tourne devrait afficher:
```
Tentative de connexion pour l'email: votre-email@example.com
Utilisateur trouvé: Oui/Non
Vérification du mot de passe...
```

**Si aucun log n'apparaît**: Le frontend n'atteint pas le backend.

---

### 🥉 SOLUTION 3: Tester l'Endpoint Directement

#### Via PowerShell
```powershell
# Test de connexion avec un utilisateur fictif
$body = @{
    email = "test@test.com"
    password = "password123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3200/api/v1/auth/login" `
  -Method POST `
  -Body $body `
  -ContentType "application/json"
```

**Résultat Attendu**:
- **200 OK**: Utilisateur trouvé et mot de passe correct
- **401 Unauthorized**: Utilisateur trouvé mais mot de passe incorrect
- **Erreur de connexion**: Backend ne répond pas

---

## 🔧 Vérifications Rapides

### 1. Backend est en Cours d'Exécution?
```bash
netstat -ano | findstr :3200
```
✅ **Résultat**: Oui, le backend tourne (processus 9932)

### 2. Frontend Connecte au Bon Port?
**Fichier**: `berry-free-react-admin-template/vite/.env`
```env
VITE_API_BASE_URL=http://localhost:3200/api/v1
```
✅ **Résultat**: Configuration correcte

### 3. Base de Données Existe?
```bash
mysql -u root -p
USE finserve_db;
SELECT COUNT(*) FROM users;
```

**Si le résultat est 0**: Aucun utilisateur n'existe → Utiliser SOLUTION 1

---

## 📊 Tableau de Diagnostic

| Vérification | État | Action |
|-------------|------|--------|
| Backend actif | ✅ OUI | Rien à faire |
| Configuration API | ✅ OK | Rien à faire |
| Contrôleur login existe | ✅ OUI | Rien à faire |
| Utilisateurs dans DB | ❓ INCONNU | **VÉRIFIER** |
| Logs backend visibles | ❓ INCONNU | **REGARDER TERMINAL** |

---

## 🚀 Action Immédiate Recommandée

### **Étape 1**: Créer un Utilisateur
```bash
cd finserve-api
node scripts/seed-auth.js
```

### **Étape 2**: Essayer de Se Connecter
```
Email: admin@finserve.com
Mot de passe: admin123
```

### **Étape 3**: Si Ça Ne Marche Pas
1. Ouvrir la **Console** du navigateur (F12)
2. Aller sur l'onglet **Network**
3. Essayer de se connecter
4. Regarder la requête `/auth/login`
5. Noter le **Status Code** et la **Réponse**

---

## 📝 Logs à Vérifier

### Dans le Terminal Backend (finserve-api)
```
Tentative de connexion pour l'email: admin@finserve.com
Utilisateur trouvé: Oui
Vérification du mot de passe...
Résultat de la validation: true
```

### Dans la Console Browser (F12)
```
Tentative de connexion avec: { email: 'admin@finserve.com' }
POST http://localhost:3200/api/v1/auth/login 200 OK
```

---

## 💡 Messages d'Erreur Détaillés

### Frontend (src/api/auth.js)
```javascript
// Ligne 62-64
const networkError = new Error('Erreur de connexion. Vérifiez votre connexion internet.');
networkError.code = 'NETWORK_ERROR';
throw networkError;
```

**Ce message apparaît quand**:
- Le backend ne répond pas du tout
- Problème de réseau
- CORS bloque la requête
- Backend crash avant de répondre

---

## 🎯 Solution Rapide en 3 Étapes

### 1️⃣ Vérifier la Base de Données
```bash
# Ouvrir MySQL
mysql -u root -p

# Utiliser la base finserve
USE finserve_db;

# Compter les utilisateurs
SELECT COUNT(*) FROM users;

# Voir les utilisateurs
SELECT email, first_name, last_name FROM users;
```

**Si aucun utilisateur**: Aller à l'étape 2

### 2️⃣ Créer un Utilisateur
```bash
cd finserve-api
node scripts/seed-auth.js
```

**Ou** s'inscrire via: http://localhost:3000/free/register

### 3️⃣ Se Connecter
```
URL: http://localhost:3000/free/login
Email: admin@finserve.com
Password: admin123
```

---

## ✅ Checklist Finale

Avant de demander de l'aide, vérifier:

- [ ] Le backend tourne (`netstat -ano | findstr :3200`)
- [ ] La base de données est accessible (`mysql -u root -p`)
- [ ] Il existe au moins un utilisateur (`SELECT * FROM users;`)
- [ ] La console browser ne montre pas d'erreur CORS
- [ ] Le terminal backend affiche les logs de connexion
- [ ] L'URL API est correcte dans `.env`

---

## 🆘 Besoin d'Aide?

**Fournir ces informations**:

1. **Logs du terminal backend** lors de la tentative de connexion
2. **Console du navigateur** (F12 → Console + Network)
3. **Nombre d'utilisateurs** dans la base (`SELECT COUNT(*) FROM users;`)
4. **Version de Node.js** (`node --version`)
5. **Version de MySQL/MariaDB** (`mysql --version`)

---

## 📌 Résumé

**Problème**: "Erreur de connexion. Vérifiez votre connexion internet."

**Cause la Plus Probable**: Aucun utilisateur dans la base de données

**Solution Immédiate**:
```bash
cd finserve-api
node scripts/seed-auth.js
```

**Puis se connecter avec**:
- Email: `admin@finserve.com`
- Password: `admin123`

---

## 🔍 Pour Aller Plus Loin

### Créer un Utilisateur Manuellement via SQL
```sql
-- Se connecter à MySQL
USE finserve_db;

-- Créer un utilisateur
INSERT INTO users (
  user_id,
  email,
  password_hash,
  first_name,
  last_name,
  is_email_verified,
  created_at,
  updated_at
) VALUES (
  UUID(),
  'test@test.com',
  '$2b$10$YourBcryptHashHere',
  'Test',
  'User',
  1,
  NOW(),
  NOW()
);
```

**Note**: Le hash bcrypt doit être généré avec:
```javascript
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash('password123', 10);
console.log(hash);
```

---

## ✅ Conclusion

Le problème vient très probablement du fait qu'il n'y a **aucun utilisateur** dans la base de données.

**Action**: Lancer le script seed pour créer un utilisateur admin:
```bash
cd finserve-api
node scripts/seed-auth.js
```

Ensuite, se connecter avec `admin@finserve.com` / `admin123`

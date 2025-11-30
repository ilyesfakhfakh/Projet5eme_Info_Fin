# Configuration Base de Données - Guide Rapide

## ⚠️ Erreurs courantes et solutions

### Erreur: "Access denied for user"
```
Access denied for user ''@'localhost' (using password: NO)
```

**Solutions:**

#### 1. Vérifier que MySQL est démarré

**Windows:**
```powershell
# Vérifier le statut
Get-Service MySQL*

# Démarrer MySQL si nécessaire
Start-Service MySQL80  # ou MySQL57, MySQL selon votre version
```

Ou via l'interface graphique:
- Ouvrir "Services" (Win + R, puis `services.msc`)
- Chercher "MySQL"
- Clic droit → Démarrer

#### 2. Vérifier les identifiants dans `.env`

Le fichier `.env` doit contenir:
```
HOST = localhost
DB_USER = root
DB_PASSWORD = 
DB = finserve
```

**Note:** Si votre MySQL a un mot de passe, ajoutez-le après `DB_PASSWORD = `

#### 3. Créer la base de données

Connectez-vous à MySQL:
```bash
mysql -u root -p
```

Puis créez la base de données:
```sql
CREATE DATABASE IF NOT EXISTS finserve;
USE finserve;
SHOW TABLES;
EXIT;
```

#### 4. Vérifier la connexion MySQL

Testez la connexion manuellement:
```bash
mysql -u root -h localhost
```

Si ça fonctionne, votre MySQL est accessible.

## 🔧 Configuration recommandée

### Fichier `.env`
```env
# Port de l'API
PORT = 3200

# Base de Données MySQL
HOST = localhost
DB_USER = root
DB_PASSWORD = votre_mot_de_passe
DB = finserve

# JWT
JWT_SECRET = votre_secret_jwt
```

### Vérifier la configuration

Lancez ce script pour tester:
```bash
npm run test:models
```

Vous devriez voir:
```
🔌 VÉRIFICATION DE LA CONNEXION
✓ Base de données connectée avec succès
   Host: localhost
   Database: finserve
   User: root
```

## 📝 Créer les tables

Si la base de données est vide, synchronisez les modèles:

**Option 1: Démarrer le serveur (recommandé)**
```bash
npm start
```
Le serveur créera automatiquement les tables via Sequelize `sync({ alter: true })`

**Option 2: Migration Sequelize**
```bash
npx sequelize-cli db:migrate
```

## ✅ Checklist de démarrage

- [ ] MySQL est installé et démarré
- [ ] La base de données `finserve` existe
- [ ] Le fichier `.env` est configuré avec les bons identifiants
- [ ] Les tables sont créées (via `npm start` une première fois)
- [ ] Le test de connexion passe: `npm run test:models`

## 🆘 Toujours des problèmes?

1. **Réinitialiser le mot de passe MySQL:**
   ```sql
   ALTER USER 'root'@'localhost' IDENTIFIED BY '';
   FLUSH PRIVILEGES;
   ```

2. **Vérifier le port MySQL:**
   Par défaut c'est 3306. Si différent, ajoutez dans `.env`:
   ```
   DB_PORT = 3307
   ```

3. **Vérifier les logs:**
   Les logs de connexion apparaissent au démarrage du serveur.

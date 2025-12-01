# 🐛 Match-3 Game - Guide de Débogage

## ✅ CORRECTIONS APPLIQUÉES

### 1. **Backend Service** (`match3.service.js`)
- ✅ Ajout de logs détaillés à chaque étape
- ✅ Validation robuste des positions (type, limites)
- ✅ Protection contre les accès invalides au tableau
- ✅ Meilleure gestion des erreurs avec try-catch

### 2. **Frontend HTTP** (`http.js`)
- ✅ Correction de l'extraction du message d'erreur
- ✅ Maintenant cherche `error` ET `message` dans la réponse
- ✅ Logs détaillés des erreurs

### 3. **Frontend Component** (`Match3Game.jsx`)
- ✅ Meilleure extraction du message d'erreur
- ✅ Logs détaillés des erreurs avec détails complets

---

## 🧪 TESTS À EFFECTUER

### **Test 1: Rafraîchir la page**
```
1. Appuyez sur F5 dans votre navigateur
2. Allez sur http://localhost:3000/free/administration
3. Cliquez sur l'onglet "💎 Match-3 Puzzle"
```

### **Test 2: Nouvelle partie**
```
1. Cliquez sur "New Game"
2. Attendez le chargement du plateau
```

### **Test 3: Faire un mouvement valide**
```
1. Cliquez sur une tuile (ex: ligne 0, colonne 0)
2. Cliquez sur une tuile adjacente (ex: ligne 0, colonne 1)
3. Si match → succès ✅
4. Si pas de match → erreur avec message clair ❌
```

---

## 📊 LOGS ATTENDUS

### **Console Backend** (Terminal Node.js)
Quand vous faites un mouvement:
```
[Match-3] makeMove called: {
  gameId: "124ee265-04a4-4f4a-95be-c47671894f78",
  pos1: { row: 0, col: 0 },
  pos2: { row: 0, col: 1 }
}
[Match-3] Board loaded, size: 8
[Match-3] Matches found: 3
[Match-3] Total score gained: 30
[Match-3] Move completed successfully
```

### **Console Frontend** (F12 dans le navigateur)
Succès:
```
[HTTP] POST /match3/game/.../move {body: {...}}
```

Erreur avec message clair:
```
[HTTP Error] POST /match3/game/.../move
{status: 400, statusText: 'Bad Request', error: {...}}
Error details: {
  message: "No matches found - invalid move",
  data: {error: "No matches found - invalid move"},
  status: 400
}
```

---

## 🎯 MESSAGES D'ERREUR POSSIBLES

| Message | Signification | Solution |
|---------|---------------|----------|
| `Game not found` | ID de partie invalide | Créer une nouvelle partie |
| `Game is not in progress` | Partie terminée | Créer une nouvelle partie |
| `No moves left` | Plus de coups disponibles | Partie terminée |
| `Invalid pos1 format` | Position 1 mal formatée | Bug frontend (signaler) |
| `Invalid pos2 format` | Position 2 mal formatée | Bug frontend (signaler) |
| `pos1 is out of bounds` | Position hors plateau | Bug frontend (signaler) |
| `pos2 is out of bounds` | Position hors plateau | Bug frontend (signaler) |
| `Invalid swap - tiles must be adjacent` | Tuiles non adjacentes | Cliquer sur tuiles voisines |
| `No matches found - invalid move` | Aucun match créé | Essayer autre combinaison |

---

## 🔍 DÉBOGAGE AVANCÉ

### **Si l'erreur persiste**

#### 1. Vérifier les serveurs
```powershell
# Backend
netstat -ano | findstr :3200

# Frontend
netstat -ano | findstr :3000
```

#### 2. Vérifier les tables MySQL
```sql
-- Dans phpMyAdmin
SELECT COUNT(*) FROM match3_games;
SELECT COUNT(*) FROM match3_highscores;
```

#### 3. Tester l'API directement
```powershell
# PowerShell - Créer une partie
$body = @{ level = 1 } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3200/api/v1/match3/game/create?userId=demo-user" -Method POST -Body $body -ContentType "application/json"
```

#### 4. Vérifier les logs backend
```powershell
# Dans le terminal où tourne le backend
# Les logs devraient s'afficher automatiquement
```

#### 5. Console navigateur (F12)
```javascript
// Voir les détails complets d'une erreur
// Les logs sont automatiques maintenant
```

---

## 🛠️ SI ÇA NE FONCTIONNE TOUJOURS PAS

### **Informations à fournir:**

1. **Message d'erreur complet** de la console navigateur (F12)
   ```
   Copier tout le bloc d'erreur rouge
   ```

2. **Logs backend** du terminal Node.js
   ```
   Copier les 10-20 dernières lignes
   ```

3. **État du jeu**
   ```
   - Level actuel
   - Score actuel
   - Moves left
   - Positions cliquées (row, col)
   ```

4. **Screenshot** du plateau de jeu si possible

---

## 📝 CHECKLIST DE VÉRIFICATION

Avant de signaler un bug, vérifier:

- [ ] Les deux serveurs tournent (backend :3200, frontend :3000)
- [ ] Les tables MySQL existent (`match3_games`, `match3_highscores`)
- [ ] La page a été rafraîchie après les changements
- [ ] Une nouvelle partie a été créée
- [ ] Les tuiles cliquées sont bien adjacentes
- [ ] La console navigateur (F12) est ouverte pour voir les logs
- [ ] Le terminal backend est visible pour voir les logs

---

## 🎮 RAPPEL: COMMENT JOUER

### **Règles du swap:**
```
✅ VALIDE: Tuiles adjacentes
   [A] [B]  → Horizontal
   
   [A]
   [B]      → Vertical

❌ INVALIDE: Tuiles diagonales ou éloignées
   [A]   [B]  → Diagonal
   
   [A] [ ] [ ] [B]  → Trop loin
```

### **Ce qui crée un match:**
```
Horizontal (3+):
[💰] [💰] [💰]

Vertical (3+):
[💎]
[💎]
[💎]

L ou T (5+):
[📈] [📈] [📈]
      [📈]
      [📈]
```

---

## ✨ AMÉLIORATIONS EN COURS

- [ ] Messages d'erreur plus clairs dans l'UI
- [ ] Animation des erreurs
- [ ] Suggestions de mouvements valides
- [ ] Système de hints
- [ ] Mode tutoriel

---

**🎯 Les serveurs sont redémarrés avec les corrections. Testez maintenant! 💎**

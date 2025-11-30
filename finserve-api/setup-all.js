// Script pour tout configurer d'un coup
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const db = require('./app/models');
const bcrypt = require('bcryptjs');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

async function setupAll() {
  console.log(`${colors.magenta}╔═══════════════════════════════════════════════════════════╗`);
  console.log(`║  CONFIGURATION COMPLÈTE POUR LES TESTS                    ║`);
  console.log(`╚═══════════════════════════════════════════════════════════╝${colors.reset}\n`);

  try {
    // 1. Connexion
    console.log(`${colors.cyan}[1/4] Connexion à la base de données...${colors.reset}`);
    await db.sequelize.authenticate();
    console.log(`${colors.green}✓${colors.reset} Connecté\n`);

    // 2. Créer les tables manquantes
    console.log(`${colors.cyan}[2/4] Création des tables manquantes...${colors.reset}`);
    
    if (db.historical_data) {
      await db.historical_data.sync({ force: false });
      console.log(`${colors.green}✓${colors.reset} Table 'historical_data'`);
    }
    
    if (db.price_alerts) {
      await db.price_alerts.sync({ force: false });
      console.log(`${colors.green}✓${colors.reset} Table 'price_alerts'`);
    }
    console.log();

    // 3. Vérifier/Créer un utilisateur de test
    console.log(`${colors.cyan}[3/4] Vérification des utilisateurs...${colors.reset}`);
    
    let user = await db.users.findOne({ where: { email: 'test@example.com' } });
    
    if (!user) {
      console.log(`${colors.yellow}Aucun utilisateur de test trouvé. Création...${colors.reset}`);
      
      // Créer un rôle USER si nécessaire
      let userRole = await db.roles.findOne({ where: { name: 'USER' } });
      if (!userRole) {
        userRole = await db.roles.create({
          name: 'USER',
          description: 'Standard user role'
        });
        console.log(`${colors.green}✓${colors.reset} Rôle 'USER' créé`);
      }

      // Créer l'utilisateur
      const hashedPassword = await bcrypt.hash('Test123456!', 10);
      user = await db.users.create({
        username: 'testuser',
        email: 'test@example.com',
        password: hashedPassword,
        first_name: 'Test',
        last_name: 'User',
        is_verified: true,
        is_active: true
      });

      // Associer le rôle
      await db.user_roles.create({
        user_id: user.user_id,
        role_id: userRole.role_id
      });

      console.log(`${colors.green}✓${colors.reset} Utilisateur de test créé`);
      console.log(`   Email: test@example.com`);
      console.log(`   Password: Test123456!`);
    } else {
      console.log(`${colors.green}✓${colors.reset} Utilisateur de test déjà existant`);
      console.log(`   Email: ${user.email}`);
    }
    console.log();

    // 4. Vérifier les assets
    console.log(`${colors.cyan}[4/4] Vérification des assets...${colors.reset}`);
    const assetCount = await db.assets.count();
    
    if (assetCount === 0) {
      console.log(`${colors.yellow}Aucun asset trouvé. Création d'un asset de test...${colors.reset}`);
      
      await db.assets.create({
        symbol: 'TEST',
        name: 'Test Asset',
        asset_type: 'STOCK',
        exchange: 'TEST',
        sector: 'Technology',
        is_active: true
      });
      
      console.log(`${colors.green}✓${colors.reset} Asset de test créé (TEST)`);
    } else {
      console.log(`${colors.green}✓${colors.reset} ${assetCount} asset(s) trouvé(s)`);
    }
    console.log();

    // Résumé
    console.log(`${colors.green}╔═══════════════════════════════════════════════════════════╗`);
    console.log(`║  ✓ CONFIGURATION TERMINÉE AVEC SUCCÈS                     ║`);
    console.log(`╚═══════════════════════════════════════════════════════════╝${colors.reset}\n`);

    console.log(`${colors.cyan}Vous pouvez maintenant lancer les tests:${colors.reset}`);
    console.log(`  ${colors.yellow}npm run test:models${colors.reset}\n`);

    console.log(`${colors.cyan}Base de données configurée avec:${colors.reset}`);
    console.log(`  • Tables: historical_data, price_alerts`);
    console.log(`  • Utilisateur: test@example.com / Test123456!`);
    console.log(`  • Assets: ${assetCount > 0 ? assetCount : 1} asset(s)\n`);

  } catch (error) {
    console.error(`${colors.red}✗ Erreur:${colors.reset}`, error.message);
    console.error(error);
  } finally {
    await db.sequelize.close();
    process.exit(0);
  }
}

setupAll();

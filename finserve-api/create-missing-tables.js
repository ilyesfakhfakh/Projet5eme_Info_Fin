// Script pour créer les tables manquantes
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const db = require('./app/models');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function createMissingTables() {
  console.log(`${colors.cyan}╔═══════════════════════════════════════════════════════════╗`);
  console.log(`║  CRÉATION DES TABLES MANQUANTES                           ║`);
  console.log(`╚═══════════════════════════════════════════════════════════╝${colors.reset}\n`);

  try {
    // Vérifier la connexion
    await db.sequelize.authenticate();
    console.log(`${colors.green}✓${colors.reset} Connexion à la base de données réussie\n`);

    // Créer les tables manquantes
    console.log(`${colors.blue}Création des tables...${colors.reset}\n`);

    // Historical Data
    if (db.historical_data) {
      try {
        await db.historical_data.sync({ force: false });
        console.log(`${colors.green}✓${colors.reset} Table 'historical_data' créée/vérifiée`);
      } catch (error) {
        console.log(`${colors.red}✗${colors.reset} Erreur historical_data: ${error.message}`);
      }
    }

    // Price Alerts
    if (db.price_alerts) {
      try {
        await db.price_alerts.sync({ force: false });
        console.log(`${colors.green}✓${colors.reset} Table 'price_alerts' créée/vérifiée`);
      } catch (error) {
        console.log(`${colors.red}✗${colors.reset} Erreur price_alerts: ${error.message}`);
      }
    }

    // Vérifier que les tables existent maintenant
    console.log(`\n${colors.cyan}Vérification des tables...${colors.reset}\n`);

    const [historicalExists] = await db.sequelize.query(
      "SHOW TABLES LIKE 'historical_data'"
    );
    const [priceAlertsExists] = await db.sequelize.query(
      "SHOW TABLES LIKE 'price_alerts'"
    );

    if (historicalExists.length > 0) {
      console.log(`${colors.green}✓${colors.reset} Table 'historical_data' existe`);
    } else {
      console.log(`${colors.red}✗${colors.reset} Table 'historical_data' n'existe pas`);
    }

    if (priceAlertsExists.length > 0) {
      console.log(`${colors.green}✓${colors.reset} Table 'price_alerts' existe`);
    } else {
      console.log(`${colors.red}✗${colors.reset} Table 'price_alerts' n'existe pas`);
    }

    // Afficher la structure des tables
    if (historicalExists.length > 0) {
      console.log(`\n${colors.yellow}Structure de historical_data:${colors.reset}`);
      const [columns] = await db.sequelize.query("DESCRIBE historical_data");
      columns.forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? '(NOT NULL)' : ''}`);
      });
    }

    if (priceAlertsExists.length > 0) {
      console.log(`\n${colors.yellow}Structure de price_alerts:${colors.reset}`);
      const [columns] = await db.sequelize.query("DESCRIBE price_alerts");
      columns.forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? '(NOT NULL)' : ''}`);
      });
    }

    // Vérifier si un utilisateur existe pour les tests
    console.log(`\n${colors.cyan}Vérification des utilisateurs...${colors.reset}\n`);
    const userCount = await db.users.count();
    
    if (userCount === 0) {
      console.log(`${colors.yellow}⚠ Aucun utilisateur trouvé${colors.reset}`);
      console.log(`${colors.yellow}  Pour tester price_alerts, créez un utilisateur avec: npm run seed:auth${colors.reset}`);
    } else {
      console.log(`${colors.green}✓${colors.reset} ${userCount} utilisateur(s) trouvé(s)`);
    }

    console.log(`\n${colors.green}✓ Terminé! Vous pouvez maintenant lancer: npm run test:models${colors.reset}\n`);

  } catch (error) {
    console.error(`${colors.red}Erreur:${colors.reset}`, error.message);
    console.error(error);
  } finally {
    await db.sequelize.close();
    process.exit(0);
  }
}

createMissingTables();

// Script to create ALM tables
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

async function createALMTables() {
  console.log(`${colors.cyan}╔═══════════════════════════════════════════════════════════╗`);
  console.log(`║  CRÉATION DES TABLES ALM                                  ║`);
  console.log(`╚═══════════════════════════════════════════════════════════╝${colors.reset}\n`);

  try {
    // Vérifier la connexion
    await db.sequelize.authenticate();
    console.log(`${colors.green}✓${colors.reset} Connexion à la base de données réussie\n`);

    // Créer les tables ALM
    console.log(`${colors.blue}Création des tables ALM...${colors.reset}\n`);

    // Yield Curves
    if (db.yield_curves) {
      try {
        await db.yield_curves.sync({ force: false });
        console.log(`${colors.green}✓${colors.reset} Table 'yield_curves' créée/vérifiée`);
      } catch (error) {
        console.log(`${colors.red}✗${colors.reset} Erreur yield_curves: ${error.message}`);
      }
    }

    // ALM Positions
    if (db.alm_positions) {
      try {
        await db.alm_positions.sync({ force: false });
        console.log(`${colors.green}✓${colors.reset} Table 'alm_positions' créée/vérifiée`);
      } catch (error) {
        console.log(`${colors.red}✗${colors.reset} Erreur alm_positions: ${error.message}`);
      }
    }

    // Cashflow Projections
    if (db.cashflow_projections) {
      try {
        await db.cashflow_projections.sync({ force: false });
        console.log(`${colors.green}✓${colors.reset} Table 'cashflow_projections' créée/vérifiée`);
      } catch (error) {
        console.log(`${colors.red}✗${colors.reset} Erreur cashflow_projections: ${error.message}`);
      }
    }

    // Interest Rate Sensitivities
    if (db.interest_rate_sensitivities) {
      try {
        await db.interest_rate_sensitivities.sync({ force: false });
        console.log(`${colors.green}✓${colors.reset} Table 'interest_rate_sensitivities' créée/vérifiée`);
      } catch (error) {
        console.log(`${colors.red}✗${colors.reset} Erreur interest_rate_sensitivities: ${error.message}`);
      }
    }

    // Liquidity Gaps
    if (db.liquidity_gaps) {
      try {
        await db.liquidity_gaps.sync({ force: false });
        console.log(`${colors.green}✓${colors.reset} Table 'liquidity_gaps' créée/vérifiée`);
      } catch (error) {
        console.log(`${colors.red}✗${colors.reset} Erreur liquidity_gaps: ${error.message}`);
      }
    }

    // Vérifier que les tables existent maintenant
    console.log(`\n${colors.cyan}Vérification des tables ALM...${colors.reset}\n`);

    const tables = ['yield_curves', 'alm_positions', 'cashflow_projections', 'interest_rate_sensitivities', 'liquidity_gaps'];

    for (const table of tables) {
      try {
        const [exists] = await db.sequelize.query(`SHOW TABLES LIKE '${table}'`);
        if (exists.length > 0) {
          console.log(`${colors.green}✓${colors.reset} Table '${table}' existe`);
        } else {
          console.log(`${colors.red}✗${colors.reset} Table '${table}' n'existe pas`);
        }
      } catch (error) {
        console.log(`${colors.red}✗${colors.reset} Erreur vérification '${table}': ${error.message}`);
      }
    }

    console.log(`\n${colors.green}✓ Terminé! Les tables ALM ont été créées.${colors.reset}\n`);

  } catch (error) {
    console.error(`${colors.red}Erreur:${colors.reset}`, error.message);
    console.error(error);
  } finally {
    await db.sequelize.close();
    process.exit(0);
  }
}

createALMTables();
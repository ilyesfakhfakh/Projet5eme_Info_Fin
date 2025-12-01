// Script to create Risk tables
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

async function createRiskTables() {
  console.log(`${colors.cyan}╔═══════════════════════════════════════════════════════════╗`);
  console.log(`║  CRÉATION DES TABLES RISK                                 ║`);
  console.log(`╚═══════════════════════════════════════════════════════════╝${colors.reset}\n`);

  try {
    // Vérifier la connexion
    await db.sequelize.authenticate();
    console.log(`${colors.green}✓${colors.reset} Connexion à la base de données réussie\n`);

    // Créer les tables Risk
    console.log(`${colors.blue}Création des tables Risk...${colors.reset}\n`);

    // Risk Limits
    if (db.risk_limits) {
      try {
        await db.risk_limits.sync({ force: false });
        console.log(`${colors.green}✓${colors.reset} Table 'risk_limits' créée/vérifiée`);
      } catch (error) {
        console.log(`${colors.red}✗${colors.reset} Erreur risk_limits: ${error.message}`);
      }
    }

    // Risk Metrics
    if (db.risk_metrics) {
      try {
        await db.risk_metrics.sync({ force: false });
        console.log(`${colors.green}✓${colors.reset} Table 'risk_metrics' créée/vérifiée`);
      } catch (error) {
        console.log(`${colors.red}✗${colors.reset} Erreur risk_metrics: ${error.message}`);
      }
    }

    // Risk Alerts
    if (db.risk_alerts) {
      try {
        await db.risk_alerts.sync({ force: false });
        console.log(`${colors.green}✓${colors.reset} Table 'risk_alerts' créée/vérifiée`);
      } catch (error) {
        console.log(`${colors.red}✗${colors.reset} Erreur risk_alerts: ${error.message}`);
      }
    }

    // Risk Logs
    if (db.risk_logs) {
      try {
        await db.risk_logs.sync({ force: false });
        console.log(`${colors.green}✓${colors.reset} Table 'risk_logs' créée/vérifiée`);
      } catch (error) {
        console.log(`${colors.red}✗${colors.reset} Erreur risk_logs: ${error.message}`);
      }
    }

    // Stress Scenarios
    if (db.stress_scenarios) {
      try {
        await db.stress_scenarios.sync({ force: false });
        console.log(`${colors.green}✓${colors.reset} Table 'stress_scenarios' créée/vérifiée`);
      } catch (error) {
        console.log(`${colors.red}✗${colors.reset} Erreur stress_scenarios: ${error.message}`);
      }
    }

    // Vérifier que les tables existent maintenant
    console.log(`\n${colors.cyan}Vérification des tables Risk...${colors.reset}\n`);

    const tables = ['risk_limits', 'risk_metrics', 'risk_alerts', 'risk_logs', 'stress_scenarios'];

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

    console.log(`\n${colors.green}✓ Terminé! Les tables Risk ont été créées.${colors.reset}\n`);

  } catch (error) {
    console.error(`${colors.red}Erreur:${colors.reset}`, error.message);
    console.error(error);
  } finally {
    await db.sequelize.close();
    process.exit(0);
  }
}

createRiskTables();
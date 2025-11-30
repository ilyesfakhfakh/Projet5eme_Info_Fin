// Charger les variables d'environnement
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const db = require('./app/models');

const colors = {
  reset: '\x1b[0m', green: '\x1b[32m', red: '\x1b[31m', 
  yellow: '\x1b[33m', blue: '\x1b[34m', cyan: '\x1b[36m'
};

let totalTests = 0, passedTests = 0, failedTests = 0;

function logTest(name, passed, details = '') {
  totalTests++;
  passed ? passedTests++ : failedTests++;
  console.log(`${passed ? colors.green + '✓' : colors.red + '✗'}${colors.reset} ${name} ${details}`);
}

function logSection(name) {
  console.log(`\n${colors.cyan}${'='.repeat(70)}\n${name}\n${'='.repeat(70)}${colors.reset}\n`);
}

const createdIds = {
  assets: [], marketData: [], realtimeQuotes: [], historicalData: [], priceAlerts: [],
  economicEvents: [], marketNews: [], newsArticles: []
};

// ===== MARKET MODELS (5 fichiers) =====

async function testAssetModel() {
  logSection('📊 TEST 1/8: Asset Model');
  try {
    const asset = await db.assets.create({
      symbol: `TEST${Date.now()}`, name: 'Test Asset', asset_type: 'STOCK',
      exchange: 'NYSE', sector: 'Technology', market_cap: 1000000000
    });
    createdIds.assets.push(asset.asset_id);
    logTest('CREATE Asset', true, `ID: ${asset.asset_id}`);
    
    const found = await db.assets.findByPk(asset.asset_id);
    logTest('READ Asset', found !== null);
    
    await found.update({ market_cap: 2000000000 });
    logTest('UPDATE Asset', true);
    
    const all = await db.assets.findAll({ limit: 5 });
    logTest('FIND ALL Assets', all.length > 0, `${all.length} found`);
  } catch (error) {
    logTest('Asset Model', false, error.message);
  }
}

async function testMarketDataModel() {
  logSection('📈 TEST 2/8: Market Data Model');
  try {
    const asset = await db.assets.findOne();
    if (!asset) throw new Error('No asset available');
    
    const data = await db.market_data.create({
      asset_id: asset.asset_id, timestamp: new Date(),
      open_price: 100.50, high_price: 105, low_price: 99, close_price: 103,
      volume: 1500000, adjusted_close: 103, change: 2.50, change_percent: 2.48
    });
    createdIds.marketData.push(data.data_id);
    logTest('CREATE Market Data', true, `ID: ${data.data_id}`);
    
    const found = await db.market_data.findByPk(data.data_id);
    logTest('READ Market Data', found !== null);
    
    await found.update({ close_price: 104.50 });
    logTest('UPDATE Market Data', true);
    
    const byAsset = await db.market_data.findAll({ where: { asset_id: asset.asset_id }, limit: 5 });
    logTest('FIND by Asset', byAsset.length > 0);
  } catch (error) {
    logTest('Market Data Model', false, error.message);
  }
}

async function testRealtimeQuoteModel() {
  logSection('⚡ TEST 3/8: Realtime Quote Model');
  try {
    const asset = await db.assets.findOne();
    if (!asset) throw new Error('No asset available');
    
    const quote = await db.real_time_quotes.create({
      asset_id: asset.asset_id, timestamp: new Date(),
      current_price: 150.25, bid_price: 150.20, ask_price: 150.30,
      volume: 500000, change: 1.25, change_percent: 0.84
    });
    createdIds.realtimeQuotes.push(quote.quote_id);
    logTest('CREATE Quote', true, `ID: ${quote.quote_id}`);
    
    const found = await db.real_time_quotes.findByPk(quote.quote_id);
    logTest('READ Quote', found !== null);
    
    await found.update({ current_price: 151.00 });
    logTest('UPDATE Quote', true);
    
    const latest = await db.real_time_quotes.findAll({ order: [['timestamp', 'DESC']], limit: 5 });
    logTest('FIND Latest Quotes', latest.length > 0);
  } catch (error) {
    logTest('Realtime Quote Model', false, error.message);
  }
}

async function testHistoricalDataModel() {
  logSection('📉 TEST 4/8: Historical Data Model');
  try {
    if (!db.historical_data) {
      logTest('Historical Data Model', false, 'Model not available');
      return;
    }
    const asset = await db.assets.findOne();
    if (!asset) throw new Error('No asset available');
    
    const data = await db.historical_data.create({
      asset_id: asset.asset_id,
      date: new Date('2024-01-15'),
      open_price: 95,
      high_price: 98.50,
      low_price: 94,
      close_price: 97.25,
      volume: 2500000,
      adjusted_close: 97.25
    });
    createdIds.historicalData.push(data.history_id);
    logTest('CREATE Historical Data', true, `ID: ${data.history_id}`);
    
    const found = await db.historical_data.findByPk(data.history_id);
    logTest('READ Historical Data', found !== null);
    
    await found.update({ close_price: 98.00 });
    logTest('UPDATE Historical Data', true);
    
    const byAsset = await db.historical_data.findAll({
      where: { asset_id: asset.asset_id },
      order: [['date', 'DESC']],
      limit: 5
    });
    logTest('FIND by Asset', true, `${byAsset.length} records`);
  } catch (error) {
    logTest('Historical Data Model', false, error.message);
  }
}

async function testPriceAlertModel() {
  logSection('🔔 TEST 5/8: Price Alert Model');
  try {
    if (!db.price_alerts) {
      logTest('Price Alert Model', false, 'Model not available');
      return;
    }
    const asset = await db.assets.findOne();
    const user = await db.users.findOne();
    if (!asset || !user) throw new Error('Asset or User not available');
    
    const alert = await db.price_alerts.create({
      user_id: user.user_id,
      asset_id: asset.asset_id,
      target_price: 175.00,
      alert_type: 'ABOVE',
      is_active: true
    });
    createdIds.priceAlerts.push(alert.alert_id);
    logTest('CREATE Alert', true, `ID: ${alert.alert_id}`);
    
    const found = await db.price_alerts.findByPk(alert.alert_id);
    logTest('READ Alert', found !== null);
    
    await found.update({ target_price: 180.00, is_active: false });
    logTest('UPDATE Alert', true);
    
    const byUser = await db.price_alerts.findAll({ where: { user_id: user.user_id }, limit: 5 });
    logTest('FIND by User', true, `${byUser.length} alerts`);
    
    const active = await db.price_alerts.findAll({ where: { is_active: true }, limit: 5 });
    logTest('FIND Active Alerts', true, `${active.length} active`);
  } catch (error) {
    logTest('Price Alert Model', false, error.message);
  }
}

// ===== NEWS MODELS (3 fichiers) =====

async function testEconomicEventModel() {
  logSection('📅 TEST 6/8: Economic Event Model');
  try {
    const event = await db.economic_events.create({
      event_name: 'Test Fed Meeting', description: 'Interest rate decision',
      scheduled_date: new Date('2024-03-20'), importance: 'HIGH',
      country: 'United States', event_category: 'Monetary Policy',
      forecast_value: 5.50
    });
    createdIds.economicEvents.push(event.event_id);
    logTest('CREATE Event', true, `ID: ${event.event_id}`);
    
    const found = await db.economic_events.findByPk(event.event_id);
    logTest('READ Event', found !== null);
    
    await found.update({ actual_value: 5.50 });
    logTest('UPDATE Event', true);
    
    const highImp = await db.economic_events.findAll({ where: { importance: 'HIGH' }, limit: 5 });
    logTest('FIND High Importance', true, `${highImp.length} events`);
  } catch (error) {
    logTest('Economic Event Model', false, error.message);
  }
}

async function testMarketNewsModel() {
  logSection('📰 TEST 7/8: Market News Model');
  try {
    const news = await db.market_news.create({
      headline: 'Test Market Rally',
      content: 'Markets reach new highs as investors show confidence...',
      priority: 'HIGH',
      tags: JSON.stringify(['market', 'rally', 'stocks'])
    });
    createdIds.marketNews.push(news.news_id);
    logTest('CREATE News', true, `ID: ${news.news_id}`);
    
    const found = await db.market_news.findByPk(news.news_id);
    logTest('READ News', found !== null);
    
    await found.update({ priority: 'MEDIUM' });
    logTest('UPDATE News', true);
    
    const byPriority = await db.market_news.findAll({ where: { priority: 'HIGH' }, limit: 5 });
    logTest('FIND by Priority', true, `${byPriority.length} news`);
  } catch (error) {
    logTest('Market News Model', false, error.message);
  }
}

async function testNewsArticleModel() {
  logSection('📄 TEST 8/8: News Article Model');
  try {
    const article = await db.news_articles.create({
      title: 'Test Analysis Article',
      content: 'In-depth market volatility analysis and investment strategies...',
      summary: 'Market analysis for investors',
      author: 'Test Author',
      source: 'Test Financial Journal',
      category: 'MARKET',
      sentiment: 'neutral',
      impact_level: 'medium',
      related_assets: JSON.stringify(['AAPL', 'MSFT', 'GOOGL'])
    });
    createdIds.newsArticles.push(article.article_id);
    logTest('CREATE Article', true, `ID: ${article.article_id}`);
    
    const found = await db.news_articles.findByPk(article.article_id);
    logTest('READ Article', found !== null);
    
    await found.update({ sentiment: 'positive', impact_level: 'high' });
    logTest('UPDATE Article', true);
    
    const byCategory = await db.news_articles.findAll({ where: { category: 'MARKET' }, limit: 5 });
    logTest('FIND by Category', true, `${byCategory.length} articles`);
  } catch (error) {
    logTest('News Article Model', false, error.message);
  }
}

async function cleanup() {
  logSection('🧹 NETTOYAGE');
  try {
    let count = 0;
    if (createdIds.priceAlerts.length && db.price_alerts) count += await db.price_alerts.destroy({ where: { alert_id: createdIds.priceAlerts }});
    if (createdIds.historicalData.length && db.historical_data) count += await db.historical_data.destroy({ where: { history_id: createdIds.historicalData }});
    if (createdIds.realtimeQuotes.length) count += await db.real_time_quotes.destroy({ where: { quote_id: createdIds.realtimeQuotes }});
    if (createdIds.marketData.length) count += await db.market_data.destroy({ where: { data_id: createdIds.marketData }});
    if (createdIds.assets.length) count += await db.assets.destroy({ where: { asset_id: createdIds.assets }});
    if (createdIds.newsArticles.length) count += await db.news_articles.destroy({ where: { article_id: createdIds.newsArticles }});
    if (createdIds.marketNews.length) count += await db.market_news.destroy({ where: { news_id: createdIds.marketNews }});
    if (createdIds.economicEvents.length) count += await db.economic_events.destroy({ where: { event_id: createdIds.economicEvents }});
    console.log(`${colors.green}✓${colors.reset} Supprimé ${count} enregistrements`);
  } catch (error) {
    console.error(`${colors.red}Erreur:${colors.reset}`, error.message);
  }
}

function displaySummary() {
  logSection('📊 RÉSUMÉ FINAL');
  console.log(`${colors.blue}MARKET MODELS (5):${colors.reset} Asset, MarketData, RealtimeQuote, HistoricalData, PriceAlert`);
  console.log(`${colors.blue}NEWS MODELS (3):${colors.reset} EconomicEvent, MarketNews, NewsArticle\n`);
  console.log(`Total: ${colors.blue}${totalTests}${colors.reset}`);
  console.log(`Réussis: ${colors.green}${passedTests}${colors.reset}`);
  console.log(`Échoués: ${colors.red}${failedTests}${colors.reset}`);
  const rate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(2) : 0;
  console.log(`Taux: ${rate >= 80 ? colors.green : colors.red}${rate}%${colors.reset}\n`);
}

async function checkDatabaseConnection() {
  logSection('🔌 VÉRIFICATION DE LA CONNEXION');
  try {
    await db.sequelize.authenticate();
    console.log(`${colors.green}✓${colors.reset} Base de données connectée avec succès`);
    console.log(`   Host: ${process.env.HOST || 'localhost'}`);
    console.log(`   Database: ${process.env.DB || 'finserve'}`);
    console.log(`   User: ${process.env.USER || 'root'}`);
    return true;
  } catch (error) {
    console.log(`${colors.red}✗ Échec de connexion à la base de données${colors.reset}`);
    console.log(`   Erreur: ${error.message}`);
    console.log(`\n${colors.yellow}Vérifiez:${colors.reset}`);
    console.log(`   1. MySQL est démarré`);
    console.log(`   2. Les identifiants dans .env sont corrects`);
    console.log(`   3. La base de données '${process.env.DB || 'finserve'}' existe`);
    return false;
  }
}

async function runTests() {
  console.log(`${colors.cyan}╔═══════════════════════════════════════════════════════════╗`);
  console.log(`║  TEST MODELS: MARKET (5) + NEWS (3)                       ║`);
  console.log(`╚═══════════════════════════════════════════════════════════╝${colors.reset}\n`);
  
  try {
    // Vérifier la connexion d'abord
    const connected = await checkDatabaseConnection();
    if (!connected) {
      console.log(`\n${colors.red}Tests annulés: Base de données non accessible${colors.reset}\n`);
      process.exit(1);
    }

    await testAssetModel();
    await testMarketDataModel();
    await testRealtimeQuoteModel();
    await testHistoricalDataModel();
    await testPriceAlertModel();
    await testEconomicEventModel();
    await testMarketNewsModel();
    await testNewsArticleModel();
    await cleanup();
    displaySummary();
  } catch (error) {
    console.error(`${colors.red}Erreur:${colors.reset}`, error.message);
  }
}

runTests().then(() => process.exit(failedTests > 0 ? 1 : 0))
  .catch(err => { console.error(err); process.exit(1); });

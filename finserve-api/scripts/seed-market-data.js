const axios = require('axios');

const API_BASE_URL = 'http://localhost:3200/api';

// Fonction pour créer un délai
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Données de test pour Assets
const assetsData = [
  { symbol: 'AAPL', name: 'Apple Inc.', asset_type: 'STOCK', exchange: 'NASDAQ', sector: 'Technology', industry: 'Consumer Electronics', market_cap: 2800000000000, description: 'Apple designs and manufactures consumer electronics and software', is_active: true },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', asset_type: 'STOCK', exchange: 'NASDAQ', sector: 'Technology', industry: 'Internet Services', market_cap: 1700000000000, description: 'Google parent company', is_active: true },
  { symbol: 'MSFT', name: 'Microsoft Corporation', asset_type: 'STOCK', exchange: 'NASDAQ', sector: 'Technology', industry: 'Software', market_cap: 2500000000000, description: 'Microsoft develops software and cloud services', is_active: true },
  { symbol: 'TSLA', name: 'Tesla Inc.', asset_type: 'STOCK', exchange: 'NASDAQ', sector: 'Automotive', industry: 'Electric Vehicles', market_cap: 800000000000, description: 'Tesla manufactures electric vehicles', is_active: true },
  { symbol: 'BTC', name: 'Bitcoin', asset_type: 'CRYPTO', exchange: 'BINANCE', sector: 'Cryptocurrency', industry: 'Digital Currency', market_cap: 800000000000, description: 'Leading cryptocurrency', is_active: true },
  { symbol: 'ETH', name: 'Ethereum', asset_type: 'CRYPTO', exchange: 'BINANCE', sector: 'Cryptocurrency', industry: 'Smart Contracts', market_cap: 400000000000, description: 'Smart contract platform', is_active: true },
  { symbol: 'EUR/USD', name: 'Euro US Dollar', asset_type: 'FOREX', exchange: 'FOREX', sector: 'Currency', industry: 'Foreign Exchange', market_cap: 0, description: 'Major currency pair', is_active: true },
  { symbol: 'GBP/USD', name: 'British Pound US Dollar', asset_type: 'FOREX', exchange: 'FOREX', sector: 'Currency', industry: 'Foreign Exchange', market_cap: 0, description: 'Cable currency pair', is_active: true },
  { symbol: 'GOLD', name: 'Gold', asset_type: 'COMMODITY', exchange: 'COMEX', sector: 'Metals', industry: 'Precious Metals', market_cap: 0, description: 'Gold commodity', is_active: true },
  { symbol: 'OIL', name: 'Crude Oil', asset_type: 'COMMODITY', exchange: 'NYMEX', sector: 'Energy', industry: 'Petroleum', market_cap: 0, description: 'Crude oil futures', is_active: true },
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF', asset_type: 'INDEX', exchange: 'NYSE', sector: 'Index Fund', industry: 'ETF', market_cap: 400000000000, description: 'S&P 500 Index tracker', is_active: true },
  { symbol: 'US10Y', name: 'US 10-Year Treasury', asset_type: 'BOND', exchange: 'BOND', sector: 'Government', industry: 'Treasury Bonds', market_cap: 0, description: 'US 10-year government bond', is_active: true },
];

// Fonction pour générer des Market Data
function generateMarketData(assetId, count = 30) {
  const data = [];
  const basePrice = Math.random() * 1000 + 50; // Prix de base entre 50 et 1050
  
  for (let i = 0; i < count; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (count - i));
    
    const volatility = Math.random() * 0.05; // 5% de volatilité
    const change = (Math.random() - 0.5) * 2 * volatility;
    const price = basePrice * (1 + change * i * 0.1);
    const open = price * (1 + (Math.random() - 0.5) * 0.02);
    const high = Math.max(open, price) * (1 + Math.random() * 0.03);
    const low = Math.min(open, price) * (1 - Math.random() * 0.03);
    const volume = Math.floor(Math.random() * 10000000) + 1000000;
    
    data.push({
      asset_id: assetId,
      price: price.toFixed(2),
      open_price: open.toFixed(2),
      high_price: high.toFixed(2),
      low_price: low.toFixed(2),
      close_price: price.toFixed(2),
      volume: volume,
      change_amount: (price - open).toFixed(2),
      change_percentage: ((price - open) / open * 100).toFixed(2),
      timestamp: date.toISOString()
    });
  }
  
  return data;
}

// Fonction pour générer des Historical Data
function generateHistoricalData(assetId, count = 90) {
  const data = [];
  const basePrice = Math.random() * 1000 + 50;
  
  for (let i = 0; i < count; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (count - i));
    
    const dailyChange = (Math.random() - 0.5) * 0.05;
    const price = basePrice * (1 + dailyChange * i * 0.01);
    const open = price * (1 + (Math.random() - 0.5) * 0.02);
    const high = Math.max(open, price) * (1 + Math.random() * 0.03);
    const low = Math.min(open, price) * (1 - Math.random() * 0.03);
    const close = price;
    const volume = Math.floor(Math.random() * 10000000) + 1000000;
    
    data.push({
      asset_id: assetId,
      date: date.toISOString().split('T')[0],
      open_price: open.toFixed(2),
      high_price: high.toFixed(2),
      low_price: low.toFixed(2),
      close_price: close.toFixed(2),
      volume: volume,
      adjusted_close: (close * 0.98).toFixed(2)
    });
  }
  
  return data;
}

// Fonction pour générer des Price Alerts
function generatePriceAlerts(assetId, userId = 1) {
  const alertTypes = ['ABOVE', 'BELOW', 'PERCENTAGE_CHANGE'];
  const messages = [
    'Alert me when price reaches target',
    'Important price level notification',
    'Stop loss alert',
    'Take profit notification',
    'Breakout alert'
  ];
  
  return {
    asset_id: assetId,
    user_id: userId,
    alert_type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
    target_price: (Math.random() * 1000 + 50).toFixed(2),
    is_active: Math.random() > 0.3,
    is_triggered: Math.random() > 0.8,
    message: messages[Math.floor(Math.random() * messages.length)]
  };
}

// Fonction principale
async function seedMarketData() {
  console.log('🚀 Starting Market Data Seeding...\n');
  
  try {
    // 1. Créer les Assets
    console.log('📊 Creating Assets...');
    const createdAssets = [];
    for (const asset of assetsData) {
      try {
        const response = await axios.post(`${API_BASE_URL}/assets`, asset);
        createdAssets.push(response.data);
        console.log(`✅ Created: ${asset.symbol} - ${asset.name}`);
        await delay(100);
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          console.log(`❌ Cannot connect to API! Is the server running on ${API_BASE_URL}?`);
          process.exit(1);
        }
        console.log(`⚠️  ${asset.symbol} might already exist or error: ${error.response?.data?.message || error.message}`);
      }
    }
    
    console.log(`\n✅ Assets created: ${createdAssets.length}\n`);
    
    // Récupérer tous les assets existants
    let allAssets = [];
    try {
      const assetsResponse = await axios.get(`${API_BASE_URL}/assets`);
      allAssets = assetsResponse.data || [];
      console.log(`📋 Total assets in database: ${allAssets.length}\n`);
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.error('\n❌ ERROR: Cannot connect to API!');
        console.error(`   Make sure your API is running on ${API_BASE_URL}`);
        console.error('   Start it with: npm start\n');
        process.exit(1);
      }
      console.error('Error fetching assets:', error.message);
      process.exit(1);
    }
    
    // 2. Créer Market Data pour chaque asset
    console.log('📈 Creating Market Data...');
    let marketDataCount = 0;
    for (const asset of allAssets.slice(0, 8)) { // Limiter à 8 assets pour ne pas surcharger
      const marketDataList = generateMarketData(asset.asset_id, 20);
      for (const data of marketDataList) {
        try {
          await axios.post(`${API_BASE_URL}/market-data`, data);
          marketDataCount++;
        } catch (error) {
          // Ignorer les erreurs de duplication
        }
      }
      console.log(`✅ Created market data for ${asset.symbol}: 20 entries`);
      await delay(200);
    }
    console.log(`\n✅ Total Market Data created: ${marketDataCount}\n`);
    
    // 3. Créer Historical Data pour chaque asset
    console.log('📊 Creating Historical Data...');
    let historicalCount = 0;
    for (const asset of allAssets.slice(0, 6)) { // Limiter à 6 assets
      const historicalDataList = generateHistoricalData(asset.asset_id, 30);
      for (const data of historicalDataList) {
        try {
          await axios.post(`${API_BASE_URL}/historical-data`, data);
          historicalCount++;
        } catch (error) {
          // Ignorer les erreurs
        }
      }
      console.log(`✅ Created historical data for ${asset.symbol}: 30 entries`);
      await delay(200);
    }
    console.log(`\n✅ Total Historical Data created: ${historicalCount}\n`);
    
    // 4. Créer Price Alerts
    console.log('🔔 Creating Price Alerts...');
    let alertsCount = 0;
    for (const asset of allAssets.slice(0, 10)) {
      // Créer 2-3 alertes par asset
      const numAlerts = Math.floor(Math.random() * 2) + 2;
      for (let i = 0; i < numAlerts; i++) {
        try {
          const alert = generatePriceAlerts(asset.asset_id);
          await axios.post(`${API_BASE_URL}/price-alerts`, alert);
          alertsCount++;
        } catch (error) {
          // Ignorer les erreurs
        }
      }
      console.log(`✅ Created alerts for ${asset.symbol}: ${numAlerts} alerts`);
      await delay(100);
    }
    console.log(`\n✅ Total Price Alerts created: ${alertsCount}\n`);
    
    // Résumé final
    console.log('\n' + '='.repeat(50));
    console.log('🎉 MARKET DATA SEEDING COMPLETED!');
    console.log('='.repeat(50));
    console.log(`📊 Assets: ${allAssets.length}`);
    console.log(`📈 Market Data: ${marketDataCount}`);
    console.log(`📊 Historical Data: ${historicalCount}`);
    console.log(`🔔 Price Alerts: ${alertsCount}`);
    console.log('='.repeat(50) + '\n');
    
  } catch (error) {
    console.error('❌ Error during seeding:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Exécuter le script
seedMarketData();

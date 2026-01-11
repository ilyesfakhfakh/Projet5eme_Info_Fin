const db = require('../models');
const Asset = db.assets;
const MarketData = db.market_data;

// Cache des prix actuels pour la simulation
const currentPrices = {};

// Initialiser les prix à partir de la base de données
const initializePrices = async () => {
  try {
    // Vérifier si les modèles sont disponibles
    if (!db.assets || !db.market_data) {
      console.log('⏳ Base de données pas encore prête, utilisation de données par défaut...');
      return;
    }

    const assets = await Asset.findAll();
    const latestData = await MarketData.findAll({
      order: [['timestamp', 'DESC']],
      limit: assets.length
    });

    latestData.forEach((data) => {
      if (!currentPrices[data.asset_id]) {
        currentPrices[data.asset_id] = {
          price: parseFloat(data.close_price) || 100,
          volume: parseFloat(data.volume) || 1000000,
          open: parseFloat(data.open_price) || 100,
          high: parseFloat(data.high_price) || 100,
          low: parseFloat(data.low_price) || 100
        };
      }
    });

    // Si certains assets n'ont pas de prix, en créer
    assets.forEach((asset) => {
      if (!currentPrices[asset.asset_id]) {
        currentPrices[asset.asset_id] = {
          price: 100,
          volume: 1000000,
          open: 100,
          high: 100,
          low: 100
        };
      }
    });

    console.log(`✅ Prix initialisés pour ${Object.keys(currentPrices).length} assets`);
  } catch (error) {
    console.error("⚠️ Erreur lors de l'initialisation des prix:", error.message);
  }
};

// Générer une variation de prix réaliste
const generatePriceChange = (currentPrice, volatility = 0.02) => {
  const change = (Math.random() - 0.5) * 2 * volatility * currentPrice;
  return change;
};

// Générer une mise à jour de marché pour tous les assets
const generateMarketUpdate = () => {
  const updates = [];

  // Si aucun prix n'est initialisé, créer des assets par défaut
  if (Object.keys(currentPrices).length === 0) {
    // Créer quelques assets de démonstration
    const demoAssets = ['DEMO-1', 'DEMO-2', 'DEMO-3', 'DEMO-4'];
    demoAssets.forEach((assetId, index) => {
      currentPrices[assetId] = {
        price: 100 + index * 50,
        volume: 1000000 + index * 500000,
        open: 100 + index * 50,
        high: 100 + index * 50,
        low: 100 + index * 50
      };
    });
    console.log('📊 Assets de démonstration créés pour la simulation');
  }

  for (const assetId in currentPrices) {
    const current = currentPrices[assetId];
    const change = generatePriceChange(current.price);
    const newPrice = current.price + change;

    // Mettre à jour high/low
    current.high = Math.max(current.high, newPrice);
    current.low = Math.min(current.low, newPrice);

    // Générer un nouveau volume
    const volumeChange = (Math.random() - 0.5) * 0.1;
    current.volume = current.volume * (1 + volumeChange);

    // Mettre à jour le prix
    current.price = newPrice;

    const changePercent = ((newPrice - current.open) / current.open) * 100;

    updates.push({
      asset_id: assetId,
      price: newPrice.toFixed(2),
      open_price: current.open.toFixed(2),
      high_price: current.high.toFixed(2),
      low_price: current.low.toFixed(2),
      close_price: newPrice.toFixed(2),
      volume: Math.floor(current.volume),
      change: change.toFixed(2),
      change_percent: changePercent.toFixed(2),
      timestamp: new Date().toISOString()
    });
  }

  return updates;
};

// Envoyer les données initiales
const sendInitialData = async (socket) => {
  try {
    const assets = await Asset.findAll();
    const marketData = await MarketData.findAll({
      order: [['timestamp', 'DESC']],
      limit: 100
    });

    socket.emit('initial-market-data', {
      assets,
      marketData
    });
  } catch (error) {
    console.error("Erreur lors de l'envoi des données initiales:", error);
    socket.emit('error', { message: 'Erreur lors du chargement des données' });
  }
};

// Générer des données historiques pour les charts
const getHistoricalData = async (assetId, period = '1D') => {
  try {
    let hoursAgo = 24;

    switch (period) {
      case '1H':
        hoursAgo = 1;
        break;
      case '4H':
        hoursAgo = 4;
        break;
      case '1D':
        hoursAgo = 24;
        break;
      case '1W':
        hoursAgo = 168;
        break;
      case '1M':
        hoursAgo = 720;
        break;
      default:
        hoursAgo = 24;
    }

    const startDate = new Date();
    startDate.setHours(startDate.getHours() - hoursAgo);

    const data = await MarketData.findAll({
      where: {
        asset_id: assetId,
        timestamp: {
          [db.Sequelize.Op.gte]: startDate
        }
      },
      order: [['timestamp', 'ASC']],
      limit: 100
    });

    // Si pas assez de données, générer des données simulées
    if (data.length < 10) {
      return generateSimulatedHistoricalData(assetId, hoursAgo);
    }

    return data;
  } catch (error) {
    console.error('Erreur lors de la récupération des données historiques:', error);
    return [];
  }
};

// Générer des données historiques simulées
const generateSimulatedHistoricalData = (assetId, hours) => {
  const data = [];
  const now = new Date();
  const basePrice = currentPrices[assetId]?.price || 100;
  let price = basePrice * 0.95; // Commencer à 95% du prix actuel

  const points = Math.min(hours, 100);
  const interval = (hours * 60 * 60 * 1000) / points;

  for (let i = 0; i < points; i++) {
    const timestamp = new Date(now.getTime() - (points - i) * interval);
    const change = generatePriceChange(price, 0.01);
    price += change;

    data.push({
      asset_id: assetId,
      timestamp: timestamp.toISOString(),
      open_price: price,
      high_price: price * 1.005,
      low_price: price * 0.995,
      close_price: price,
      volume: Math.floor(Math.random() * 1000000) + 500000
    });
  }

  return data;
};

// Ne pas initialiser immédiatement - attendre que la DB soit prête
// L'initialisation sera appelée depuis socket-manager.js

module.exports = {
  generateMarketUpdate,
  sendInitialData,
  getHistoricalData,
  initializePrices
};

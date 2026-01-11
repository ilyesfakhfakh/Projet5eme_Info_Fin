const { Server } = require('socket.io');
const marketDataSimulator = require('./market-data-simulator');
const newsSimulator = require('./news-simulator');

let io;
let marketInterval;
let newsInterval;

const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connecté:', socket.id);

    // Rejoindre la room market-data
    socket.on('join-market-data', () => {
      socket.join('market-data');
      console.log(`Socket ${socket.id} a rejoint market-data`);

      // Envoyer les données initiales
      marketDataSimulator.sendInitialData(socket);
    });

    // Rejoindre la room news
    socket.on('join-news', () => {
      socket.join('news');
      console.log(`Socket ${socket.id} a rejoint news`);

      // Envoyer les données initiales
      newsSimulator.sendInitialData(socket);
    });

    // S'abonner à un asset spécifique
    socket.on('subscribe-asset', (assetId) => {
      socket.join(`asset-${assetId}`);
      console.log(`Socket ${socket.id} s'est abonné à l'asset ${assetId}`);
    });

    // Se désabonner d'un asset
    socket.on('unsubscribe-asset', (assetId) => {
      socket.leave(`asset-${assetId}`);
      console.log(`Socket ${socket.id} s'est désabonné de l'asset ${assetId}`);
    });

    // Demande de données historiques
    socket.on('request-historical-data', async (data) => {
      try {
        const historicalData = await marketDataSimulator.getHistoricalData(data.assetId, data.period);
        socket.emit('historical-data-response', historicalData);
      } catch (error) {
        socket.emit('error', { message: 'Erreur lors de la récupération des données historiques' });
      }
    });

    socket.on('disconnect', () => {
      console.log('Client déconnecté:', socket.id);
    });
  });

  // Démarrer les simulateurs
  startSimulators();

  return io;
};

const startSimulators = () => {
  // Initialiser les prix après un délai pour s'assurer que la DB est prête
  setTimeout(async () => {
    try {
      await marketDataSimulator.initializePrices();
    } catch (error) {
      console.error("⚠️ Impossible d'initialiser les prix depuis la DB:", error.message);
    }
  }, 2000);

  // Simuler les mises à jour de marché toutes les 2 secondes
  marketInterval = setInterval(() => {
    if (io) {
      const marketUpdate = marketDataSimulator.generateMarketUpdate();
      io.to('market-data').emit('market-update', marketUpdate);

      // Émettre aussi pour les assets spécifiques
      marketUpdate.forEach((update) => {
        io.to(`asset-${update.asset_id}`).emit('asset-update', update);
      });
    }
  }, 2000);

  // Simuler les nouvelles toutes les 10 secondes
  newsInterval = setInterval(() => {
    if (io) {
      const newsUpdate = newsSimulator.generateNewsUpdate();
      io.to('news').emit('news-update', newsUpdate);
    }
  }, 10000);
};

const stopSimulators = () => {
  if (marketInterval) {
    clearInterval(marketInterval);
  }
  if (newsInterval) {
    clearInterval(newsInterval);
  }
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

module.exports = {
  initializeSocket,
  getIO,
  stopSimulators
};

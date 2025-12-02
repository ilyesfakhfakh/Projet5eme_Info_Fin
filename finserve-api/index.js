const express = require("express");
const cors = require("cors");
var app_https = require("https");
var app_http = require("http");
const ejs = require("ejs");
var compression = require("compression");
const helmet = require("helmet");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const socketIO = require('socket.io');

const app = express();

const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.join(__dirname, ".env") });

// Routes
const authRoutes = require('./app/routes/auth.routes');
const usersRoutes = require('./app/routes/users.routes');
const rolesRoutes = require('./app/routes/roles.routes');
const adminRoutes = require('./app/routes/admin.routes');
const statsRoutes = require('./app/routes/stats.routes');
const userStatsRoutes = require('./app/routes/user-stats.routes');

// New trading and market routes
const orderBookRoutes = require('./app/routes/orderBookRoutes');
const ordersRoutes = require('./app/controllers/orders.controller');
const orderExecutionsRoutes = require('./app/controllers/order-executions.controller');
const priceRoutes = require('./app/routes/price.routes');
const simulationRoutes = require('./app/routes/simulation.routes');

// Additional routes
const calculatorRoutes = require('./app/controllers/calculator.controller');
const chartRoutes = require('./app/controllers/chart.controller');
const indicatorValueRoutes = require('./app/controllers/indicator-value.controller');
const portfolioRoutes = require('./app/controllers/portfolio.controller');
const assetsRoutes = require('./app/controllers/assets.controller');
const technicalIndicatorRoutes = require('./app/controllers/technical-indicator.controller');
const tradingStrategiesRoutes = require('./app/controllers/trading-strategies.controller');
const rssRoutes = require('./app/controllers/rss.controller');
const rouletteRoutes = require('./app/controllers/roulette.controller');
const streamingRoutes = require('./app/routes/streaming.routes');

// Configuration de la sécurité
app.use(helmet({ 
  crossOriginEmbedderPolicy: false, 
  originAgentCluster: true 
}));

// Configuration de la politique de sécurité du contenu
app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      "img-src": ["'self'", "https:", "data:", "blob:", "http://localhost:3200"],
    },
  })
);

// Compression des réponses
app.use(compression());

// Servir les fichiers statiques depuis le dossier uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, path) => {
    // Autoriser les requêtes cross-origin pour les images
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

var app_privateKey = require('./core/certificates').certificateFileKey
var app_certificate = require('./core/certificates').certificateFile
var app_ca

app.use(bodyParser.json({limit: '100mb'}))
app.use(bodyParser.urlencoded({
  extended: true,
  limit: '100mb',
  parameterLimit: 50000
}))
app.use(morgan('combined'))

// Configuration CORS
const corsOptions = {
  origin: function (origin, callback) {
    // Autoriser les requêtes sans origin (comme Postman) ou depuis localhost/127.0.0.1
    if (!origin || 
        origin.startsWith('http://localhost:') || 
        origin.startsWith('http://127.0.0.1:') ||
        origin.startsWith('https://localhost:') || 
        origin.startsWith('https://127.0.0.1:')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Content-Length', 'X-Requested-With'],
  exposedHeaders: ['Content-Disposition'],
  credentials: true,
  optionsSuccessStatus: 200 // Pour les navigateurs qui ont des problèmes avec le statut 204
}
app.use(cors(corsOptions));

const db = require('./app/models')

db.sequelize.sync(
  { alter: true }
).then(() => {
  console.log('Database resync done successfully')
}).catch(err => {
  console.log('Unable de resync database : ', err)
})

// Roulette tables will be created automatically with the main database sync

app.get("/", (req, res) => {
  res.json({
    message: "Bienvenue sur l'API du Simulateur de Marché",
    version: "1.0.0",
  });
})

// API routes
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/users', usersRoutes)
app.use('/api/v1/roles', rolesRoutes)
app.use('/api/v1/admin', adminRoutes)
app.use('/api/v1/stats', statsRoutes)
userStatsRoutes(app)

// Nouvelles routes utilisateur avec gestion de sécurité
const userRoutes = require('./app/routes/user.routes');
app.use('/api/v1/user', userRoutes);

// Trading and market routes
console.log('Loading trading routes...')
app.use('/api/v1/trading/order-book', orderBookRoutes)
console.log('Trading routes loaded')
console.log('Loading orders routes...')
app.use('/api/v1/orders', ordersRoutes)
console.log('Orders routes loaded')
console.log('Loading order executions routes...')
app.use('/api/v1/order-executions', orderExecutionsRoutes)
console.log('Order executions routes loaded')
app.use('/api/v1/market', priceRoutes)
app.use('/api/v1/price', priceRoutes) // Also mount under /price for frontend compatibility
app.use('/api/v1/simulation', simulationRoutes)

// Additional routes
app.use('/api/v1/calculator', calculatorRoutes)
app.use('/api/v1/chart', chartRoutes)
app.use('/api/v1/indicator-value', indicatorValueRoutes)
app.use('/api/v1/portfolio', portfolioRoutes)
app.use('/api/v1/portfolios', portfolioRoutes)
app.use('/api/v1/assets', assetsRoutes)
app.use('/api/v1/technical-indicator', technicalIndicatorRoutes)
app.use('/api/v1/trading-strategies', tradingStrategiesRoutes)
app.use('/api/v1/rss', rssRoutes)
console.log('RSS financial news routes loaded')

// Roulette game routes
app.use('/api/v1/roulette', rouletteRoutes)
console.log('Roulette game routes loaded')

// Match-3 game routes
require('./app/routes/match3.routes.js')(app);
console.log('Match-3 game routes loaded')

// Créer serveur HTTP avec Socket.IO (AVANT routes streaming)
const HTTP_PORT = process.env.PORT || 3200
const httpServer = app_http.createServer(app);

// Configuration Socket.IO
const io = socketIO(httpServer, {
  cors: {
    origin: function (origin, callback) {
      if (!origin || 
          origin.startsWith('http://localhost:') || 
          origin.startsWith('http://127.0.0.1:') ||
          origin.startsWith('https://localhost:') || 
          origin.startsWith('https://127.0.0.1:')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Initialize streaming socket
const { service: streamingService } = require('./app/sockets/streaming.socket')(io, db);
console.log('Socket.IO streaming initialized')

// Initialize streaming controller with service
const streamingController = require('./app/controllers/streaming.controller');
streamingController.initService(streamingService);

// Streaming routes (AVANT le 404 handler!)
app.use('/api/v1/streaming', streamingRoutes)
console.log('Streaming routes loaded')

// 404 handler (DOIT ÊTRE EN DERNIER!)
app.use((req, res, next) => {
  res.status(404).json({ message: 'Not Found' })
})

// Global error handler
app.use((err, req, res, next) => {
  const status = err.status || 500
  const code = err.code
  const expose = typeof err.expose === 'boolean' ? err.expose : status < 500
  const message = expose ? (err.message || 'Erreur') : 'Erreur serveur'
  res.status(status).json({ message, code })
})

// Démarrage serveur HTTP
httpServer.listen(HTTP_PORT, () => {
  console.log(`Simulateur de Marché API (HTTP) avec Socket.IO sur le port ${HTTP_PORT}`)
})

// Démarrage HTTPS séparé (pour tests TLS en local)
const HTTPS_PORT = process.env.HTTPS_PORT || 3443
const httpsServer = app_https.createServer({
  key: app_privateKey,
  cert: app_certificate,
  ca: app_ca
}, app)
httpsServer.listen(HTTPS_PORT, () => {
  console.log(`Simulateur de Marché API (HTTPS) en cours d'exécution sur le port ${HTTPS_PORT}`)
})


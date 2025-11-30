const express = require("express");
const cors = require("cors");
var app_https = require("https");
var app_http = require("http");
const ejs = require("ejs");
var compression = require("compression");
const helmet = require("helmet");
const bodyParser = require("body-parser");
const morgan = require("morgan");

const app = express();

const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.join(__dirname, ".env") });

// Configuration CORS (DOIT ÊTRE AVANT HELMET!)
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://localhost:3200'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Content-Length', 'X-Requested-With'],
  exposedHeaders: ['Content-Disposition'],
  credentials: true,
  optionsSuccessStatus: 200
}
app.use(cors(corsOptions));

// Configuration de la sécurité (APRÈS CORS)
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

const db = require('./app/models')

db.sequelize.sync(
  { alter: true }
).then(() => {
  console.log('Database resync done successfully')
}).catch(err => {
  console.log('Unable de resync database : ', err)
})

app.get("/", (req, res) => {
  res.json({
    message: "Bienvenue sur l'API du Simulateur de Marché",
    version: "1.0.0",
  });
})

// Routes imports
const authRoutes = require('./app/routes/auth.routes');
const usersRoutes = require('./app/routes/users.routes');
const rolesRoutes = require('./app/routes/roles.routes');
const adminRoutes = require('./app/routes/admin.routes');
const statsRoutes = require('./app/routes/stats.routes');
const userStatsRoutes = require('./app/routes/user-stats.routes');

// Market routes
require('./app/routes/market/asset.routes')(app);
require('./app/routes/market/market-data.routes')(app);
require('./app/routes/market/realtime-quote.routes')(app);
require('./app/routes/market/historical-data.routes')(app);
require('./app/routes/market/price-alert.routes')(app);
require('./app/routes/news/economic-event.routes')(app);
require('./app/routes/news/market-news.routes')(app);
require('./app/routes/news/news-article.routes')(app);

// API routes
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/users', usersRoutes)
app.use('/api/v1/roles', rolesRoutes)
app.use('/api/v1/admin', adminRoutes)
app.use('/api/v1/stats', statsRoutes)
app.use('/api/v1', userStatsRoutes)

// Nouvelles routes utilisateur avec gestion de sécurité
const userRoutes = require('./app/routes/user.routes');
app.use('/api/v1/user', userRoutes);

// 404 handler
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

// Démarrage HTTP (pour le frontend local)
const HTTP_PORT = process.env.PORT || 3200
app_http.createServer(app).listen(HTTP_PORT, () => {
  console.log(`Simulateur de Marché API (HTTP) en cours d'exécution sur le port ${HTTP_PORT}`)
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


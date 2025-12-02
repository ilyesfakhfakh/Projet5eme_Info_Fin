// Script de debug pour identifier l'erreur exacte
console.log('\n========================================');
console.log('DEBUG BACKEND STREAMING');
console.log('========================================\n');

try {
  console.log('✅ [1/6] Chargement de express...');
  const express = require("express");
  const app = express();
  
  console.log('✅ [2/6] Chargement de socket.io...');
  const socketIO = require('socket.io');
  const app_http = require("http");
  const httpServer = app_http.createServer(app);
  
  console.log('✅ [3/6] Configuration Socket.IO...');
  const io = socketIO(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });
  
  console.log('✅ [4/6] Chargement des models...');
  const db = require('./app/models');
  
  console.log('✅ [5/6] Chargement streaming.socket.js...');
  const streamingSocketModule = require('./app/sockets/streaming.socket');
  
  console.log('✅ [6/6] Initialisation streaming socket...');
  const { service: streamingService } = streamingSocketModule(io, db);
  
  console.log('\n✅ TOUT EST OK! Le problème est ailleurs.\n');
  
} catch (error) {
  console.error('\n❌ ERREUR TROUVÉE:');
  console.error('Message:', error.message);
  console.error('Stack:', error.stack);
  console.log('\n========================================\n');
}

process.exit(0);

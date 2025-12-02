// Test de création de stream
const http = require('http');

console.log('\n========================================');
console.log('🧪 TEST CRÉATION DE STREAM');
console.log('========================================\n');

const postData = JSON.stringify({
  title: 'Test Stream',
  description: 'Test description',
  category: 'trading',
  userId: 'demo-streamer'
});

const options = {
  hostname: 'localhost',
  port: 3200,
  path: '/api/v1/streaming/create',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  let data = '';
  
  console.log(`📊 Status Code: ${res.statusCode}\n`);
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('📦 Response:');
    try {
      const json = JSON.parse(data);
      console.log(JSON.stringify(json, null, 2));
    } catch (e) {
      console.log(data);
    }
    
    console.log('\n========================================');
    console.log('✅ TEST TERMINÉ');
    console.log('========================================\n');
    
    process.exit(0);
  });
});

req.on('error', (error) => {
  console.error('❌ Erreur:', error.message);
  process.exit(1);
});

req.write(postData);
req.end();

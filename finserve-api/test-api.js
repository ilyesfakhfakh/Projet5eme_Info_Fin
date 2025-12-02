// Test de l'API streaming
const http = require('http');

console.log('\n========================================');
console.log('TEST API STREAMING');
console.log('========================================\n');

function testEndpoint(path, method = 'GET') {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3200,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`${method} ${path}`);
        console.log(`Status: ${res.statusCode}`);
        try {
          const json = JSON.parse(data);
          console.log('Response:', JSON.stringify(json, null, 2));
        } catch (e) {
          console.log('Response:', data);
        }
        console.log('');
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log(`❌ ${method} ${path}`);
      console.log(`Error: ${error.message}\n`);
      resolve();
    });

    req.end();
  });
}

async function runTests() {
  await testEndpoint('/api/v1/streaming/live');
  await testEndpoint('/api/v1/users');
  await testEndpoint('/health');
  
  console.log('========================================');
  console.log('TESTS TERMINÉS');
  console.log('========================================\n');
  
  process.exit(0);
}

runTests();

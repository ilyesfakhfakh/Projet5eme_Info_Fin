// Test a specific risk API endpoint to see the actual error
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const http = require('http');

const BASE_URL = 'http://localhost:3200';

async function testEndpoint(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (body) {
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(body));
    }

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: response
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function testRiskAPIs() {
  console.log('Testing Risk API endpoints...\n');

  try {
    // Test exposure endpoint
    console.log('Testing GET /api/v1/risk/exposure...');
    const exposureResponse = await testEndpoint('GET', '/api/v1/risk/exposure');
    console.log(`Status: ${exposureResponse.status}`);
    console.log(`Response:`, exposureResponse.data);
    console.log('');

    // Test limits endpoint
    console.log('Testing GET /api/v1/risk/limits...');
    const limitsResponse = await testEndpoint('GET', '/api/v1/risk/limits');
    console.log(`Status: ${limitsResponse.status}`);
    console.log(`Response:`, limitsResponse.data);
    console.log('');

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testRiskAPIs();
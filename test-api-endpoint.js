// Test the API endpoint directly
const http = require('http');

const postData = JSON.stringify({
  curve_name: 'Test API',
  currency: 'EUR',
  curve_type: 'GOVERNMENT',
  maturity_points: [{ maturity: 1, rate: 0.04 }],
  created_by: 'dc25e004-bd97-4d59-a422-bd78851dace8'
});

const options = {
  hostname: 'localhost',
  port: 3200,
  path: '/api/v1/alm/yield-curves',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response:', data);
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(postData);
req.end();
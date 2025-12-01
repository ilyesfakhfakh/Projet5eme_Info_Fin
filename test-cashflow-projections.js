const http = require('http');

function testCashflowProjections() {
  const payload = JSON.stringify({
    portfolio_id: 'e9658c59-31bb-4e55-a91f-6b70cb8b8512',
    frequency: 'MONTHLY',
    horizon_years: 5,
    created_by: null
  });

  const options = {
    hostname: 'localhost',
    port: 3200,
    path: '/api/v1/alm/cashflow-projections',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);

    res.setEncoding('utf8');
    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });
    res.on('end', () => {
      console.log('Response:', body);
    });
  });

  req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
  });

  req.write(payload);
  req.end();
}

console.log('Testing POST cashflow projections...');
testCashflowProjections();
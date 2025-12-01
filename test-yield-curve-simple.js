const http = require('http');

function testPostYieldCurve() {
  const payload = JSON.stringify({
    curve_name: 'Test Curve',
    currency: 'EUR',
    curve_type: 'GOVERNMENT',
    maturity_points: [{ maturity: 1, rate: 0.04 }]
  });

  const options = {
    hostname: 'localhost',
    port: 3200,
    path: '/api/v1/alm/yield-curves',
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

function testGetYieldCurves() {
  const options = {
    hostname: 'localhost',
    port: 3200,
    path: '/api/v1/alm/yield-curves',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`GET Status: ${res.statusCode}`);

    res.setEncoding('utf8');
    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });
    res.on('end', () => {
      console.log('GET Response:', body);
    });
  });

  req.on('error', (e) => {
    console.error(`Problem with GET request: ${e.message}`);
  });

  req.end();
}

console.log('Testing POST yield curve...');
testPostYieldCurve();

setTimeout(() => {
  console.log('\nTesting GET yield curves...');
  testGetYieldCurves();
}, 1000);
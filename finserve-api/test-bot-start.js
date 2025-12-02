const http = require('http');

const botId = 'c562143a-d671-41b0-b124-4fd9e72bf871';

const postData = JSON.stringify({
  userId: 'demo-user'
});

const options = {
  hostname: 'localhost',
  port: 3200,
  path: `/api/v1/bots/${botId}/start`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('\n🧪 TEST BOT START\n');

const req = http.request(options, (res) => {
  let data = '';
  
  console.log(`Status: ${res.statusCode}\n`);
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('Response:');
      console.log(JSON.stringify(json, null, 2));
    } catch (e) {
      console.log(data);
    }
    process.exit(0);
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
  process.exit(1);
});

req.write(postData);
req.end();

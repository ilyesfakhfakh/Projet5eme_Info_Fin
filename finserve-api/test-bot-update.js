const http = require('http');

const botId = 'c562143a-d671-41b0-b124-4fd9e72bf871';

const postData = JSON.stringify({
  userId: 'demo-user',
  name: 'Test Bot Updated',
  description: 'Testing update',
  config: {
    nodes: [
      {
        id: 'trigger-1',
        type: 'trigger',
        position: { x: 100, y: 100 },
        data: {
          label: 'Test Trigger',
          condition: 'price',
          operator: '>',
          value: 50000
        }
      },
      {
        id: 'action-1',
        type: 'action',
        position: { x: 400, y: 100 },
        data: {
          label: 'Test Action',
          type: 'BUY',
          quantity: 10,
          symbol: 'BTC'
        }
      }
    ],
    edges: [
      { source: 'trigger-1', target: 'action-1', animated: true }
    ]
  },
  settings: {
    maxInvestment: 1000,
    stopLoss: 5,
    takeProfit: 10
  }
});

const options = {
  hostname: 'localhost',
  port: 3200,
  path: `/api/v1/bots/${botId}`,
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('\n🧪 TEST BOT UPDATE\n');

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

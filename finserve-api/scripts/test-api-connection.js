const axios = require('axios');

const API_BASE_URL = 'http://localhost:3200/api';

async function testConnection() {
  console.log('🔍 Testing API Connection...\n');
  console.log(`Target: ${API_BASE_URL}\n`);
  
  try {
    // Test 1: Check if server is running
    console.log('1️⃣  Checking if API server is running...');
    const healthCheck = await axios.get('http://localhost:3200');
    console.log('   ✅ Server is running!\n');
    
    // Test 2: Check Assets endpoint
    console.log('2️⃣  Testing /api/assets endpoint...');
    try {
      const assetsResponse = await axios.get(`${API_BASE_URL}/assets`);
      console.log(`   ✅ Assets endpoint OK (${assetsResponse.data?.length || 0} assets found)\n`);
    } catch (err) {
      console.log(`   ⚠️  Assets endpoint error: ${err.response?.status} - ${err.response?.statusText || err.message}\n`);
    }
    
    // Test 3: Check Market Data endpoint
    console.log('3️⃣  Testing /api/market-data endpoint...');
    try {
      const marketDataResponse = await axios.get(`${API_BASE_URL}/market-data`);
      console.log(`   ✅ Market Data endpoint OK (${marketDataResponse.data?.length || 0} entries found)\n`);
    } catch (err) {
      console.log(`   ⚠️  Market Data endpoint error: ${err.response?.status} - ${err.response?.statusText || err.message}\n`);
    }
    
    // Test 4: Check News Articles endpoint
    console.log('4️⃣  Testing /api/news-articles endpoint...');
    try {
      const newsResponse = await axios.get(`${API_BASE_URL}/news-articles`);
      console.log(`   ✅ News Articles endpoint OK (${newsResponse.data?.length || 0} articles found)\n`);
    } catch (err) {
      console.log(`   ⚠️  News Articles endpoint error: ${err.response?.status} - ${err.response?.statusText || err.message}\n`);
    }
    
    // Test 5: Check Economic Events endpoint
    console.log('5️⃣  Testing /api/economic-events endpoint...');
    try {
      const eventsResponse = await axios.get(`${API_BASE_URL}/economic-events`);
      console.log(`   ✅ Economic Events endpoint OK (${eventsResponse.data?.length || 0} events found)\n`);
    } catch (err) {
      console.log(`   ⚠️  Economic Events endpoint error: ${err.response?.status} - ${err.response?.statusText || err.message}\n`);
    }
    
    // Test 6: Check Market News endpoint
    console.log('6️⃣  Testing /api/market-news endpoint...');
    try {
      const marketNewsResponse = await axios.get(`${API_BASE_URL}/market-news`);
      console.log(`   ✅ Market News endpoint OK (${marketNewsResponse.data?.length || 0} news found)\n`);
    } catch (err) {
      console.log(`   ⚠️  Market News endpoint error: ${err.response?.status} - ${err.response?.statusText || err.message}\n`);
    }
    
    console.log('=' . repeat(60));
    console.log('✅ API Connection Test Complete!');
    console.log('=' . repeat(60));
    console.log('\n🎯 You can now run: npm run seed:all\n');
    
  } catch (error) {
    console.error('\n❌ FATAL ERROR: Cannot connect to API!\n');
    
    if (error.code === 'ECONNREFUSED') {
      console.error('🔴 The API server is not running!\n');
      console.error('📝 Solutions:');
      console.error('   1. Start the API server:');
      console.error('      cd finserve-api');
      console.error('      npm start\n');
      console.error('   2. Make sure the port 5000 is not already in use\n');
      console.error('   3. Check your firewall settings\n');
    } else if (error.code === 'ENOTFOUND') {
      console.error('🔴 Cannot resolve localhost!\n');
      console.error('   Check your network settings\n');
    } else {
      console.error(`🔴 Error: ${error.message}\n`);
    }
    
    process.exit(1);
  }
}

testConnection();

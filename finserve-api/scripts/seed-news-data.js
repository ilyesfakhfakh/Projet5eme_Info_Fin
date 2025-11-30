const axios = require('axios');

const API_BASE_URL = 'http://localhost:3200/api';

// Fonction pour créer un délai
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Données de test pour News Articles
const newsArticlesData = [
  {
    title: 'Tech Giants Rally as AI Sector Shows Strong Growth',
    content: 'Major technology companies experienced significant gains today as artificial intelligence continues to drive innovation across the sector. Analysts predict continued growth in AI-related investments through 2025.',
    summary: 'Technology stocks surge on positive AI sector outlook',
    author: 'John Smith',
    source: 'Tech News Daily',
    publish_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'MARKET',
    sentiment: 'POSITIVE',
    impact_level: 'HIGH'
  },
  {
    title: 'Federal Reserve Signals Potential Interest Rate Adjustments',
    content: 'The Federal Reserve announced today that it is closely monitoring inflation indicators and may adjust interest rates in the coming quarter. This move comes as the economy shows mixed signals of growth and inflation pressure.',
    summary: 'Fed considers rate changes amid economic uncertainty',
    author: 'Sarah Johnson',
    source: 'Financial Times',
    publish_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'ECONOMIC',
    sentiment: 'NEUTRAL',
    impact_level: 'HIGH'
  },
  {
    title: 'Major Automotive Company Announces Electric Vehicle Expansion',
    content: 'Leading automaker reveals plans to invest $10 billion in electric vehicle production over the next five years. The initiative includes new manufacturing facilities and battery technology development.',
    summary: 'Automaker commits $10B to EV expansion',
    author: 'Michael Chen',
    source: 'Auto Industry News',
    publish_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'COMPANY',
    sentiment: 'POSITIVE',
    impact_level: 'MEDIUM'
  },
  {
    title: 'Global Supply Chain Disruptions Impact Manufacturing Sector',
    content: 'Manufacturing companies worldwide are reporting delays and increased costs due to ongoing supply chain challenges. Industry leaders are calling for coordinated international response to address bottlenecks.',
    summary: 'Supply chain issues continue to affect global manufacturing',
    author: 'Emily Rodriguez',
    source: 'Business Wire',
    publish_date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'ECONOMIC',
    sentiment: 'NEGATIVE',
    impact_level: 'HIGH'
  },
  {
    title: 'Renewable Energy Sector Attracts Record Investment',
    content: 'Investment in renewable energy projects reached an all-time high this quarter, with solar and wind projects leading the surge. Government incentives and corporate sustainability goals are driving the trend.',
    summary: 'Renewable energy sees unprecedented investment levels',
    author: 'David Wilson',
    source: 'Energy Today',
    publish_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'MARKET',
    sentiment: 'POSITIVE',
    impact_level: 'MEDIUM'
  },
  {
    title: 'Cryptocurrency Market Experiences High Volatility',
    content: 'Digital currencies saw significant price swings this week as regulatory concerns and market sentiment shifted rapidly. Bitcoin and Ethereum led the volatile movements with double-digit percentage changes.',
    summary: 'Crypto markets show extreme price volatility',
    author: 'Lisa Anderson',
    source: 'Crypto Daily',
    publish_date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'MARKET',
    sentiment: 'NEUTRAL',
    impact_level: 'MEDIUM'
  },
  {
    title: 'Government Announces New Trade Policy Reforms',
    content: 'The administration unveiled comprehensive trade policy changes aimed at boosting domestic manufacturing and reducing dependency on foreign supply chains. The reforms include tax incentives and regulatory adjustments.',
    summary: 'New trade policies target manufacturing sector growth',
    author: 'Robert Taylor',
    source: 'Policy Watch',
    publish_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'POLITICAL',
    sentiment: 'POSITIVE',
    impact_level: 'HIGH'
  },
  {
    title: 'Banking Sector Faces Increased Regulatory Scrutiny',
    content: 'Financial regulators announced enhanced oversight measures for the banking sector following recent market instabilities. New compliance requirements are expected to be implemented over the next year.',
    summary: 'Banks face stricter regulatory oversight',
    author: 'Jennifer Lee',
    source: 'Banking News',
    publish_date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'ECONOMIC',
    sentiment: 'NEGATIVE',
    impact_level: 'HIGH'
  }
];

// Données pour Economic Events
const economicEventsData = [
  {
    event_name: 'Non-Farm Payrolls Report',
    description: 'Monthly employment report showing job growth in the non-farm sector',
    scheduled_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    importance: 'HIGH',
    country: 'United States',
    event_category: 'Employment',
    previous_value: '250000',
    forecast_value: '280000',
    actual_value: null
  },
  {
    event_name: 'Federal Reserve Interest Rate Decision',
    description: 'FOMC meeting to decide on federal funds rate',
    scheduled_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    importance: 'HIGH',
    country: 'United States',
    event_category: 'Interest Rate',
    previous_value: '5.25',
    forecast_value: '5.50',
    actual_value: null
  },
  {
    event_name: 'GDP Growth Rate (Quarterly)',
    description: 'Quarterly gross domestic product growth rate',
    scheduled_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    importance: 'HIGH',
    country: 'United States',
    event_category: 'GDP',
    previous_value: '2.8',
    forecast_value: '3.1',
    actual_value: null
  },
  {
    event_name: 'Consumer Price Index (CPI)',
    description: 'Monthly inflation indicator measuring consumer prices',
    scheduled_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    importance: 'HIGH',
    country: 'United States',
    event_category: 'Inflation',
    previous_value: '3.2',
    forecast_value: '3.0',
    actual_value: '3.1'
  },
  {
    event_name: 'ECB Monetary Policy Meeting',
    description: 'European Central Bank policy decision',
    scheduled_date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
    importance: 'HIGH',
    country: 'European Union',
    event_category: 'Interest Rate',
    previous_value: '4.50',
    forecast_value: '4.50',
    actual_value: null
  },
  {
    event_name: 'UK Employment Data',
    description: 'Monthly unemployment rate and job creation figures',
    scheduled_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    importance: 'MEDIUM',
    country: 'United Kingdom',
    event_category: 'Employment',
    previous_value: '4.2',
    forecast_value: '4.1',
    actual_value: null
  },
  {
    event_name: 'China Manufacturing PMI',
    description: 'Purchasing Managers Index for manufacturing sector',
    scheduled_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    importance: 'MEDIUM',
    country: 'China',
    event_category: 'Manufacturing',
    previous_value: '50.2',
    forecast_value: '50.5',
    actual_value: '50.8'
  },
  {
    event_name: 'Retail Sales Report',
    description: 'Monthly retail sales data showing consumer spending',
    scheduled_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
    importance: 'MEDIUM',
    country: 'United States',
    event_category: 'Consumer Spending',
    previous_value: '0.5',
    forecast_value: '0.7',
    actual_value: null
  },
  {
    event_name: 'Japan Core CPI',
    description: 'Core consumer price index excluding food',
    scheduled_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    importance: 'MEDIUM',
    country: 'Japan',
    event_category: 'Inflation',
    previous_value: '2.5',
    forecast_value: '2.6',
    actual_value: null
  },
  {
    event_name: 'Housing Starts',
    description: 'Monthly data on new residential construction',
    scheduled_date: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(),
    importance: 'LOW',
    country: 'United States',
    event_category: 'Housing',
    previous_value: '1450000',
    forecast_value: '1480000',
    actual_value: null
  }
];

// Données pour Market News
const marketNewsData = [
  {
    headline: 'BREAKING: Major Tech Merger Announced',
    content: 'Two leading technology companies announced a merger deal valued at $50 billion. The transaction is expected to close in Q2 2025 subject to regulatory approval.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    priority: 'URGENT',
    tags: ['mergers', 'technology', 'breaking']
  },
  {
    headline: 'Oil Prices Surge on Supply Concerns',
    content: 'Crude oil prices jumped 5% today following reports of production disruptions in major oil-producing regions. Market analysts are monitoring the situation closely.',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    priority: 'HIGH',
    tags: ['oil', 'commodities', 'energy']
  },
  {
    headline: 'Stock Market Opens Higher on Positive Economic Data',
    content: 'Major indices opened in positive territory today as investors reacted favorably to better-than-expected economic indicators released this morning.',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    priority: 'MEDIUM',
    tags: ['stocks', 'markets', 'economy']
  },
  {
    headline: 'Currency Markets React to Central Bank Statements',
    content: 'Foreign exchange markets saw increased volatility following statements from multiple central banks regarding monetary policy outlook.',
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    priority: 'MEDIUM',
    tags: ['forex', 'central-banks', 'currency']
  },
  {
    headline: 'Bond Yields Rise Amid Inflation Concerns',
    content: 'Treasury yields climbed higher as investors price in potential interest rate increases to combat persistent inflation pressures.',
    timestamp: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(),
    priority: 'MEDIUM',
    tags: ['bonds', 'inflation', 'rates']
  },
  {
    headline: 'Gold Reaches New High on Safe-Haven Demand',
    content: 'Gold prices hit a new record as investors seek safe-haven assets amid geopolitical uncertainties and market volatility.',
    timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
    priority: 'HIGH',
    tags: ['gold', 'commodities', 'safe-haven']
  },
  {
    headline: 'Tech Sector Leads Market Gains',
    content: 'Technology stocks outperformed broader markets today with semiconductor and software companies posting strong gains.',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    priority: 'LOW',
    tags: ['technology', 'stocks', 'semiconductors']
  },
  {
    headline: 'ALERT: Trading Halted on Major Exchange',
    content: 'Trading was temporarily halted on a major stock exchange due to technical issues. Normal operations resumed after 30 minutes.',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    priority: 'URGENT',
    tags: ['trading', 'alert', 'technical']
  },
  {
    headline: 'Emerging Markets Show Mixed Performance',
    content: 'Emerging market equities displayed varied performance today with Asian markets mostly higher while Latin American markets declined.',
    timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    priority: 'LOW',
    tags: ['emerging-markets', 'global', 'stocks']
  },
  {
    headline: 'Cryptocurrency Regulation Updates Expected',
    content: 'Market participants are anticipating new cryptocurrency regulation announcements from financial authorities in multiple jurisdictions.',
    timestamp: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
    priority: 'MEDIUM',
    tags: ['crypto', 'regulation', 'digital-assets']
  }
];

// Fonction principale
async function seedNewsData() {
  console.log('🚀 Starting News Data Seeding...\n');
  
  try {
    // 1. Créer News Articles
    console.log('📰 Creating News Articles...');
    let articlesCount = 0;
    for (const article of newsArticlesData) {
      try {
        await axios.post(`${API_BASE_URL}/news-articles`, article);
        articlesCount++;
        console.log(`✅ Created: ${article.title.substring(0, 50)}...`);
        await delay(100);
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          console.error('\n❌ ERROR: Cannot connect to API!');
          console.error(`   Make sure your API is running on ${API_BASE_URL}`);
          console.error('   Start it with: npm start\n');
          process.exit(1);
        }
        console.log(`⚠️  Error creating article: ${error.response?.data?.message || error.message}`);
      }
    }
    console.log(`\n✅ Total News Articles created: ${articlesCount}\n`);
    
    // 2. Créer Economic Events
    console.log('📊 Creating Economic Events...');
    let eventsCount = 0;
    for (const event of economicEventsData) {
      try {
        await axios.post(`${API_BASE_URL}/economic-events`, event);
        eventsCount++;
        console.log(`✅ Created: ${event.event_name} - ${event.country}`);
        await delay(100);
      } catch (error) {
        console.log(`⚠️  Error creating event: ${error.response?.data?.message || error.message}`);
      }
    }
    console.log(`\n✅ Total Economic Events created: ${eventsCount}\n`);
    
    // 3. Créer Market News
    console.log('📈 Creating Market News...');
    let newsCount = 0;
    for (const news of marketNewsData) {
      try {
        await axios.post(`${API_BASE_URL}/market-news`, news);
        newsCount++;
        console.log(`✅ Created: ${news.headline.substring(0, 50)}... [${news.priority}]`);
        await delay(100);
      } catch (error) {
        console.log(`⚠️  Error creating market news: ${error.response?.data?.message || error.message}`);
      }
    }
    console.log(`\n✅ Total Market News created: ${newsCount}\n`);
    
    // Résumé final
    console.log('\n' + '='.repeat(50));
    console.log('🎉 NEWS DATA SEEDING COMPLETED!');
    console.log('='.repeat(50));
    console.log(`📰 News Articles: ${articlesCount}`);
    console.log(`📊 Economic Events: ${eventsCount}`);
    console.log(`📈 Market News: ${newsCount}`);
    console.log('='.repeat(50) + '\n');
    
  } catch (error) {
    console.error('❌ Error during seeding:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Exécuter le script
seedNewsData();

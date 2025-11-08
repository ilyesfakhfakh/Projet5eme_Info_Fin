const fs = require('fs').promises;
const path = require('path');
const csv = require('csv-parser');
const axios = require('axios');

class DataImportService {
  constructor() {
    this.importedData = new Map(); // asset -> historical data
  }

  // Import data from CSV file
  async importFromCSV(asset, filePath, options = {}) {
    const {
      dateColumn = 'timestamp',
      priceColumn = 'close',
      hasHeaders = true,
      delimiter = ',',
      dateFormat = 'ISO' // 'ISO', 'MM/DD/YYYY', 'DD/MM/YYYY'
    } = options;

    const data = [];

    try {
      const fileContent = await fs.readFile(filePath, 'utf8');
      const lines = fileContent.split('\n').filter(line => line.trim());

      let startIndex = hasHeaders ? 1 : 0;

      for (let i = startIndex; i < lines.length; i++) {
        const values = lines[i].split(delimiter).map(v => v.trim());

        if (values.length < 2) continue;

        let timestamp, price;

        if (hasHeaders) {
          // Assume first column is date, second is price if not specified
          timestamp = this.parseDate(values[0], dateFormat);
          price = parseFloat(values[1]);
        } else {
          timestamp = new Date(values[0]);
          price = parseFloat(values[1]);
        }

        if (timestamp && !isNaN(price)) {
          data.push({
            timestamp,
            price,
            volume: parseFloat(values[2]) || 0,
            open: parseFloat(values[3]) || price,
            high: parseFloat(values[4]) || price,
            low: parseFloat(values[5]) || price
          });
        }
      }

      // Sort by timestamp
      data.sort((a, b) => a.timestamp - b.timestamp);

      this.importedData.set(asset, data);
      return { asset, count: data.length, dateRange: this.getDateRange(data) };

    } catch (error) {
      throw new Error(`Failed to import CSV for ${asset}: ${error.message}`);
    }
  }

  // Parse different date formats
  parseDate(dateStr, format) {
    try {
      switch (format) {
        case 'MM/DD/YYYY':
          const [month, day, year] = dateStr.split('/');
          return new Date(year, month - 1, day);
        case 'DD/MM/YYYY':
          const [day2, month2, year2] = dateStr.split('/');
          return new Date(year2, month2 - 1, day2);
        case 'ISO':
        default:
          return new Date(dateStr);
      }
    } catch (error) {
      console.warn(`Failed to parse date: ${dateStr}`);
      return null;
    }
  }

  // Import from Yahoo Finance API
  async importFromYahooFinance(asset, period = '1y', interval = '1d') {
    try {
      // Note: This is a simplified example. In production, you'd use yahoo-finance2 or similar
      const symbol = this.mapAssetToYahooSymbol(asset);
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${Math.floor((Date.now() - 365*24*60*60*1000)/1000)}&period2=${Math.floor(Date.now()/1000)}&interval=${interval}`;

      const response = await axios.get(url);
      const chart = response.data.chart.result[0];

      const data = [];
      const timestamps = chart.timestamp;
      const quotes = chart.indicators.quote[0];

      for (let i = 0; i < timestamps.length; i++) {
        if (quotes.close[i] !== null) {
          data.push({
            timestamp: new Date(timestamps[i] * 1000),
            open: quotes.open[i] || quotes.close[i],
            high: quotes.high[i] || quotes.close[i],
            low: quotes.low[i] || quotes.close[i],
            close: quotes.close[i],
            volume: quotes.volume[i] || 0
          });
        }
      }

      this.importedData.set(asset, data);
      return { asset, count: data.length, dateRange: this.getDateRange(data) };

    } catch (error) {
      throw new Error(`Failed to import from Yahoo Finance for ${asset}: ${error.message}`);
    }
  }

  // Import from Alpha Vantage API
  async importFromAlphaVantage(asset, apiKey, options = {}) {
    const {
      function: func = 'TIME_SERIES_DAILY',
      outputsize = 'compact'
    } = options;

    try {
      const symbol = this.mapAssetToYahooSymbol(asset);
      const url = `https://www.alphavantage.co/query?function=${func}&symbol=${symbol}&outputsize=${outputsize}&apikey=${apiKey}`;

      const response = await axios.get(url);
      const timeSeries = response.data['Time Series (Daily)'];

      if (!timeSeries) {
        throw new Error('Invalid response from Alpha Vantage');
      }

      const data = Object.entries(timeSeries).map(([date, values]) => ({
        timestamp: new Date(date),
        open: parseFloat(values['1. open']),
        high: parseFloat(values['2. high']),
        low: parseFloat(values['3. low']),
        close: parseFloat(values['4. close']),
        volume: parseFloat(values['5. volume'])
      }));

      // Sort by timestamp (Alpha Vantage returns newest first)
      data.sort((a, b) => a.timestamp - b.timestamp);

      this.importedData.set(asset, data);
      return { asset, count: data.length, dateRange: this.getDateRange(data) };

    } catch (error) {
      throw new Error(`Failed to import from Alpha Vantage for ${asset}: ${error.message}`);
    }
  }

  // Map asset names to Yahoo/Alpha Vantage symbols
  mapAssetToYahooSymbol(asset) {
    const symbolMap = {
      'BTC': 'BTC-USD',
      'ETH': 'ETH-USD',
      'AAPL': 'AAPL',
      'GOOGL': 'GOOGL',
      'SPY': 'SPY',
      'EURUSD': 'EURUSD=X',
      'GBPUSD': 'GBPUSD=X'
    };

    return symbolMap[asset] || asset;
  }

  // Get date range of data
  getDateRange(data) {
    if (data.length === 0) return null;

    return {
      start: data[0].timestamp,
      end: data[data.length - 1].timestamp
    };
  }

  // Get imported data for asset
  getImportedData(asset, startDate = null, endDate = null) {
    const data = this.importedData.get(asset) || [];

    if (!startDate && !endDate) return data;

    const start = startDate ? new Date(startDate) : new Date(0);
    const end = endDate ? new Date(endDate) : new Date();

    return data.filter(point =>
      point.timestamp >= start && point.timestamp <= end
    );
  }

  // Get next data point for backtesting
  getNextDataPoint(asset, currentTime) {
    const data = this.importedData.get(asset) || [];
    const current = new Date(currentTime);

    // Find the next data point after current time
    for (const point of data) {
      if (point.timestamp > current) {
        return point;
      }
    }

    return null; // No more data
  }

  // Validate imported data
  validateData(asset) {
    const data = this.importedData.get(asset);
    if (!data || data.length === 0) {
      return { valid: false, errors: ['No data found'] };
    }

    const errors = [];

    // Check for missing timestamps
    const timestamps = data.map(d => d.timestamp.getTime());
    for (let i = 1; i < timestamps.length; i++) {
      if (timestamps[i] <= timestamps[i-1]) {
        errors.push(`Non-monotonic timestamps at index ${i}`);
      }
    }

    // Check for invalid prices
    data.forEach((point, index) => {
      if (point.close <= 0) {
        errors.push(`Invalid close price at index ${index}: ${point.close}`);
      }
      if (point.high < point.low) {
        errors.push(`High < Low at index ${index}`);
      }
      if (point.close > point.high || point.close < point.low) {
        errors.push(`Close price outside high-low range at index ${index}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      stats: {
        count: data.length,
        dateRange: this.getDateRange(data),
        avgPrice: data.reduce((sum, d) => sum + d.close, 0) / data.length,
        volatility: this.calculateVolatility(data)
      }
    };
  }

  // Calculate volatility from data
  calculateVolatility(data) {
    if (data.length < 2) return 0;

    const returns = [];
    for (let i = 1; i < data.length; i++) {
      const ret = Math.log(data[i].close / data[i-1].close);
      returns.push(ret);
    }

    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;

    return Math.sqrt(variance * 252); // Annualized volatility
  }

  // Clear imported data
  clearData(asset = null) {
    if (asset) {
      this.importedData.delete(asset);
    } else {
      this.importedData.clear();
    }
  }

  // Get list of imported assets
  getImportedAssets() {
    return Array.from(this.importedData.keys());
  }

  // Export data to CSV
  async exportToCSV(asset, filePath) {
    const data = this.importedData.get(asset);
    if (!data) {
      throw new Error(`No data found for asset ${asset}`);
    }

    const csvContent = [
      'timestamp,open,high,low,close,volume',
      ...data.map(point =>
        `${point.timestamp.toISOString()},${point.open},${point.high},${point.low},${point.close},${point.volume}`
      )
    ].join('\n');

    await fs.writeFile(filePath, csvContent, 'utf8');
    return { asset, exportedCount: data.length, filePath };
  }
}

module.exports = new DataImportService();
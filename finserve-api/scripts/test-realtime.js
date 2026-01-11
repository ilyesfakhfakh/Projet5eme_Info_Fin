const axios = require('axios');
const { io } = require('socket.io-client');
const { spawn } = require('child_process');

const HTTP_BASE_URL = process.env.TEST_HTTP_BASE_URL || 'http://localhost:3200';
const SOCKET_URL = process.env.TEST_SOCKET_URL || 'http://localhost:3200';
const START_SERVER = process.env.TEST_START_SERVER !== 'false';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForHttpReady({ url, timeoutMs }) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await axios.get(url, { timeout: 1500 });
      return true;
    } catch {
      await sleep(500);
    }
  }
  return false;
}

async function run() {
  console.log('🔍 Realtime Test: Market + News\n');
  console.log(`HTTP:   ${HTTP_BASE_URL}`);
  console.log(`Socket: ${SOCKET_URL}`);
  console.log(`Start server: ${START_SERVER}\n`);

  let serverProcess;
  let socket;

  try {
    if (START_SERVER) {
      serverProcess = spawn(process.execPath, ['index.js'], {
        cwd: process.cwd(),
        stdio: ['ignore', 'pipe', 'pipe'],
        env: process.env
      });

      serverProcess.stdout.on('data', (d) => process.stdout.write(d));
      serverProcess.stderr.on('data', (d) => process.stderr.write(d));

      await sleep(500);
    }

    const httpReady = await waitForHttpReady({ url: `${HTTP_BASE_URL}/`, timeoutMs: 15000 });
    if (!httpReady) {
      throw new Error('HTTP server not ready on time (check if API started and port 3200 is free)');
    }

    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      timeout: 8000,
      reconnection: false
    });

    const results = {
      connected: false,
      initialMarket: false,
      initialNews: false,
      marketUpdate: false,
      newsUpdate: false,
      historicalData: false
    };

    let chosenAssetId = 'DEMO-1';

    const failTimeoutMs = 25000;
    const endBy = Date.now() + failTimeoutMs;

    const donePromise = new Promise((resolve, reject) => {
      const hardTimeout = setTimeout(() => {
        reject(new Error(`Timeout after ${failTimeoutMs}ms. Results: ${JSON.stringify(results)}`));
      }, failTimeoutMs);

      const tryResolve = () => {
        if (
          results.connected &&
          results.initialMarket &&
          results.initialNews &&
          results.marketUpdate &&
          results.newsUpdate &&
          results.historicalData
        ) {
          clearTimeout(hardTimeout);
          resolve();
        }
      };

      socket.on('connect', () => {
        results.connected = true;
        socket.emit('join-market-data');
        socket.emit('join-news');
        tryResolve();
      });

      socket.on('connect_error', (err) => {
        clearTimeout(hardTimeout);
        reject(new Error(`Socket connect_error: ${err?.message || err}`));
      });

      socket.on('error', (payload) => {
        clearTimeout(hardTimeout);
        reject(new Error(`Socket error event: ${JSON.stringify(payload)}`));
      });

      socket.on('initial-market-data', (payload) => {
        results.initialMarket = true;

        const assets = payload?.assets || [];
        const first = assets[0];
        if (first?.asset_id) {
          chosenAssetId = first.asset_id;
        }

        socket.emit('subscribe-asset', chosenAssetId);
        socket.emit('request-historical-data', { assetId: chosenAssetId, period: '1D' });
        tryResolve();
      });

      socket.on('initial-news-data', () => {
        results.initialNews = true;
        tryResolve();
      });

      socket.on('market-update', (update) => {
        if (Array.isArray(update) && update.length > 0) {
          results.marketUpdate = true;
          tryResolve();
        }
      });

      socket.on('news-update', (article) => {
        if (article && typeof article === 'object') {
          results.newsUpdate = true;
          tryResolve();
        }
      });

      socket.on('historical-data-response', (data) => {
        if (Array.isArray(data) && data.length >= 0) {
          results.historicalData = true;
          tryResolve();
        }
      });

      const progressInterval = setInterval(() => {
        if (Date.now() > endBy) {
          clearInterval(progressInterval);
          return;
        }
        process.stdout.write(`\rProgress: ${JSON.stringify(results)}`);
      }, 500);

      socket.on('disconnect', () => {
        clearInterval(progressInterval);
      });
    });

    await donePromise;
    process.stdout.write('\n');
    console.log('✅ Realtime test PASSED');
    console.log(`Asset used for historical request: ${chosenAssetId}`);
    process.exitCode = 0;
  } catch (err) {
    process.stdout.write('\n');
    console.error('❌ Realtime test FAILED');
    console.error(err?.stack || err);
    process.exitCode = 1;
  } finally {
    try {
      if (socket) {
        socket.disconnect();
      }
    } catch {}

    if (serverProcess) {
      try {
        serverProcess.kill();
      } catch {}
    }
  }
}

run();

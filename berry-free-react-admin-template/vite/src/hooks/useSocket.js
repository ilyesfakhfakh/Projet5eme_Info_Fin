import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3200';

export const useSocket = () => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Créer la connexion socket
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Socket connecté:', socket.id);
      setIsConnected(true);
      setError(null);
    });

    socket.on('disconnect', () => {
      console.log('Socket déconnecté');
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('Erreur de connexion socket:', err);
      setError(err.message);
      setIsConnected(false);
    });

    // Cleanup
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    error
  };
};

export const useMarketData = () => {
  const { socket, isConnected } = useSocket();
  const [marketData, setMarketData] = useState([]);
  const [realtimeUpdates, setRealtimeUpdates] = useState([]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Rejoindre la room market-data
    socket.emit('join-market-data');

    // Recevoir les données initiales
    socket.on('initial-market-data', (data) => {
      console.log('Données initiales reçues:', data);
      if (data.marketData) {
        setMarketData(data.marketData);
      }
    });

    // Recevoir les mises à jour en temps réel
    socket.on('market-update', (updates) => {
      console.log('Mise à jour marché:', updates);
      setRealtimeUpdates(updates);

      // Optionnel: mettre à jour aussi marketData
      setMarketData((prev) => {
        const updated = [...prev];
        updates.forEach((update) => {
          const index = updated.findIndex((item) => item.asset_id === update.asset_id);
          if (index >= 0) {
            updated[index] = { ...updated[index], ...update };
          } else {
            updated.push(update);
          }
        });
        return updated;
      });
    });

    return () => {
      socket.off('initial-market-data');
      socket.off('market-update');
    };
  }, [socket, isConnected]);

  const subscribeToAsset = (assetId) => {
    if (socket && isConnected) {
      socket.emit('subscribe-asset', assetId);
    }
  };

  const unsubscribeFromAsset = (assetId) => {
    if (socket && isConnected) {
      socket.emit('unsubscribe-asset', assetId);
    }
  };

  const requestHistoricalData = (assetId, period) => {
    return new Promise((resolve, reject) => {
      if (!socket || !isConnected) {
        reject(new Error('Socket non connecté'));
        return;
      }

      socket.emit('request-historical-data', { assetId, period });

      const timeout = setTimeout(() => {
        socket.off('historical-data-response');
        reject(new Error('Timeout'));
      }, 10000);

      socket.once('historical-data-response', (data) => {
        clearTimeout(timeout);
        resolve(data);
      });
    });
  };

  return {
    marketData,
    realtimeUpdates,
    isConnected,
    subscribeToAsset,
    unsubscribeFromAsset,
    requestHistoricalData
  };
};

export const useNewsUpdates = () => {
  const { socket, isConnected } = useSocket();
  const [news, setNews] = useState([]);
  const [latestNews, setLatestNews] = useState(null);

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Rejoindre la room news
    socket.emit('join-news');

    // Recevoir les données initiales
    socket.on('initial-news-data', (data) => {
      console.log('News initiales reçues:', data);
      if (data.articles) {
        setNews(data.articles);
      }
    });

    // Recevoir les nouvelles en temps réel
    socket.on('news-update', (newsUpdate) => {
      console.log('Nouvelle news:', newsUpdate);
      setLatestNews(newsUpdate);
      setNews((prev) => [newsUpdate, ...prev]);
    });

    return () => {
      socket.off('initial-news-data');
      socket.off('news-update');
    };
  }, [socket, isConnected]);

  return {
    news,
    latestNews,
    isConnected
  };
};

export default useSocket;

import { useEffect, useRef, useCallback } from 'react';

const useWebSocket = (url, onMessage, onOpen, onClose, onError) => {
  const ws = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectInterval = 5000; // 5 seconds

  const connect = useCallback(() => {
    if (ws.current) {
      ws.current.close();
    }

    try {
      ws.current = new WebSocket(url);
      
      ws.current.onopen = (event) => {
        console.log('WebSocket connected:', url);
        reconnectAttempts.current = 0; // Reset reconnect attempts on successful connection
        if (onOpen) onOpen(event);
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (onMessage) onMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event);
        if (onClose) onClose(event);
        
        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current += 1;
          console.log(`Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts})...`);
          setTimeout(connect, reconnectInterval);
        } else {
          console.error('Max reconnection attempts reached');
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        if (onError) onError(error);
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      if (onError) onError(error);
    }
  }, [url, onMessage, onOpen, onClose, onError]);

  const sendMessage = useCallback((message) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      try {
        const messageString = typeof message === 'string' ? message : JSON.stringify(message);
        ws.current.send(messageString);
        return true;
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        return false;
      }
    }
    console.warn('WebSocket is not connected');
    return false;
  }, []);

  const closeConnection = useCallback(() => {
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
  }, []);

  useEffect(() => {
    connect();
    
    // Cleanup on unmount
    return () => {
      closeConnection();
    };
  }, [connect, closeConnection]);

  return { sendMessage, closeConnection };
};

export default useWebSocket;

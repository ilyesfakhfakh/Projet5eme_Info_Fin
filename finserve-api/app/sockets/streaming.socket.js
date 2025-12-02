const StreamingService = require('../services/streaming.service');

module.exports = function(io, models) {
  const streamingService = new StreamingService(models, io);

  // Créer un namespace pour le streaming
  const streamingNamespace = io.of('/streaming');

  streamingNamespace.on('connection', (socket) => {
    console.log(`[Streaming Socket] User connected: ${socket.id}`);
    
    let currentStreamId = null;
    let currentUserId = null;
    let currentUsername = null;

    /**
     * JOIN STREAM - Viewer rejoint un stream
     */
    socket.on('join_stream', async (data) => {
      try {
        const { stream_id, user_id, username } = data;
        
        if (!stream_id) {
          socket.emit('error', { message: 'stream_id is required' });
          return;
        }

        currentStreamId = stream_id;
        currentUserId = user_id || `guest_${socket.id}`;
        currentUsername = username || 'Guest';

        // Join socket room
        socket.join(`stream_${stream_id}`);

        // Add viewer to stream
        const result = await streamingService.joinStream(
          stream_id, 
          currentUserId, 
          socket.id
        );

        // Confirm to user
        socket.emit('joined_stream', {
          success: true,
          stream: result.stream,
          viewer_count: result.viewer_count
        });

        console.log(`[Streaming] ${currentUsername} (${currentUserId}) joined stream ${stream_id}`);

      } catch (error) {
        console.error('[Streaming] Error joining stream:', error.message);
        socket.emit('error', { message: error.message });
      }
    });

    /**
     * LEAVE STREAM - Viewer quitte le stream
     */
    socket.on('leave_stream', async () => {
      if (currentStreamId && currentUserId) {
        await streamingService.leaveStream(currentStreamId, currentUserId);
        socket.leave(`stream_${currentStreamId}`);
        
        console.log(`[Streaming] ${currentUsername} left stream ${currentStreamId}`);
        
        currentStreamId = null;
        currentUserId = null;
        currentUsername = null;
      }
    });

    /**
     * SEND MESSAGE - Envoyer un message dans le chat
     */
    socket.on('send_message', async (data) => {
      try {
        const { stream_id, user_id, username, message } = data;
        
        if (!stream_id || !message) {
          socket.emit('error', { message: 'stream_id and message are required' });
          return;
        }

        if (message.length > 500) {
          socket.emit('error', { message: 'Message too long (max 500 characters)' });
          return;
        }

        // Sauvegarder le message dans la DB
        const savedMessage = await streamingService.sendMessage(
          stream_id, 
          user_id || currentUserId, 
          username || currentUsername, 
          message,
          'TEXT'
        );

        // Émettre le message à tous les viewers du stream (y compris l'expéditeur)
        streamingNamespace.to(`stream_${stream_id}`).emit('new_message', {
          message_id: savedMessage.message_id,
          stream_id: stream_id,
          user_id: user_id || currentUserId,
          username: username || currentUsername,
          message: message,
          message_type: 'TEXT',
          created_at: savedMessage.created_at
        });

        console.log(`[Streaming] Message sent in stream ${stream_id} by ${username || currentUsername}`);

      } catch (error) {
        console.error('[Streaming] Error sending message:', error.message);
        socket.emit('error', { message: error.message });
      }
    });

    /**
     * SEND TIP - Envoyer un tip au streamer
     */
    socket.on('send_tip', async (data) => {
      try {
        const { stream_id, from_user_id, to_user_id, amount, message } = data;
        
        if (!stream_id || !from_user_id || !to_user_id || !amount) {
          socket.emit('error', { 
            message: 'stream_id, from_user_id, to_user_id, and amount are required' 
          });
          return;
        }

        if (amount <= 0) {
          socket.emit('error', { message: 'Amount must be positive' });
          return;
        }

        if (amount > 1000) {
          socket.emit('error', { message: 'Maximum tip is $1000' });
          return;
        }

        // Sauvegarder le tip dans la DB
        const savedTip = await streamingService.sendTip(
          stream_id, 
          from_user_id, 
          to_user_id, 
          amount, 
          message || ''
        );

        // Émettre le tip à tous les viewers
        streamingNamespace.to(`stream_${stream_id}`).emit('new_tip', {
          tip_id: savedTip.tip_id,
          stream_id: stream_id,
          from_user_id: from_user_id,
          to_user_id: to_user_id,
          amount: amount,
          currency: 'USD',
          message: message || '',
          created_at: savedTip.created_at
        });

        socket.emit('tip_sent', { success: true, amount });

        console.log(`[Streaming] Tip of $${amount} sent in stream ${stream_id}`);

      } catch (error) {
        console.error('[Streaming] Error sending tip:', error.message);
        socket.emit('error', { message: error.message });
      }
    });

    /**
     * WEBRTC SIGNALING - Pour la vidéo P2P (optionnel)
     */
    socket.on('webrtc_offer', (data) => {
      const { stream_id, offer } = data;
      socket.to(`stream_${stream_id}`).emit('webrtc_offer', {
        offer,
        sender_id: socket.id
      });
    });

    socket.on('webrtc_answer', (data) => {
      const { stream_id, answer } = data;
      socket.to(`stream_${stream_id}`).emit('webrtc_answer', {
        answer,
        sender_id: socket.id
      });
    });

    socket.on('webrtc_ice_candidate', (data) => {
      const { stream_id, candidate } = data;
      socket.to(`stream_${stream_id}`).emit('webrtc_ice_candidate', {
        candidate,
        sender_id: socket.id
      });
    });

    /**
     * STREAMER EVENTS - Événements spécifiques au streamer
     */
    socket.on('streamer_start', async (data) => {
      const { stream_id } = data;
      console.log(`[Streaming] Streamer started broadcasting: ${stream_id}`);
      
      socket.to(`stream_${stream_id}`).emit('streamer_started', {
        stream_id,
        timestamp: new Date()
      });
    });

    socket.on('streamer_update_title', async (data) => {
      const { stream_id, title } = data;
      
      // Update dans DB (optionnel)
      // await models.streams.update({ title }, { where: { stream_id } });
      
      socket.to(`stream_${stream_id}`).emit('stream_title_updated', {
        stream_id,
        title
      });
    });

    /**
     * DISCONNECT - Cleanup quand user déconnecte
     */
    socket.on('disconnect', async () => {
      if (currentStreamId && currentUserId) {
        await streamingService.leaveStream(currentStreamId, currentUserId);
      }
      
      console.log(`[Streaming Socket] User disconnected: ${socket.id}`);
    });

    /**
     * ERROR HANDLING
     */
    socket.on('error', (error) => {
      console.error('[Streaming Socket] Error:', error);
    });
  });

  // Retourner le namespace et le service pour utilisation externe
  return {
    namespace: streamingNamespace,
    service: streamingService
  };
};

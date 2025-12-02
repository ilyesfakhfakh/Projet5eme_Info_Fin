const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');

class StreamingService {
  constructor(models, io) {
    this.models = models;
    this.io = io;
    this.activeStreams = new Map(); // Cache en mémoire des streams actifs
  }

  /**
   * Créer un nouveau stream
   */
  async createStream(userId, streamData) {
    try {
      const stream = await this.models.streams.create({
        stream_id: uuidv4(),
        streamer_id: userId,
        title: streamData.title || 'Live Trading Session',
        description: streamData.description || '',
        thumbnail_url: streamData.thumbnail_url || null,
        started_at: new Date(),
        status: 'LIVE',
        category: streamData.category || 'trading'
      });

      // Créer une room Socket.IO pour ce stream
      const roomId = `stream_${stream.stream_id}`;
      this.activeStreams.set(stream.stream_id, {
        roomId,
        viewers: new Set(),
        startedAt: Date.now(),
        streamer_id: userId
      });

      console.log(`[Streaming] New stream created: ${stream.stream_id} by ${userId}`);

      return stream;
    } catch (error) {
      throw new Error(`Error creating stream: ${error.message}`);
    }
  }

  /**
   * Joindre un stream comme viewer
   */
  async joinStream(streamId, userId, socketId) {
    try {
      const stream = await this.models.streams.findByPk(streamId);
      
      if (!stream) {
        throw new Error('Stream not found');
      }

      if (stream.status !== 'LIVE') {
        throw new Error('Stream is not live');
      }

      const streamData = this.activeStreams.get(streamId);
      if (!streamData) {
        throw new Error('Stream is not active');
      }

      // Ajouter le viewer à la liste
      streamData.viewers.add(userId);

      // Enregistrer dans la DB
      await this.models.stream_viewers.create({
        viewer_id: uuidv4(),
        stream_id: streamId,
        user_id: userId,
        joined_at: new Date()
      });

      // Update viewer count
      const viewerCount = streamData.viewers.size;
      await this.updateViewerCount(streamId, viewerCount);

      // Notifier tous les viewers
      if (this.io) {
        this.io.to(`stream_${streamId}`).emit('viewer_joined', {
          viewer_count: viewerCount
        });
      }

      console.log(`[Streaming] User ${userId} joined stream ${streamId}`);

      return { stream, viewer_count: viewerCount };
    } catch (error) {
      throw new Error(`Error joining stream: ${error.message}`);
    }
  }

  /**
   * Quitter un stream
   */
  async leaveStream(streamId, userId) {
    try {
      const streamData = this.activeStreams.get(streamId);
      
      if (streamData) {
        streamData.viewers.delete(userId);
        
        const viewerCount = streamData.viewers.size;
        await this.updateViewerCount(streamId, viewerCount);

        // Update watch duration dans la DB
        await this.models.stream_viewers.update({
          left_at: new Date(),
          watch_duration_seconds: this.models.sequelize.literal(
            'TIMESTAMPDIFF(SECOND, joined_at, NOW())'
          )
        }, {
          where: {
            stream_id: streamId,
            user_id: userId,
            left_at: null
          }
        });

        // Notifier
        if (this.io) {
          this.io.to(`stream_${streamId}`).emit('viewer_left', {
            viewer_count: viewerCount
          });
        }

        console.log(`[Streaming] User ${userId} left stream ${streamId}`);
      }
    } catch (error) {
      console.error(`Error leaving stream: ${error.message}`);
    }
  }

  /**
   * Envoyer un message dans le chat
   */
  async sendMessage(streamId, userId, username, message, messageType = 'TEXT') {
    try {
      const msg = await this.models.stream_messages.create({
        message_id: uuidv4(),
        stream_id: streamId,
        user_id: userId,
        username: username,
        message: message,
        message_type: messageType
      });

      // NOTE: Le broadcast est géré par le socket dans streaming.socket.js
      // pour utiliser le namespace correct

      return msg;
    } catch (error) {
      throw new Error(`Error sending message: ${error.message}`);
    }
  }

  /**
   * Envoyer un tip au streamer
   */
  async sendTip(streamId, fromUserId, toUserId, amount, message = '') {
    try {
      // Vérifier balance du sender
      const wallet = await this.models.wallets.findOne({
        where: { user_id: fromUserId }
      });

      if (!wallet || wallet.balance < amount) {
        throw new Error('Insufficient balance');
      }

      // Créer le tip
      const tip = await this.models.stream_tips.create({
        tip_id: uuidv4(),
        stream_id: streamId,
        from_user_id: fromUserId,
        to_user_id: toUserId,
        amount: amount,
        message: message
      });

      // Transfer funds (95% au streamer, 5% platform fee)
      const platformFee = amount * 0.05;
      const streamerAmount = amount - platformFee;

      await wallet.update({
        balance: wallet.balance - amount
      });

      // Crédit au streamer
      const streamerWallet = await this.models.wallets.findOne({
        where: { user_id: toUserId }
      });

      if (streamerWallet) {
        await streamerWallet.update({
          balance: streamerWallet.balance + streamerAmount,
          total_won: streamerWallet.total_won + streamerAmount
        });
      }

      // NOTE: Le broadcast est géré par le socket dans streaming.socket.js
      // pour utiliser le namespace correct

      console.log(`[Streaming] Tip sent: $${amount} from ${fromUserId} to ${toUserId}`);

      return tip;
    } catch (error) {
      throw new Error(`Error sending tip: ${error.message}`);
    }
  }

  /**
   * Terminer un stream
   */
  async endStream(streamId, userId) {
    try {
      const stream = await this.models.streams.findByPk(streamId);
      
      if (!stream) {
        throw new Error('Stream not found');
      }

      if (stream.streamer_id !== userId) {
        throw new Error('Not authorized to end this stream');
      }

      const duration = Math.floor((Date.now() - new Date(stream.started_at)) / 1000);

      await stream.update({
        status: 'ENDED',
        ended_at: new Date(),
        duration_seconds: duration
      });

      // Clean up active streams cache
      this.activeStreams.delete(streamId);

      // Notifier tous les viewers
      if (this.io) {
        this.io.to(`stream_${streamId}`).emit('stream_ended', {
          stream_id: streamId,
          duration: duration
        });
      }

      console.log(`[Streaming] Stream ended: ${streamId} (${duration}s)`);

      return stream;
    } catch (error) {
      throw new Error(`Error ending stream: ${error.message}`);
    }
  }

  /**
   * Update viewer count
   */
  async updateViewerCount(streamId, count) {
    try {
      const stream = await this.models.streams.findByPk(streamId);
      
      if (!stream) return;

      const updates = { viewer_count: count };
      
      // Update peak viewers si nécessaire
      if (count > stream.peak_viewers) {
        updates.peak_viewers = count;
      }

      await stream.update(updates);
    } catch (error) {
      console.error(`Error updating viewer count: ${error.message}`);
    }
  }

  /**
   * Get stream by ID
   */
  async getStream(streamId) {
    try {
      const stream = await this.models.streams.findByPk(streamId);
      
      if (!stream) {
        throw new Error('Stream not found');
      }

      return stream;
    } catch (error) {
      throw new Error(`Error getting stream: ${error.message}`);
    }
  }

  /**
   * Get live streams
   */
  async getLiveStreams(limit = 20, offset = 0) {
    try {
      const streams = await this.models.streams.findAll({
        where: { status: 'LIVE' },
        order: [['viewer_count', 'DESC'], ['started_at', 'DESC']],
        limit,
        offset
      });

      return streams;
    } catch (error) {
      throw new Error(`Error getting live streams: ${error.message}`);
    }
  }

  /**
   * Get user's streams (streamer)
   */
  async getUserStreams(userId, limit = 20) {
    try {
      const streams = await this.models.streams.findAll({
        where: { streamer_id: userId },
        order: [['started_at', 'DESC']],
        limit
      });

      return streams;
    } catch (error) {
      throw new Error(`Error getting user streams: ${error.message}`);
    }
  }

  /**
   * Get stream statistics
   */
  async getStreamStats(streamId) {
    try {
      const stream = await this.models.streams.findByPk(streamId);
      
      if (!stream) {
        throw new Error('Stream not found');
      }

      // Total tips
      const totalTips = await this.models.stream_tips.sum('amount', {
        where: { stream_id: streamId }
      });

      // Message count
      const messageCount = await this.models.stream_messages.count({
        where: { stream_id: streamId }
      });

      // Average watch time
      const avgWatchTime = await this.models.stream_viewers.findOne({
        attributes: [
          [this.models.sequelize.fn('AVG', 
            this.models.sequelize.col('watch_duration_seconds')), 'avg_watch_time']
        ],
        where: { stream_id: streamId },
        raw: true
      });

      // Current viewers (from cache)
      const streamData = this.activeStreams.get(streamId);
      const currentViewers = streamData ? streamData.viewers.size : 0;

      return {
        stream,
        total_tips: totalTips || 0,
        message_count: messageCount,
        avg_watch_time: avgWatchTime?.avg_watch_time || 0,
        current_viewers: currentViewers
      };
    } catch (error) {
      throw new Error(`Error getting stream stats: ${error.message}`);
    }
  }

  /**
   * Get chat messages for a stream
   */
  async getChatMessages(streamId, limit = 100) {
    try {
      const messages = await this.models.stream_messages.findAll({
        where: { stream_id: streamId },
        order: [['created_at', 'DESC']],
        limit
      });

      return messages.reverse(); // Plus ancien au plus récent
    } catch (error) {
      throw new Error(`Error getting chat messages: ${error.message}`);
    }
  }

  /**
   * Get active stream data from cache
   */
  getActiveStreamData(streamId) {
    return this.activeStreams.get(streamId);
  }

  /**
   * Check if user is streaming
   */
  isUserStreaming(userId) {
    for (const [streamId, data] of this.activeStreams.entries()) {
      if (data.streamer_id === userId) {
        return streamId;
      }
    }
    return null;
  }
}

module.exports = StreamingService;

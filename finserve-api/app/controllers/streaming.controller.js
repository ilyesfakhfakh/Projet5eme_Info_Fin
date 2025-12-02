const db = require('../models');

// Note: StreamingService instance sera passée via le router
let streamingService = null;

// Initialiser le service (appelé depuis les routes)
const initService = (service) => {
  streamingService = service;
};

/**
 * Créer un nouveau stream
 * POST /api/v1/streaming/create
 */
const createStream = async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId || 'demo-user';
    const { title, description, category, thumbnail_url } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'Stream title is required'
      });
    }

    // Vérifier si user est déjà en train de streamer
    const existingStreamId = streamingService.isUserStreaming(userId);
    if (existingStreamId) {
      return res.status(400).json({
        success: false,
        error: 'You already have an active stream',
        stream_id: existingStreamId
      });
    }

    const stream = await streamingService.createStream(userId, {
      title,
      description,
      category,
      thumbnail_url
    });

    res.json({
      success: true,
      stream: {
        stream_id: stream.stream_id,
        streamer_id: stream.streamer_id,
        title: stream.title,
        description: stream.description,
        status: stream.status,
        started_at: stream.started_at,
        category: stream.category
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get stream par ID
 * GET /api/v1/streaming/:streamId
 */
const getStream = async (req, res) => {
  try {
    const { streamId } = req.params;

    const stream = await streamingService.getStream(streamId);

    res.json({
      success: true,
      stream: stream
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get tous les streams live
 * GET /api/v1/streaming/live
 */
const getLiveStreams = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const streams = await streamingService.getLiveStreams(limit, offset);

    res.json({
      success: true,
      count: streams.length,
      streams: streams
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get streams d'un user (streamer)
 * GET /api/v1/streaming/user/:userId/streams
 */
const getUserStreams = async (req, res) => {
  try {
    const userId = req.params.userId || req.user?.id || 'demo-user';
    const limit = parseInt(req.query.limit) || 20;

    const streams = await streamingService.getUserStreams(userId, limit);

    res.json({
      success: true,
      count: streams.length,
      streams: streams
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Terminer un stream
 * POST /api/v1/streaming/:streamId/end
 */
const endStream = async (req, res) => {
  try {
    const { streamId } = req.params;
    const userId = req.user?.id || req.body.userId || 'demo-user';

    const stream = await streamingService.endStream(streamId, userId);

    res.json({
      success: true,
      stream: {
        stream_id: stream.stream_id,
        status: stream.status,
        duration_seconds: stream.duration_seconds,
        ended_at: stream.ended_at
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get statistiques d'un stream
 * GET /api/v1/streaming/:streamId/stats
 */
const getStreamStats = async (req, res) => {
  try {
    const { streamId } = req.params;

    const stats = await streamingService.getStreamStats(streamId);

    res.json({
      success: true,
      stats: {
        stream_id: streamId,
        title: stats.stream.title,
        streamer_id: stats.stream.streamer_id,
        status: stats.stream.status,
        viewer_count: stats.stream.viewer_count,
        peak_viewers: stats.stream.peak_viewers,
        current_viewers: stats.current_viewers,
        total_tips: stats.total_tips,
        message_count: stats.message_count,
        avg_watch_time: stats.avg_watch_time,
        duration_seconds: stats.stream.duration_seconds,
        started_at: stats.stream.started_at,
        ended_at: stats.stream.ended_at
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get messages du chat
 * GET /api/v1/streaming/:streamId/chat
 */
const getChatMessages = async (req, res) => {
  try {
    const { streamId } = req.params;
    const limit = parseInt(req.query.limit) || 100;

    const messages = await streamingService.getChatMessages(streamId, limit);

    res.json({
      success: true,
      count: messages.length,
      messages: messages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Upload recording (placeholder)
 * POST /api/v1/streaming/:streamId/upload
 */
const uploadRecording = async (req, res) => {
  try {
    const { streamId } = req.params;
    
    // TODO: Implement S3 upload
    // const file = req.file;
    // const s3Url = await uploadToS3(file);
    
    // await db.streams.update(
    //   { recording_url: s3Url },
    //   { where: { stream_id: streamId } }
    // );

    res.json({
      success: true,
      message: 'Recording upload endpoint (to be implemented with S3)'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  initService,
  createStream,
  getStream,
  getLiveStreams,
  getUserStreams,
  endStream,
  getStreamStats,
  getChatMessages,
  uploadRecording
};

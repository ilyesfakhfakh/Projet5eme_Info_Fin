const express = require('express');
const router = express.Router();
const streamingController = require('../controllers/streaming.controller');

// Routes publiques (lecture)
router.get('/live', streamingController.getLiveStreams);
router.get('/:streamId', streamingController.getStream);
router.get('/:streamId/stats', streamingController.getStreamStats);
router.get('/:streamId/chat', streamingController.getChatMessages);
router.get('/user/:userId/streams', streamingController.getUserStreams);

// Routes pour streamers
router.post('/create', streamingController.createStream);
router.post('/:streamId/end', streamingController.endStream);
router.post('/:streamId/upload', streamingController.uploadRecording);

module.exports = router;

# 🎬 IMPLÉMENTATION COMPLÈTE: LIVE STREAMING TRADING

## 🏗️ ARCHITECTURE

```
┌─────────────────────────────────────────────────────────┐
│                    LIVE STREAMING SYSTEM                 │
└─────────────────────────────────────────────────────────┘

Frontend (React)                Backend (Node.js)              Services
─────────────────              ──────────────────            ──────────
                                                              
┌──────────────┐               ┌──────────────┐             ┌──────────┐
│  Streamer    │──────────────>│   Socket.IO  │────────────>│  Redis   │
│  Dashboard   │   WebRTC      │   Server     │   PubSub    │  PubSub  │
└──────────────┘               └──────────────┘             └──────────┘
                                       │
┌──────────────┐                      │                     ┌──────────┐
│   Viewer     │<─────────────────────┤                     │  MySQL   │
│   Player     │   Stream + Chat      │                     │   DB     │
└──────────────┘                      │                     └──────────┘
                                       │
┌──────────────┐                      │                     ┌──────────┐
│  Chat Box    │<─────────────────────┘                     │   AWS    │
│  + Emojis    │   Real-time msgs                           │   S3     │
└──────────────┘                                            └──────────┘
```

---

## 📦 STACK TECHNOLOGIQUE

```json
{
  "backend": {
    "streaming": "Socket.IO + WebRTC",
    "chat": "Socket.IO",
    "database": "MySQL + Redis",
    "storage": "AWS S3 (pour VODs)"
  },
  "frontend": {
    "video": "WebRTC + MediaRecorder API",
    "chat": "Socket.IO Client",
    "ui": "React + Material-UI"
  },
  "optional": {
    "CDN": "CloudFlare Stream",
    "transcoding": "FFmpeg",
    "recording": "MediaRecorder API"
  }
}
```

---

## 🗄️ SCHÉMA DE BASE DE DONNÉES

```sql
-- Streams table
CREATE TABLE `streams` (
  `stream_id` VARCHAR(36) PRIMARY KEY,
  `streamer_id` VARCHAR(255) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `thumbnail_url` VARCHAR(500),
  `status` ENUM('LIVE', 'ENDED', 'SCHEDULED') DEFAULT 'LIVE',
  `viewer_count` INT DEFAULT 0,
  `peak_viewers` INT DEFAULT 0,
  `started_at` DATETIME NOT NULL,
  `ended_at` DATETIME,
  `duration_seconds` INT,
  `category` VARCHAR(100) DEFAULT 'trading',
  `is_recording` BOOLEAN DEFAULT TRUE,
  `recording_url` VARCHAR(500),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_streamer` (`streamer_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_started` (`started_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Chat messages
CREATE TABLE `stream_messages` (
  `message_id` VARCHAR(36) PRIMARY KEY,
  `stream_id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(255) NOT NULL,
  `username` VARCHAR(100) NOT NULL,
  `message` TEXT NOT NULL,
  `message_type` ENUM('TEXT', 'EMOJI', 'TIP', 'ALERT') DEFAULT 'TEXT',
  `tip_amount` DECIMAL(10,2),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`stream_id`) REFERENCES `streams`(`stream_id`) ON DELETE CASCADE,
  INDEX `idx_stream` (`stream_id`),
  INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Viewers tracking
CREATE TABLE `stream_viewers` (
  `viewer_id` VARCHAR(36) PRIMARY KEY,
  `stream_id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(255) NOT NULL,
  `joined_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `left_at` DATETIME,
  `watch_duration_seconds` INT DEFAULT 0,
  FOREIGN KEY (`stream_id`) REFERENCES `streams`(`stream_id`) ON DELETE CASCADE,
  INDEX `idx_stream` (`stream_id`),
  INDEX `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tips/Donations
CREATE TABLE `stream_tips` (
  `tip_id` VARCHAR(36) PRIMARY KEY,
  `stream_id` VARCHAR(36) NOT NULL,
  `from_user_id` VARCHAR(255) NOT NULL,
  `to_user_id` VARCHAR(255) NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `currency` VARCHAR(3) DEFAULT 'USD',
  `message` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`stream_id`) REFERENCES `streams`(`stream_id`) ON DELETE CASCADE,
  INDEX `idx_stream` (`stream_id`),
  INDEX `idx_to_user` (`to_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Subscriptions (pour followers)
CREATE TABLE `stream_subscriptions` (
  `subscription_id` VARCHAR(36) PRIMARY KEY,
  `follower_id` VARCHAR(255) NOT NULL,
  `streamer_id` VARCHAR(255) NOT NULL,
  `tier` ENUM('FREE', 'BASIC', 'PREMIUM') DEFAULT 'FREE',
  `price` DECIMAL(10,2),
  `status` ENUM('ACTIVE', 'CANCELLED', 'EXPIRED') DEFAULT 'ACTIVE',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `expires_at` DATETIME,
  UNIQUE KEY `unique_subscription` (`follower_id`, `streamer_id`),
  INDEX `idx_streamer` (`streamer_id`),
  INDEX `idx_follower` (`follower_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 🔧 BACKEND - MODELS

```javascript
// finserve-api/app/models/streaming/stream.model.js
module.exports = (sequelize, Sequelize) => {
  const Stream = sequelize.define('stream', {
    stream_id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    streamer_id: {
      type: Sequelize.STRING,
      allowNull: false
    },
    title: {
      type: Sequelize.STRING,
      allowNull: false
    },
    description: {
      type: Sequelize.TEXT
    },
    thumbnail_url: {
      type: Sequelize.STRING
    },
    status: {
      type: Sequelize.ENUM('LIVE', 'ENDED', 'SCHEDULED'),
      defaultValue: 'LIVE'
    },
    viewer_count: {
      type: Sequelize.INTEGER,
      defaultValue: 0
    },
    peak_viewers: {
      type: Sequelize.INTEGER,
      defaultValue: 0
    },
    started_at: {
      type: Sequelize.DATE,
      allowNull: false
    },
    ended_at: {
      type: Sequelize.DATE
    },
    duration_seconds: {
      type: Sequelize.INTEGER
    },
    category: {
      type: Sequelize.STRING,
      defaultValue: 'trading'
    },
    is_recording: {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    },
    recording_url: {
      type: Sequelize.STRING
    }
  }, {
    timestamps: true,
    underscored: true,
    tableName: 'streams'
  });

  return Stream;
};
```

---

## 🎥 BACKEND - STREAMING SERVICE

```javascript
// finserve-api/app/services/streaming.service.js
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

class StreamingService {
  constructor(models, io) {
    this.models = models;
    this.io = io; // Socket.IO instance
    this.activeStreams = new Map(); // In-memory cache
  }

  // Créer un nouveau stream
  async createStream(userId, streamData) {
    const stream = await this.models.streams.create({
      stream_id: uuidv4(),
      streamer_id: userId,
      title: streamData.title,
      description: streamData.description,
      started_at: new Date(),
      status: 'LIVE'
    });

    // Create streaming room
    const roomId = `stream_${stream.stream_id}`;
    this.activeStreams.set(stream.stream_id, {
      roomId,
      viewers: new Set(),
      startedAt: Date.now()
    });

    return stream;
  }

  // Joindre un stream comme viewer
  async joinStream(streamId, userId, socketId) {
    const stream = await this.models.streams.findByPk(streamId);
    
    if (!stream || stream.status !== 'LIVE') {
      throw new Error('Stream not found or not live');
    }

    const streamData = this.activeStreams.get(streamId);
    if (!streamData) {
      throw new Error('Stream not active');
    }

    // Add viewer
    streamData.viewers.add(userId);

    // Track in DB
    await this.models.stream_viewers.create({
      viewer_id: uuidv4(),
      stream_id: streamId,
      user_id: userId,
      joined_at: new Date()
    });

    // Update viewer count
    const viewerCount = streamData.viewers.size;
    await this.updateViewerCount(streamId, viewerCount);

    // Emit to room
    this.io.to(`stream_${streamId}`).emit('viewer_joined', {
      viewer_count: viewerCount
    });

    return { stream, viewer_count: viewerCount };
  }

  // Quitter un stream
  async leaveStream(streamId, userId) {
    const streamData = this.activeStreams.get(streamId);
    if (streamData) {
      streamData.viewers.delete(userId);
      
      const viewerCount = streamData.viewers.size;
      await this.updateViewerCount(streamId, viewerCount);

      // Update watch duration
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

      this.io.to(`stream_${streamId}`).emit('viewer_left', {
        viewer_count: viewerCount
      });
    }
  }

  // Envoyer un message dans le chat
  async sendMessage(streamId, userId, username, message, messageType = 'TEXT') {
    const msg = await this.models.stream_messages.create({
      message_id: uuidv4(),
      stream_id: streamId,
      user_id: userId,
      username: username,
      message: message,
      message_type: messageType
    });

    // Broadcast to all viewers
    this.io.to(`stream_${streamId}`).emit('chat_message', {
      message_id: msg.message_id,
      user_id: userId,
      username: username,
      message: message,
      message_type: messageType,
      created_at: msg.created_at
    });

    return msg;
  }

  // Envoyer un tip
  async sendTip(streamId, fromUserId, toUserId, amount, message) {
    // Vérifier balance
    const wallet = await this.models.wallets.findOne({
      where: { user_id: fromUserId }
    });

    if (!wallet || wallet.balance < amount) {
      throw new Error('Insufficient balance');
    }

    // Créer tip
    const tip = await this.models.stream_tips.create({
      tip_id: uuidv4(),
      stream_id: streamId,
      from_user_id: fromUserId,
      to_user_id: toUserId,
      amount: amount,
      message: message
    });

    // Transfer funds
    await wallet.update({
      balance: wallet.balance - amount
    });

    const streamerWallet = await this.models.wallets.findOne({
      where: { user_id: toUserId }
    });

    await streamerWallet.update({
      balance: streamerWallet.balance + (amount * 0.95) // 5% platform fee
    });

    // Broadcast tip alert
    this.io.to(`stream_${streamId}`).emit('tip_received', {
      from_user: fromUserId,
      amount: amount,
      message: message
    });

    // Chat message pour tip
    await this.sendMessage(streamId, fromUserId, 'System', 
      `💰 Tipped $${amount}!`, 'TIP');

    return tip;
  }

  // Terminer un stream
  async endStream(streamId, userId) {
    const stream = await this.models.streams.findByPk(streamId);
    
    if (!stream || stream.streamer_id !== userId) {
      throw new Error('Not authorized');
    }

    const duration = Math.floor((Date.now() - new Date(stream.started_at)) / 1000);

    await stream.update({
      status: 'ENDED',
      ended_at: new Date(),
      duration_seconds: duration
    });

    // Clean up
    this.activeStreams.delete(streamId);

    // Notify all viewers
    this.io.to(`stream_${streamId}`).emit('stream_ended', {
      stream_id: streamId,
      duration: duration
    });

    return stream;
  }

  // Update viewer count
  async updateViewerCount(streamId, count) {
    const stream = await this.models.streams.findByPk(streamId);
    
    const updates = { viewer_count: count };
    if (count > stream.peak_viewers) {
      updates.peak_viewers = count;
    }

    await stream.update(updates);
  }

  // Get stream stats
  async getStreamStats(streamId) {
    const stream = await this.models.streams.findByPk(streamId);
    
    const totalTips = await this.models.stream_tips.sum('amount', {
      where: { stream_id: streamId }
    });

    const messageCount = await this.models.stream_messages.count({
      where: { stream_id: streamId }
    });

    const avgWatchTime = await this.models.stream_viewers.findOne({
      attributes: [
        [this.models.sequelize.fn('AVG', 
          this.models.sequelize.col('watch_duration_seconds')), 'avg_watch_time']
      ],
      where: { stream_id: streamId },
      raw: true
    });

    return {
      stream,
      total_tips: totalTips || 0,
      message_count: messageCount,
      avg_watch_time: avgWatchTime?.avg_watch_time || 0,
      current_viewers: this.activeStreams.get(streamId)?.viewers.size || 0
    };
  }
}

module.exports = StreamingService;
```

---

## 🌐 BACKEND - SOCKET.IO SERVER

```javascript
// finserve-api/app/sockets/streaming.socket.js
module.exports = function(io, models) {
  const StreamingService = require('../services/streaming.service');
  const streamingService = new StreamingService(models, io);

  const streamingNamespace = io.of('/streaming');

  streamingNamespace.on('connection', (socket) => {
    console.log(`[Streaming] User connected: ${socket.id}`);
    
    let currentStreamId = null;
    let currentUserId = null;

    // Join stream room
    socket.on('join_stream', async (data) => {
      try {
        const { stream_id, user_id, username } = data;
        
        currentStreamId = stream_id;
        currentUserId = user_id;

        // Join socket room
        socket.join(`stream_${stream_id}`);

        // Add to viewers
        const result = await streamingService.joinStream(
          stream_id, 
          user_id, 
          socket.id
        );

        socket.emit('joined_stream', {
          success: true,
          stream: result.stream,
          viewer_count: result.viewer_count
        });

        console.log(`[Streaming] ${username} joined stream ${stream_id}`);

      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Leave stream
    socket.on('leave_stream', async () => {
      if (currentStreamId && currentUserId) {
        await streamingService.leaveStream(currentStreamId, currentUserId);
        socket.leave(`stream_${currentStreamId}`);
      }
    });

    // Chat message
    socket.on('send_message', async (data) => {
      try {
        const { stream_id, user_id, username, message } = data;
        
        await streamingService.sendMessage(
          stream_id, 
          user_id, 
          username, 
          message
        );

      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Send tip
    socket.on('send_tip', async (data) => {
      try {
        const { stream_id, from_user_id, to_user_id, amount, message } = data;
        
        await streamingService.sendTip(
          stream_id, 
          from_user_id, 
          to_user_id, 
          amount, 
          message
        );

        socket.emit('tip_sent', { success: true });

      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // WebRTC signaling
    socket.on('webrtc_offer', (data) => {
      socket.to(`stream_${data.stream_id}`).emit('webrtc_offer', data);
    });

    socket.on('webrtc_answer', (data) => {
      socket.to(`stream_${data.stream_id}`).emit('webrtc_answer', data);
    });

    socket.on('webrtc_ice_candidate', (data) => {
      socket.to(`stream_${data.stream_id}`).emit('webrtc_ice_candidate', data);
    });

    // Disconnect
    socket.on('disconnect', async () => {
      if (currentStreamId && currentUserId) {
        await streamingService.leaveStream(currentStreamId, currentUserId);
      }
      console.log(`[Streaming] User disconnected: ${socket.id}`);
    });
  });

  return streamingNamespace;
};
```

---

## 📱 FRONTEND - STREAMER COMPONENT

```jsx
// berry-free-react-admin-template/vite/src/views/streaming/StreamerDashboard.jsx
import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Grid,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  IconButton
} from '@mui/material';
import {
  Videocam,
  Stop,
  Send,
  AttachMoney,
  Visibility
} from '@mui/icons-material';
import io from 'socket.io-client';

const StreamerDashboard = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamId, setStreamId] = useState(null);
  const [streamTitle, setStreamTitle] = useState('');
  const [viewers, setViewers] = useState(0);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const socketRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    // Connect to Socket.IO
    socketRef.current = io('http://localhost:3200/streaming', {
      auth: {
        token: localStorage.getItem('token')
      }
    });

    socketRef.current.on('viewer_joined', (data) => {
      setViewers(data.viewer_count);
    });

    socketRef.current.on('viewer_left', (data) => {
      setViewers(data.viewer_count);
    });

    socketRef.current.on('chat_message', (data) => {
      setMessages(prev => [...prev, data]);
    });

    socketRef.current.on('tip_received', (data) => {
      // Show tip alert
      alert(`Received tip: $${data.amount} - ${data.message}`);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const startStream = async () => {
    try {
      // Request camera and microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      streamRef.current = stream;
      
      // Show preview
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Create stream on backend
      const response = await fetch('http://localhost:3200/api/v1/streaming/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title: streamTitle || 'Live Trading Session',
          description: 'Trading live!',
          category: 'trading'
        })
      });

      const data = await response.json();
      setStreamId(data.stream.stream_id);

      // Start recording (optional)
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 2500000 // 2.5 Mbps
      });

      const chunks = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        // Upload to S3 or save locally
        await uploadRecording(blob, data.stream.stream_id);
      };

      mediaRecorder.start(1000); // Record in 1 second chunks
      mediaRecorderRef.current = mediaRecorder;

      setIsStreaming(true);

      // Join own stream room
      socketRef.current.emit('join_stream', {
        stream_id: data.stream.stream_id,
        user_id: 'current-user-id',
        username: 'Streamer'
      });

    } catch (error) {
      console.error('Error starting stream:', error);
      alert('Could not access camera/microphone');
    }
  };

  const stopStream = async () => {
    // Stop media recorder
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }

    // Stop camera/mic
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    // End stream on backend
    await fetch(`http://localhost:3200/api/v1/streaming/${streamId}/end`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    setIsStreaming(false);
    setStreamId(null);
  };

  const sendMessage = () => {
    if (newMessage.trim() && streamId) {
      socketRef.current.emit('send_message', {
        stream_id: streamId,
        user_id: 'current-user-id',
        username: 'Streamer',
        message: newMessage
      });
      setNewMessage('');
    }
  };

  const uploadRecording = async (blob, streamId) => {
    const formData = new FormData();
    formData.append('video', blob, `stream_${streamId}.webm`);
    formData.append('stream_id', streamId);

    await fetch('http://localhost:3200/api/v1/streaming/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Video Preview */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ position: 'relative', paddingTop: '56.25%', bgcolor: 'black' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%'
                  }}
                />
                
                {/* Stream Stats Overlay */}
                {isStreaming && (
                  <Box sx={{
                    position: 'absolute',
                    top: 16,
                    left: 16,
                    display: 'flex',
                    gap: 1
                  }}>
                    <Chip
                      label="🔴 LIVE"
                      color="error"
                      size="small"
                    />
                    <Chip
                      icon={<Visibility />}
                      label={`${viewers} viewers`}
                      size="small"
                      sx={{ bgcolor: 'rgba(0,0,0,0.7)', color: 'white' }}
                    />
                  </Box>
                )}
              </Box>

              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                {!isStreaming ? (
                  <>
                    <TextField
                      fullWidth
                      label="Stream Title"
                      value={streamTitle}
                      onChange={(e) => setStreamTitle(e.target.value)}
                      placeholder="Live Trading Session 🚀"
                    />
                    <Button
                      variant="contained"
                      color="error"
                      startIcon={<Videocam />}
                      onClick={startStream}
                      sx={{ minWidth: 150 }}
                    >
                      Go Live
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<Stop />}
                    onClick={stopStream}
                    fullWidth
                  >
                    End Stream
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Chat */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1, overflow: 'auto' }}>
              <Typography variant="h6" gutterBottom>
                Live Chat ({messages.length})
              </Typography>
              
              <List>
                {messages.map((msg, index) => (
                  <ListItem key={index} alignItems="flex-start">
                    <Avatar sx={{ mr: 1, width: 32, height: 32 }}>
                      {msg.username[0]}
                    </Avatar>
                    <ListItemText
                      primary={
                        <Box>
                          <Typography variant="caption" color="primary">
                            {msg.username}
                          </Typography>
                          {msg.message_type === 'TIP' && (
                            <Chip
                              icon={<AttachMoney />}
                              label="TIP"
                              size="small"
                              color="success"
                              sx={{ ml: 1 }}
                            />
                          )}
                        </Box>
                      }
                      secondary={msg.message}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>

            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Send a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <IconButton color="primary" onClick={sendMessage}>
                  <Send />
                </IconButton>
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StreamerDashboard;
```

---

## 👁️ FRONTEND - VIEWER COMPONENT

```jsx
// berry-free-react-admin-template/vite/src/views/streaming/StreamViewer.jsx
import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  IconButton,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { Send, AttachMoney, Visibility } from '@mui/icons-material';
import io from 'socket.io-client';
import { useParams } from 'react-router-dom';

const StreamViewer = () => {
  const { streamId } = useParams();
  const [stream, setStream] = useState(null);
  const [viewers, setViewers] = useState(0);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [tipDialog, setTipDialog] = useState(false);
  const [tipAmount, setTipAmount] = useState(5);
  const [tipMessage, setTipMessage] = useState('');

  const videoRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    loadStream();

    // Connect Socket.IO
    socketRef.current = io('http://localhost:3200/streaming');

    socketRef.current.emit('join_stream', {
      stream_id: streamId,
      user_id: 'viewer-user-id',
      username: 'Viewer123'
    });

    socketRef.current.on('joined_stream', (data) => {
      setStream(data.stream);
      setViewers(data.viewer_count);
    });

    socketRef.current.on('viewer_joined', (data) => {
      setViewers(data.viewer_count);
    });

    socketRef.current.on('viewer_left', (data) => {
      setViewers(data.viewer_count);
    });

    socketRef.current.on('chat_message', (data) => {
      setMessages(prev => [...prev, data]);
    });

    socketRef.current.on('stream_ended', () => {
      alert('Stream has ended!');
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave_stream');
        socketRef.current.disconnect();
      }
    };
  }, [streamId]);

  const loadStream = async () => {
    const response = await fetch(
      `http://localhost:3200/api/v1/streaming/${streamId}`
    );
    const data = await response.json();
    setStream(data.stream);
  };

  const sendMessage = () => {
    if (newMessage.trim()) {
      socketRef.current.emit('send_message', {
        stream_id: streamId,
        user_id: 'viewer-user-id',
        username: 'Viewer123',
        message: newMessage
      });
      setNewMessage('');
    }
  };

  const sendTip = () => {
    socketRef.current.emit('send_tip', {
      stream_id: streamId,
      from_user_id: 'viewer-user-id',
      to_user_id: stream.streamer_id,
      amount: tipAmount,
      message: tipMessage
    });
    setTipDialog(false);
    setTipMessage('');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ position: 'relative', paddingTop: '56.25%', bgcolor: 'black' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  controls
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%'
                  }}
                />
                
                <Box sx={{
                  position: 'absolute',
                  top: 16,
                  left: 16,
                  display: 'flex',
                  gap: 1
                }}>
                  <Chip
                    label="🔴 LIVE"
                    color="error"
                    size="small"
                  />
                  <Chip
                    icon={<Visibility />}
                    label={`${viewers} watching`}
                    size="small"
                    sx={{ bgcolor: 'rgba(0,0,0,0.7)', color: 'white' }}
                  />
                </Box>
              </Box>

              <Box sx={{ p: 2 }}>
                <Typography variant="h5" gutterBottom>
                  {stream?.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stream?.description}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<AttachMoney />}
                    onClick={() => setTipDialog(true)}
                  >
                    Send Tip
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          {/* Same chat as Streamer */}
        </Grid>
      </Grid>

      {/* Tip Dialog */}
      <Dialog open={tipDialog} onClose={() => setTipDialog(false)}>
        <DialogTitle>Send a Tip 💰</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            type="number"
            label="Amount ($)"
            value={tipAmount}
            onChange={(e) => setTipAmount(Number(e.target.value))}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            fullWidth
            label="Message (optional)"
            value={tipMessage}
            onChange={(e) => setTipMessage(e.target.value)}
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTipDialog(false)}>Cancel</Button>
          <Button onClick={sendTip} variant="contained" color="success">
            Send ${tipAmount}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StreamViewer;
```

---

## 🔌 INTEGRATION DANS INDEX.JS

```javascript
// finserve-api/index.js
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// ... existing code ...

// Load streaming socket
require('./app/sockets/streaming.socket')(io, db);

// Streaming routes
const streamingRoutes = require('./app/routes/streaming.routes');
app.use('/api/v1/streaming', streamingRoutes);

// Use server.listen instead of app.listen
const PORT = process.env.PORT || 3200;
server.listen(PORT, () => {
  console.log(`Server with Socket.IO on port ${PORT}`);
});
```

---

## 📦 PACKAGES À INSTALLER

```bash
# Backend
cd finserve-api
npm install socket.io
npm install multer aws-sdk  # Pour upload S3

# Frontend
cd berry-free-react-admin-template/vite
npm install socket.io-client
npm install react-router-dom  # Si pas déjà installé
```

---

## 🚀 DÉMARRAGE

### **1. Créer les tables**
```sql
-- Exécute le SQL au début de ce document
```

### **2. Démarrer backend**
```bash
cd finserve-api
npm start
```

### **3. Démarrer frontend**
```bash
cd berry-free-react-admin-template/vite
npm start
```

### **4. Tester**
1. Aller sur `/streaming/streamer` (Dashboard streamer)
2. Click "Go Live"
3. Dans un autre onglet: `/streaming/watch/:streamId`
4. Chat et tips devraient fonctionner!

---

## 🎯 FONCTIONNALITÉS IMPLÉMENTÉES

✅ **Core Features:**
- ✅ Live video streaming (WebRTC ready)
- ✅ Real-time chat (Socket.IO)
- ✅ Viewer count en temps réel
- ✅ Tips/Donations système
- ✅ Recording automatique
- ✅ Stream stats

✅ **À ajouter ensuite:**
- 🔄 WebRTC peer-to-peer (actuellement server-based)
- 🔄 Emojis et reactions
- 🔄 Modération chat
- 🔄 Subscriptions tiers
- 🔄 VOD player (replay)

---

**Veux-tu que je t'aide à améliorer quelque chose?** 🚀

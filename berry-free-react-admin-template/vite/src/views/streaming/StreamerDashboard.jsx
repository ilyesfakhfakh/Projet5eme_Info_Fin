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
  IconButton,
  Paper,
  Alert
} from '@mui/material';
import {
  Videocam,
  Stop,
  Send,
  AttachMoney,
  Visibility,
  Person
} from '@mui/icons-material';
import io from 'socket.io-client';

const StreamerDashboard = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamId, setStreamId] = useState(null);
  const [streamTitle, setStreamTitle] = useState('Live Trading Session 🚀');
  const [streamDescription, setStreamDescription] = useState('');
  const [viewers, setViewers] = useState(0);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const socketRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startStream = async () => {
    try {
      setError('');
      
      // 1. Request camera and microphone
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      streamRef.current = stream;
      
      // 2. Show preview
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // 3. Create stream on backend
      const response = await fetch('http://localhost:3200/api/v1/streaming/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: streamTitle,
          description: streamDescription,
          category: 'trading',
          userId: 'demo-streamer'
        })
      });

      const data = await response.json();
      
      if (!data.success) {
        if (data.error && data.error.includes('already have an active stream')) {
          setError('❌ Vous avez déjà un stream actif! Fermez-le d\'abord ou attendez qu\'il se termine.');
        } else {
          setError(data.error || 'Erreur lors de la création du stream');
        }
        
        // Stop camera/mic if stream creation failed
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
        return;
      }

      setStreamId(data.stream.stream_id);
      setIsStreaming(true);
      setSuccess('🎉 Stream started!');

      // 4. Connect to Socket.IO
      socketRef.current = io('http://localhost:3200/streaming');

      socketRef.current.on('connect', () => {
        console.log('✅ Socket connected');
        
        // Join own stream room
        socketRef.current.emit('join_stream', {
          stream_id: data.stream.stream_id,
          user_id: 'demo-streamer',
          username: 'Streamer'
        });
      });

      socketRef.current.on('viewer_joined', (socketData) => {
        setViewers(socketData.viewer_count);
      });

      socketRef.current.on('viewer_left', (socketData) => {
        setViewers(socketData.viewer_count);
      });

      socketRef.current.on('chat_message', (msg) => {
        setMessages(prev => [...prev, msg]);
      });

      socketRef.current.on('tip_received', (tipData) => {
        setSuccess(`💰 Received tip: $${tipData.amount}!`);
        setTimeout(() => setSuccess(''), 5000);
      });

      // 5. Start recording (optional)
      try {
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp9',
          videoBitsPerSecond: 2500000
        });

        const chunks = [];
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          console.log('Recording saved:', blob.size, 'bytes');
          // TODO: Upload to S3
        };

        mediaRecorder.start(1000);
        mediaRecorderRef.current = mediaRecorder;
      } catch (err) {
        console.warn('Recording not supported:', err);
      }

    } catch (err) {
      console.error('Error starting stream:', err);
      setError(err.message || 'Could not access camera/microphone');
      
      // Cleanup
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  };

  const stopStream = async () => {
    try {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }

      // Stop camera/mic
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Disconnect socket
      if (socketRef.current) {
        socketRef.current.emit('leave_stream');
        socketRef.current.disconnect();
      }

      // End stream on backend
      if (streamId) {
        await fetch(`http://localhost:3200/api/v1/streaming/${streamId}/end`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: 'demo-streamer'
          })
        });
      }

      setIsStreaming(false);
      setStreamId(null);
      setViewers(0);
      setMessages([]);
      setSuccess('✅ Stream ended');

    } catch (err) {
      console.error('Error stopping stream:', err);
      setError('Error stopping stream');
    }
  };

  const sendMessage = () => {
    if (newMessage.trim() && streamId && socketRef.current) {
      socketRef.current.emit('send_message', {
        stream_id: streamId,
        user_id: 'demo-streamer',
        username: 'Streamer',
        message: newMessage
      });
      setNewMessage('');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        🎥 Streamer Dashboard
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Grid container spacing={3}>
        {/* Video Preview */}
        <Grid item xs={12} md={9}>
          <Card>
            <CardContent>
              <Box sx={{ position: 'relative', paddingTop: '75%', bgcolor: 'black', borderRadius: 1 }}>
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
                
                {/* Stream Overlay */}
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
                      sx={{ fontWeight: 'bold' }}
                    />
                    <Chip
                      icon={<Visibility />}
                      label={`${viewers} viewers`}
                      size="small"
                      sx={{ bgcolor: 'rgba(0,0,0,0.7)', color: 'white' }}
                    />
                  </Box>
                )}

                {!isStreaming && (
                  <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    color: 'white'
                  }}>
                    <Videocam sx={{ fontSize: 64, mb: 2 }} />
                    <Typography variant="h6">
                      Click "Go Live" to start streaming
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Controls */}
              <Box sx={{ mt: 2 }}>
                {!isStreaming ? (
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Stream Title"
                        value={streamTitle}
                        onChange={(e) => setStreamTitle(e.target.value)}
                        placeholder="Live Trading Session 🚀"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Description (optional)"
                        value={streamDescription}
                        onChange={(e) => setStreamDescription(e.target.value)}
                        placeholder="Trading Bitcoin and stocks..."
                        multiline
                        rows={2}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        variant="contained"
                        color="error"
                        startIcon={<Videocam />}
                        onClick={startStream}
                        fullWidth
                        size="large"
                      >
                        Go Live
                      </Button>
                    </Grid>
                  </Grid>
                ) : (
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<Stop />}
                    onClick={stopStream}
                    fullWidth
                    size="large"
                  >
                    End Stream
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Chat */}
        <Grid item xs={12} md={3}>
          <Card sx={{ height: '800px', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
              <Typography variant="h6" gutterBottom>
                💬 Live Chat ({messages.length})
              </Typography>
              
              <List sx={{ pt: 0 }}>
                {messages.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    No messages yet. Start streaming!
                  </Typography>
                ) : (
                  messages.map((msg, index) => (
                    <ListItem key={index} alignItems="flex-start" sx={{ px: 0, py: 1 }}>
                      <Avatar sx={{ mr: 1, width: 32, height: 32, bgcolor: 'primary.main' }}>
                        <Person sx={{ fontSize: 20 }} />
                      </Avatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="caption" color="primary" fontWeight="bold">
                              {msg.username}
                            </Typography>
                            {msg.message_type === 'TIP' && (
                              <Chip
                                icon={<AttachMoney />}
                                label="TIP"
                                size="small"
                                color="success"
                                sx={{ height: 20 }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                            {msg.message}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))
                )}
              </List>
            </CardContent>

            {/* Chat Input */}
            {isStreaming && (
              <Paper sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Send a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    disabled={!isStreaming}
                  />
                  <IconButton 
                    color="primary" 
                    onClick={sendMessage}
                    disabled={!isStreaming || !newMessage.trim()}
                  >
                    <Send />
                  </IconButton>
                </Box>
              </Paper>
            )}
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StreamerDashboard;

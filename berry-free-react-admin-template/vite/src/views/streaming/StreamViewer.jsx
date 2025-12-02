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
  DialogActions,
  Grid,
  Paper,
  Avatar,
  List,
  ListItem,
  ListItemText,
  Alert
} from '@mui/material';
import { 
  Send, 
  AttachMoney, 
  Visibility,
  Person 
} from '@mui/icons-material';
import io from 'socket.io-client';
import { useParams, useNavigate } from 'react-router-dom';

const StreamViewer = () => {
  const { streamId } = useParams();
  const navigate = useNavigate();
  
  const [stream, setStream] = useState(null);
  const [viewers, setViewers] = useState(0);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [tipDialog, setTipDialog] = useState(false);
  const [tipAmount, setTipAmount] = useState(5);
  const [tipMessage, setTipMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const socketRef = useRef(null);

  useEffect(() => {
    loadStream();
    connectSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave_stream');
        socketRef.current.disconnect();
      }
    };
  }, [streamId]);

  const loadStream = async () => {
    try {
      const response = await fetch(`http://localhost:3200/api/v1/streaming/${streamId}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error);
      }

      setStream(data.stream);
      setLoading(false);

      if (data.stream.status !== 'LIVE') {
        setError('This stream is not live');
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const connectSocket = () => {
    socketRef.current = io('http://localhost:3200/streaming');

    socketRef.current.on('connect', () => {
      console.log('✅ Socket connected');
      
      socketRef.current.emit('join_stream', {
        stream_id: streamId,
        user_id: `viewer_${Math.random().toString(36).substr(2, 9)}`,
        username: `Viewer${Math.floor(Math.random() * 1000)}`
      });
    });

    socketRef.current.on('joined_stream', (data) => {
      console.log('✅ Joined stream:', data);
      setViewers(data.viewer_count);
    });

    socketRef.current.on('viewer_joined', (data) => {
      setViewers(data.viewer_count);
    });

    socketRef.current.on('viewer_left', (data) => {
      setViewers(data.viewer_count);
    });

    socketRef.current.on('chat_message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    socketRef.current.on('tip_received', (tipData) => {
      console.log('Tip received:', tipData);
    });

    socketRef.current.on('stream_ended', () => {
      setError('Stream has ended');
    });

    socketRef.current.on('error', (err) => {
      setError(err.message);
    });
  };

  const sendMessage = () => {
    if (newMessage.trim() && socketRef.current) {
      socketRef.current.emit('send_message', {
        stream_id: streamId,
        user_id: `viewer_${Math.random().toString(36).substr(2, 9)}`,
        username: `Viewer${Math.floor(Math.random() * 1000)}`,
        message: newMessage
      });
      setNewMessage('');
    }
  };

  const sendTip = () => {
    if (tipAmount > 0 && socketRef.current && stream) {
      socketRef.current.emit('send_tip', {
        stream_id: streamId,
        from_user_id: `viewer_${Math.random().toString(36).substr(2, 9)}`,
        to_user_id: stream.streamer_id,
        amount: tipAmount,
        message: tipMessage
      });
      
      setTipDialog(false);
      setTipMessage('');
      alert(`Tip of $${tipAmount} sent successfully!`);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Loading stream...</Typography>
      </Box>
    );
  }

  if (error && !stream) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={() => navigate('/streaming')} sx={{ mt: 2 }}>
          Back to streams
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* Video Player */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ position: 'relative', paddingTop: '56.25%', bgcolor: 'black' }}>
                {/* Video placeholder - In production, use WebRTC or HLS */}
                <Box sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white'
                }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" gutterBottom>
                      📹 Live Stream
                    </Typography>
                    <Typography variant="body2" color="grey.400">
                      (Video player will be implemented with WebRTC/HLS)
                    </Typography>
                  </Box>
                </Box>
                
                {/* Stream Info Overlay */}
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
                    label={`${viewers} watching`}
                    size="small"
                    sx={{ bgcolor: 'rgba(0,0,0,0.7)', color: 'white' }}
                  />
                </Box>
              </Box>

              {/* Stream Details */}
              <Box sx={{ p: 2 }}>
                <Typography variant="h5" gutterBottom>
                  {stream?.title}
                </Typography>
                {stream?.description && (
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {stream.description}
                  </Typography>
                )}
                
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<AttachMoney />}
                    onClick={() => setTipDialog(true)}
                  >
                    Send Tip
                  </Button>
                  
                  <Chip 
                    icon={<Person />}
                    label={`Streamer: ${stream?.streamer_id}`}
                    variant="outlined"
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Chat */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
              <Typography variant="h6" gutterBottom>
                💬 Live Chat ({messages.length})
              </Typography>
              
              <List sx={{ pt: 0 }}>
                {messages.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    No messages yet. Be the first to chat!
                  </Typography>
                ) : (
                  messages.map((msg, index) => (
                    <ListItem key={index} alignItems="flex-start" sx={{ px: 0, py: 1 }}>
                      <Avatar sx={{ mr: 1, width: 32, height: 32, bgcolor: 'secondary.main' }}>
                        <Person sx={{ fontSize: 20 }} />
                      </Avatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="caption" color="secondary" fontWeight="bold">
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
            <Paper sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Send a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <IconButton 
                  color="primary" 
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                >
                  <Send />
                </IconButton>
              </Box>
            </Paper>
          </Card>
        </Grid>
      </Grid>

      {/* Tip Dialog */}
      <Dialog open={tipDialog} onClose={() => setTipDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>💰 Send a Tip</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Support the streamer with a tip!
          </Typography>
          
          <TextField
            fullWidth
            type="number"
            label="Amount ($)"
            value={tipAmount}
            onChange={(e) => setTipAmount(Number(e.target.value))}
            inputProps={{ min: 1, max: 1000, step: 1 }}
            sx={{ mt: 2, mb: 2 }}
          />
          
          <TextField
            fullWidth
            label="Message (optional)"
            value={tipMessage}
            onChange={(e) => setTipMessage(e.target.value)}
            multiline
            rows={3}
            placeholder="Great stream! 🚀"
          />
          
          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {[5, 10, 25, 50, 100].map(amount => (
              <Chip
                key={amount}
                label={`$${amount}`}
                onClick={() => setTipAmount(amount)}
                color={tipAmount === amount ? 'primary' : 'default'}
                clickable
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTipDialog(false)}>Cancel</Button>
          <Button 
            onClick={sendTip} 
            variant="contained" 
            color="success"
            disabled={tipAmount <= 0}
          >
            Send ${tipAmount}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StreamViewer;

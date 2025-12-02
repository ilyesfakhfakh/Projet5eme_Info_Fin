import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Typography,
  Grid,
  Chip,
  Button,
  Alert,
  Container
} from '@mui/material';
import {
  Videocam,
  Visibility,
  Person,
  Refresh
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const StreamList = () => {
  const navigate = useNavigate();
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStreams();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(loadStreams, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadStreams = async () => {
    try {
      const response = await fetch('http://localhost:3200/api/v1/streaming/live');
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error);
      }

      setStreams(data.streams);
      setLoading(false);
      setError('');
    } catch (err) {
      console.error('Error loading streams:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const goToStream = (streamId) => {
    navigate(`/streaming/watch/${streamId}`);
  };

  const goToStreamerDashboard = () => {
    navigate('/streaming/streamer');
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography>Loading streams...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            🎬 Live Streams
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {streams.length} {streams.length === 1 ? 'stream' : 'streams'} live now
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadStreams}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<Videocam />}
            onClick={goToStreamerDashboard}
          >
            Go Live
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {streams.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Videocam sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No live streams right now
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Be the first to go live!
          </Typography>
          <Button
            variant="contained"
            color="error"
            startIcon={<Videocam />}
            onClick={goToStreamerDashboard}
          >
            Start Streaming
          </Button>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {streams.map((stream) => (
            <Grid item xs={12} sm={6} md={4} key={stream.stream_id}>
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}
              >
                <CardActionArea onClick={() => goToStream(stream.stream_id)}>
                  {/* Thumbnail */}
                  <Box sx={{ position: 'relative' }}>
                    <CardMedia
                      component="div"
                      sx={{
                        paddingTop: '56.25%', // 16:9
                        bgcolor: 'grey.900',
                        backgroundImage: stream.thumbnail_url 
                          ? `url(${stream.thumbnail_url})`
                          : 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    />
                    
                    {/* LIVE Badge */}
                    <Box sx={{
                      position: 'absolute',
                      top: 12,
                      left: 12
                    }}>
                      <Chip
                        label="🔴 LIVE"
                        color="error"
                        size="small"
                        sx={{ fontWeight: 'bold' }}
                      />
                    </Box>

                    {/* Viewer Count */}
                    <Box sx={{
                      position: 'absolute',
                      bottom: 12,
                      right: 12
                    }}>
                      <Chip
                        icon={<Visibility sx={{ fontSize: 16 }} />}
                        label={stream.viewer_count || 0}
                        size="small"
                        sx={{ 
                          bgcolor: 'rgba(0,0,0,0.7)', 
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      />
                    </Box>
                  </Box>

                  {/* Stream Info */}
                  <CardContent>
                    <Typography 
                      variant="h6" 
                      gutterBottom
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}
                    >
                      {stream.title}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {stream.streamer_id}
                      </Typography>
                    </Box>

                    {stream.description && (
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          mt: 1
                        }}
                      >
                        {stream.description}
                      </Typography>
                    )}

                    {stream.category && (
                      <Chip
                        label={stream.category}
                        size="small"
                        variant="outlined"
                        sx={{ mt: 1 }}
                      />
                    )}
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default StreamList;

import { useState, useEffect } from 'react';
import { Alert, Snackbar, IconButton, Chip, Box, Typography, Slide } from '@mui/material';
import { Close as CloseIcon, Newspaper, TrendingUp, TrendingDown, Info } from '@mui/icons-material';

const NewsAlert = ({ news, autoHideDuration = 8000 }) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (news) {
      setOpen(true);
    }
  }, [news]);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  if (!news) return null;

  const getSeverity = () => {
    if (news.sentiment === 'POSITIVE') return 'success';
    if (news.sentiment === 'NEGATIVE') return 'error';
    return 'info';
  };

  const getIcon = () => {
    if (news.sentiment === 'POSITIVE') return <TrendingUp />;
    if (news.sentiment === 'NEGATIVE') return <TrendingDown />;
    return <Info />;
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      TransitionComponent={Slide}
      sx={{ mt: 7 }}
    >
      <Alert
        severity={getSeverity()}
        icon={getIcon()}
        action={
          <IconButton aria-label="close" color="inherit" size="small" onClick={handleClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        }
        sx={{
          width: '100%',
          minWidth: 400,
          boxShadow: 3
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Newspaper fontSize="small" />
            <Typography variant="subtitle2" fontWeight="bold">
              Nouvelle Actualité
            </Typography>
            <Chip label={news.category} size="small" />
          </Box>
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            {news.title}
          </Typography>
          {news.summary && (
            <Typography variant="caption" color="text.secondary">
              {news.summary.substring(0, 150)}...
            </Typography>
          )}
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <Chip label={news.sentiment} size="small" color={getSeverity()} variant="outlined" />
            <Chip label={`Impact: ${news.impact_level}`} size="small" variant="outlined" />
          </Box>
        </Box>
      </Alert>
    </Snackbar>
  );
};

export default NewsAlert;

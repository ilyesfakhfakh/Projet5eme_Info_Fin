import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Chip,
  Paper,
  Divider,
  List,
  ListItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Button,
  Badge
} from '@mui/material';
import {
  Article,
  Close,
  Info,
  Notifications,
  TrendingDown,
  TrendingUp,
  Visibility
} from '@mui/icons-material';
import { useNewsUpdates } from '../../../hooks/useSocket';
import RealTimeIndicator from '../../../components/RealTimeIndicator';
import NewsAlert from '../../../components/NewsAlert';

const RealTimeNews = () => {
  const { news, latestNews, isConnected } = useNewsUpdates();
  const [updateCount, setUpdateCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filterSentiment, setFilterSentiment] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    if (latestNews) {
      setUpdateCount((prev) => prev + 1);
      setUnreadCount((prev) => prev + 1);
    }
  }, [latestNews]);

  const filteredNews = useMemo(() => {
    return (news || []).filter((article) => {
      if (filterSentiment && article.sentiment !== filterSentiment) return false;
      if (filterCategory && article.category !== filterCategory) return false;
      return true;
    });
  }, [news, filterCategory, filterSentiment]);

  const newsStats = useMemo(() => {
    const all = news || [];
    return {
      total: all.length,
      positive: all.filter((n) => n.sentiment === 'POSITIVE').length,
      negative: all.filter((n) => n.sentiment === 'NEGATIVE').length,
      neutral: all.filter((n) => n.sentiment === 'NEUTRAL').length,
      highImpact: all.filter((n) => n.impact_level === 'HIGH').length
    };
  }, [news]);

  const getSentimentIcon = (sentiment) => {
    if (sentiment === 'POSITIVE') return <TrendingUp fontSize="small" />;
    if (sentiment === 'NEGATIVE') return <TrendingDown fontSize="small" />;
    return <Info fontSize="small" />;
  };

  const getSentimentColor = (sentiment) => {
    if (sentiment === 'POSITIVE') return 'success';
    if (sentiment === 'NEGATIVE') return 'error';
    return 'default';
  };

  const getCategoryColor = (category) => {
    const colors = {
      MARKET: 'primary',
      COMPANY: 'secondary',
      ECONOMIC: 'warning',
      POLITICAL: 'error'
    };
    return colors[category] || 'default';
  };

  const resetUnread = () => {
    setUnreadCount(0);
  };

  const openArticle = (article) => {
    setSelectedArticle(article);
    setOpenDialog(true);
  };

  const closeArticle = () => {
    setOpenDialog(false);
    setSelectedArticle(null);
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Actualités en Temps Réel</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Badge badgeContent={unreadCount} color="error" onClick={resetUnread}>
            <Notifications color="action" />
          </Badge>
          <RealTimeIndicator isConnected={isConnected} updateCount={updateCount} />
        </Box>
      </Box>

      {!isConnected && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Connexion au serveur temps réel en cours... Les nouvelles ne sont pas mises à jour automatiquement.
        </Alert>
      )}

      <NewsAlert news={latestNews} />

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Statistiques
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip label={`Total: ${newsStats.total}`} size="small" />
          <Chip label={`Positifs: ${newsStats.positive}`} size="small" color="success" variant="outlined" />
          <Chip label={`Neutres: ${newsStats.neutral}`} size="small" variant="outlined" />
          <Chip label={`Négatifs: ${newsStats.negative}`} size="small" color="error" variant="outlined" />
          <Chip label={`Impact élevé: ${newsStats.highImpact}`} size="small" color="warning" variant="outlined" />
        </Box>
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Filtres
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label="Tous"
            onClick={() => {
              setFilterSentiment('');
              setFilterCategory('');
            }}
            color={!filterSentiment && !filterCategory ? 'primary' : 'default'}
            variant={!filterSentiment && !filterCategory ? 'filled' : 'outlined'}
            size="small"
          />
          <Divider orientation="vertical" flexItem />
          <Chip
            icon={<TrendingUp fontSize="small" />}
            label="POSITIVE"
            onClick={() => setFilterSentiment(filterSentiment === 'POSITIVE' ? '' : 'POSITIVE')}
            color={filterSentiment === 'POSITIVE' ? 'success' : 'default'}
            variant={filterSentiment === 'POSITIVE' ? 'filled' : 'outlined'}
            size="small"
          />
          <Chip
            icon={<Info fontSize="small" />}
            label="NEUTRAL"
            onClick={() => setFilterSentiment(filterSentiment === 'NEUTRAL' ? '' : 'NEUTRAL')}
            color={filterSentiment === 'NEUTRAL' ? 'primary' : 'default'}
            variant={filterSentiment === 'NEUTRAL' ? 'filled' : 'outlined'}
            size="small"
          />
          <Chip
            icon={<TrendingDown fontSize="small" />}
            label="NEGATIVE"
            onClick={() => setFilterSentiment(filterSentiment === 'NEGATIVE' ? '' : 'NEGATIVE')}
            color={filterSentiment === 'NEGATIVE' ? 'error' : 'default'}
            variant={filterSentiment === 'NEGATIVE' ? 'filled' : 'outlined'}
            size="small"
          />
          <Divider orientation="vertical" flexItem />
          {['MARKET', 'ECONOMIC', 'POLITICAL', 'COMPANY'].map((cat) => (
            <Chip
              key={cat}
              label={cat}
              onClick={() => setFilterCategory(filterCategory === cat ? '' : cat)}
              color={filterCategory === cat ? getCategoryColor(cat) : 'default'}
              variant={filterCategory === cat ? 'filled' : 'outlined'}
              size="small"
            />
          ))}
        </Box>
      </Paper>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Flux d'Actualités
          </Typography>
          {filteredNews.length === 0 ? (
            <Typography color="textSecondary">{isConnected ? 'En attente de nouvelles...' : 'Chargement des actualités...'}</Typography>
          ) : (
            <List>
              {filteredNews.map((article, idx) => (
                <Box key={article.article_id || idx}>
                  <ListItem
                    sx={{ cursor: 'pointer' }}
                    secondaryAction={
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          openArticle(article);
                        }}
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                    }
                    onClick={() => openArticle(article)}
                  >
                    <Box sx={{ display: 'grid', gap: 0.5, width: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getSentimentIcon(article.sentiment)}
                        <Typography variant="subtitle1" fontWeight="bold">
                          {article.title}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Chip label={article.category} size="small" color={getCategoryColor(article.category)} />
                        <Chip
                          label={article.sentiment}
                          size="small"
                          color={getSentimentColor(article.sentiment)}
                          variant="outlined"
                        />
                        <Chip label={`Impact: ${article.impact_level}`} size="small" variant="outlined" />
                        <Typography variant="caption" color="text.secondary">
                          {article.source} • {article.author}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {article.publish_date ? new Date(article.publish_date).toLocaleString('fr-FR') : ''}
                        </Typography>
                      </Box>
                    </Box>
                  </ListItem>
                  {idx < filteredNews.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      <Dialog open={openDialog} onClose={closeArticle} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Article />
              <Typography variant="h6">Détails de l'Article</Typography>
            </Box>
            <IconButton onClick={closeArticle} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedArticle && (
            <Box sx={{ display: 'grid', gap: 2 }}>
              <Typography variant="h5">{selectedArticle.title}</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip label={selectedArticle.category} size="small" color={getCategoryColor(selectedArticle.category)} />
                <Chip
                  label={selectedArticle.sentiment}
                  size="small"
                  color={getSentimentColor(selectedArticle.sentiment)}
                  variant="outlined"
                />
                <Chip label={`Impact: ${selectedArticle.impact_level}`} size="small" variant="outlined" />
              </Box>
              {selectedArticle.summary && (
                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                  {selectedArticle.summary}
                </Typography>
              )}
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {selectedArticle.content || 'Aucun contenu disponible'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeArticle} variant="contained">
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RealTimeNews;

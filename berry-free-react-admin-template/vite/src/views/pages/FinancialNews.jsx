import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Grid,
  Chip,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Stack,
  Tabs,
  Tab,
  IconButton,
  Link,
  Divider
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  TrendingUp as TrendingIcon,
  Search as SearchIcon,
  OpenInNew as OpenIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import MainCard from 'ui-component/cards/MainCard';
import http from 'api/http';

const FinancialNews = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [news, setNews] = useState([]);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Filters
  const [category, setCategory] = useState('all');
  const [selectedSource, setSelectedSource] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [symbolSearch, setSymbolSearch] = useState('');
  const [limit, setLimit] = useState(20);

  // Load all news on mount
  useEffect(() => {
    loadAllNews();
    loadSources();
  }, []);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const loadAllNews = async () => {
    try {
      setLoading(true);
      clearMessages();
      const data = await http.get(`/rss/news?limit=${limit}&category=${category}`);
      setNews(data.data || []);
      setSuccess(`${data.count} actualités chargées`);
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const loadNewsByCategory = async (cat) => {
    try {
      setLoading(true);
      clearMessages();
      const data = await http.get(`/rss/news/category/${cat}?limit=${limit}`);
      setNews(data.data || []);
      setSuccess(`${data.count} actualités ${cat}`);
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const loadNewsBySource = async (source) => {
    try {
      setLoading(true);
      clearMessages();
      const data = await http.get(`/rss/news/source/${source}?limit=${limit}`);
      setNews(data.data || []);
      setSuccess(`${data.count} actualités de ${source}`);
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const loadTrending = async () => {
    try {
      setLoading(true);
      clearMessages();
      const data = await http.get('/rss/news/trending?limit=15');
      setNews(data.data || []);
      setSuccess('Actualités tendance chargées');
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchKeyword || searchKeyword.trim().length < 2) {
      setError('Veuillez entrer au moins 2 caractères');
      return;
    }
    try {
      setLoading(true);
      clearMessages();
      const data = await http.get(`/rss/news/search/${searchKeyword}?limit=${limit}`);
      setNews(data.data || []);
      setSuccess(`${data.count} résultat(s) pour "${searchKeyword}"`);
    } catch (err) {
      setError(err.message || 'Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  const handleSymbolSearch = async () => {
    if (!symbolSearch || symbolSearch.trim().length < 1) {
      setError('Veuillez entrer un symbole');
      return;
    }
    try {
      setLoading(true);
      clearMessages();
      const data = await http.get(`/rss/news/symbol/${symbolSearch}?limit=${limit}`);
      setNews(data.data || []);
      setSuccess(`${data.count} actualité(s) pour ${symbolSearch.toUpperCase()}`);
    } catch (err) {
      setError(err.message || 'Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  const loadSources = async () => {
    try {
      const data = await http.get('/rss/sources');
      setSources(data.data || []);
    } catch (err) {
      console.error('Error loading sources:', err);
    }
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);
      clearMessages();
      await http.post('/rss/refresh');
      await loadAllNews();
      setSuccess('Flux RSS rafraîchis avec succès');
    } catch (err) {
      setError(err.message || 'Erreur lors du rafraîchissement');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR');
  };

  const getCategoryColor = (cat) => {
    const colors = {
      crypto: 'warning',
      stocks: 'primary',
      forex: 'success',
      commodities: 'secondary',
      markets: 'info',
      economy: 'error'
    };
    return colors[cat] || 'default';
  };

  const renderNewsCard = (item) => (
    <Grid item xs={12} sm={6} md={4} key={item.id}>
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', '&:hover': { boxShadow: 4 } }}>
        {item.image && (
          <CardMedia
            component="img"
            height="160"
            image={item.image}
            alt={item.title}
            sx={{ objectFit: 'cover' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        )}
        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
            <Chip label={item.category} color={getCategoryColor(item.category)} size="small" />
            <Chip label={item.source} variant="outlined" size="small" />
          </Stack>
          
          <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem', fontWeight: 600, lineHeight: 1.3 }}>
            {item.title}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
            {item.description}
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <TimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {formatDate(item.pubDate)}
              </Typography>
            </Stack>
            <IconButton 
              size="small" 
              component={Link} 
              href={item.link} 
              target="_blank" 
              rel="noopener noreferrer"
              color="primary"
            >
              <OpenIcon fontSize="small" />
            </IconButton>
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );

  const renderFilters = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Catégorie</InputLabel>
              <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                <MenuItem value="all">Toutes</MenuItem>
                <MenuItem value="stocks">Actions</MenuItem>
                <MenuItem value="forex">Forex</MenuItem>
                <MenuItem value="crypto">Crypto</MenuItem>
                <MenuItem value="commodities">Matières Premières</MenuItem>
                <MenuItem value="markets">Marchés</MenuItem>
                <MenuItem value="economy">Économie</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Source</InputLabel>
              <Select value={selectedSource} onChange={(e) => setSelectedSource(e.target.value)}>
                <MenuItem value="">Toutes les sources</MenuItem>
                {sources.map(src => (
                  <MenuItem key={src.key} value={src.key}>{src.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Limite"
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value))}
              inputProps={{ min: 5, max: 100 }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Stack direction="row" spacing={1}>
              <Button 
                variant="contained" 
                onClick={selectedSource ? () => loadNewsBySource(selectedSource) : loadAllNews}
                disabled={loading}
                fullWidth
              >
                Charger
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<TrendingIcon />}
                onClick={loadTrending}
                disabled={loading}
              >
                Trending
              </Button>
              <IconButton onClick={handleRefresh} disabled={loading} color="primary">
                <RefreshIcon />
              </IconButton>
            </Stack>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderSearchTab = () => (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>Recherche par Mot-Clé</Typography>
              <TextField
                fullWidth
                label="Mot-clé"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Bitcoin, Fed, inflation..."
                sx={{ mb: 2 }}
              />
              <Button 
                fullWidth 
                variant="contained" 
                startIcon={<SearchIcon />}
                onClick={handleSearch}
                disabled={loading}
              >
                Rechercher
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>Recherche par Symbole</Typography>
              <TextField
                fullWidth
                label="Symbole/Ticker"
                value={symbolSearch}
                onChange={(e) => setSymbolSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSymbolSearch()}
                placeholder="AAPL, BTC, EUR..."
                sx={{ mb: 2 }}
              />
              <Button 
                fullWidth 
                variant="contained" 
                startIcon={<SearchIcon />}
                onClick={handleSymbolSearch}
                disabled={loading}
              >
                Rechercher
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <MainCard title="Actualités Financières">
      <Box sx={{ width: '100%' }}>
        {/* Messages */}
        {error && (
          <Alert severity="error" onClose={clearMessages} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" onClose={clearMessages} sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
          <Tab label="Actualités" />
          <Tab label="Recherche" />
        </Tabs>

        {/* Tab Content */}
        {activeTab === 0 && (
          <Box>
            {renderFilters()}
            
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                <CircularProgress />
              </Box>
            )}

            {!loading && news.length === 0 && (
              <Alert severity="info">Aucune actualité disponible. Cliquez sur "Charger" pour récupérer les news.</Alert>
            )}

            {!loading && news.length > 0 && (
              <Grid container spacing={3}>
                {news.map(item => renderNewsCard(item))}
              </Grid>
            )}
          </Box>
        )}

        {activeTab === 1 && renderSearchTab()}
      </Box>
    </MainCard>
  );
};

export default FinancialNews;

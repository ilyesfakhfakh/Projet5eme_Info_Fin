import { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardMedia,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Alert,
  Fade,
  Zoom,
  IconButton,
  Avatar,
  Stack,
  Tooltip,
  Tabs,
  Tab
} from '@mui/material';
import { 
  Newspaper,
  AccessTime,
  OpenInNew,
  Refresh,
  TrendingUp,
  FiberManualRecord,
  ShowChart,
  CandlestickChart,
  AttachMoney
} from '@mui/icons-material';

// API imports
import http from '../../api/http';
import MainCard from '../../ui-component/cards/MainCard';

// ===========================|| COMPREHENSIVE DASHBOARD ||=========================== //

const ComprehensiveDashboard = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState(0);
  
  // Financial News state
  const [news, setNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(false);
  
  // Section specific news
  const [tradingNews, setTradingNews] = useState([]);
  const [stocksNews, setStocksNews] = useState([]);
  const [currenciesNews, setCurrenciesNews] = useState([]);

  useEffect(() => {
    loadTrendingNews();
  }, []);
  
  useEffect(() => {
    // Load section-specific news when tab changes
    if (activeTab === 1) loadTradingNews();
    else if (activeTab === 2) loadStocksNews();
    else if (activeTab === 3) loadCurrenciesNews();
  }, [activeTab]);

  const loadTrendingNews = async () => {
    try {
      setNewsLoading(true);
      const data = await http.get('/rss/news/trending?limit=10');
      setNews(data.data || []);
    } catch (err) {
      console.error('Error loading news:', err);
    } finally {
      setNewsLoading(false);
    }
  };

  const loadTradingNews = async () => {
    if (tradingNews.length > 0) return; // Already loaded
    try {
      setNewsLoading(true);
      const data = await http.get('/rss/news/sections/trading?limit=15');
      setTradingNews(data.data || []);
    } catch (err) {
      console.error('Error loading trading news:', err);
    } finally {
      setNewsLoading(false);
    }
  };

  const loadStocksNews = async () => {
    if (stocksNews.length > 0) return; // Already loaded
    try {
      setNewsLoading(true);
      const data = await http.get('/rss/news/sections/stocks?limit=15');
      setStocksNews(data.data || []);
    } catch (err) {
      console.error('Error loading stocks news:', err);
    } finally {
      setNewsLoading(false);
    }
  };

  const loadCurrenciesNews = async () => {
    if (currenciesNews.length > 0) return; // Already loaded
    try {
      setNewsLoading(true);
      const data = await http.get('/rss/news/sections/currencies?limit=15');
      setCurrenciesNews(data.data || []);
    } catch (err) {
      console.error('Error loading currencies news:', err);
    } finally {
      setNewsLoading(false);
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

  const getCategoryGradient = (cat) => {
    const gradients = {
      crypto: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      stocks: 'linear-gradient(135deg, #667eea 0%, #4facfe 100%)',
      forex: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
      commodities: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      markets: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      economy: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    };
    return gradients[cat] || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  };

  const getCategoryIcon = (cat) => {
    return <FiberManualRecord sx={{ fontSize: 10 }} />;
  };

  // Get current news based on active tab
  const getCurrentNews = () => {
    switch(activeTab) {
      case 0: return news;
      case 1: return tradingNews;
      case 2: return stocksNews;
      case 3: return currenciesNews;
      default: return news;
    }
  };

  const handleRefresh = () => {
    switch(activeTab) {
      case 0: 
        setNews([]);
        loadTrendingNews();
        break;
      case 1:
        setTradingNews([]);
        loadTradingNews();
        break;
      case 2:
        setStocksNews([]);
        loadStocksNews();
        break;
      case 3:
        setCurrenciesNews([]);
        loadCurrenciesNews();
        break;
    }
  };

  const currentNews = getCurrentNews();

  return (
    <MainCard 
      title={
        <Stack direction="row" spacing={1} alignItems="center">
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'pulse 3s infinite'
            }}
          >
            <Newspaper sx={{ color: 'white', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h3" component="div">
              Financial News
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Multi-Section Dashboard 🔥
            </Typography>
          </Box>
        </Stack>
      }
    >
      {/* Tabs Navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab 
            icon={<TrendingUp />} 
            iconPosition="start" 
            label="Trending" 
            sx={{ fontWeight: 600 }}
          />
          <Tab 
            icon={<CandlestickChart />} 
            iconPosition="start" 
            label="Trading" 
            sx={{ fontWeight: 600 }}
          />
          <Tab 
            icon={<ShowChart />} 
            iconPosition="start" 
            label="Stocks" 
            sx={{ fontWeight: 600 }}
          />
          <Tab 
            icon={<AttachMoney />} 
            iconPosition="start" 
            label="Currencies" 
            sx={{ fontWeight: 600 }}
          />
        </Tabs>
      </Box>

      <Box display="flex" justifyContent="flex-end" mb={3}>
        <Chip 
          icon={<Refresh sx={{ animation: newsLoading ? 'spin 1s linear infinite' : 'none' }} />}
          label={newsLoading ? "Loading..." : "Refresh"} 
          onClick={handleRefresh}
          disabled={newsLoading}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontWeight: 600,
            px: 2,
            '&:hover': {
              background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
              transform: 'scale(1.05)',
            },
            transition: 'all 0.3s',
            '& .MuiChip-icon': { color: 'white' }
          }}
          clickable
        />
      </Box>
      
      {newsLoading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {currentNews.map((item, index) => (
            <Zoom in={true} style={{ transitionDelay: `${index * 50}ms` }} key={item.id}>
              <Grid item xs={12} sm={6} md={4}>
                <Card 
                  sx={{ 
                    height: '100%',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease-in-out',
                    cursor: 'pointer',
                    '&:hover': { 
                      transform: 'translateY(-8px) scale(1.02)',
                      boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                    },
                    '&:before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      background: getCategoryGradient(item.category),
                    }
                  }}
                >
                  {/* Badge "New" animé */}
                  {index < 3 && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        zIndex: 1,
                        animation: 'pulse 2s infinite'
                      }}
                    >
                      <Chip
                        icon={<TrendingUp />}
                        label="HOT"
                        size="small"
                        sx={{
                          background: getCategoryGradient(item.category),
                          color: 'white',
                          fontWeight: 'bold',
                          '& .MuiChip-icon': { color: 'white' }
                        }}
                      />
                    </Box>
                  )}

                  <Box sx={{ p: 2.5 }}>
                    {/* Header avec avatar et chips */}
                    <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                      <Avatar 
                        sx={{ 
                          width: 32, 
                          height: 32, 
                          background: getCategoryGradient(item.category),
                          fontSize: '0.875rem',
                          fontWeight: 'bold'
                        }}
                      >
                        {item.category.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box flex={1}>
                        <Chip 
                          label={item.category} 
                          size="small" 
                          icon={getCategoryIcon(item.category)}
                          sx={{
                            background: getCategoryGradient(item.category),
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            '& .MuiChip-icon': { color: 'white' }
                          }}
                        />
                      </Box>
                    </Stack>

                    {/* Source badge */}
                    <Box mb={1.5}>
                      <Chip 
                        label={item.source} 
                        size="small" 
                        variant="outlined"
                        sx={{
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          height: '20px',
                          borderColor: 'divider'
                        }}
                      />
                    </Box>
                    
                    {/* Titre avec animation */}
                    <Typography 
                      variant="h5" 
                      gutterBottom 
                      sx={{ 
                        fontSize: '1rem', 
                        fontWeight: 700,
                        lineHeight: 1.4,
                        mb: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        minHeight: '2.8rem',
                        '&:hover': {
                          background: getCategoryGradient(item.category),
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text'
                        }
                      }}
                    >
                      {item.title}
                    </Typography>
                    
                    {/* Description */}
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        mb: 2,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        minHeight: '4rem',
                        lineHeight: 1.6
                      }}
                    >
                      {item.description?.substring(0, 120)}...
                    </Typography>
                    
                    {/* Footer */}
                    <Box 
                      display="flex" 
                      justifyContent="space-between" 
                      alignItems="center"
                      pt={2}
                      borderTop="1px solid"
                      borderColor="divider"
                    >
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary" fontWeight={500}>
                          {formatDate(item.pubDate)}
                        </Typography>
                      </Stack>
                      
                      <Tooltip title="Lire l'article">
                        <IconButton
                          size="small"
                          component="a"
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            background: getCategoryGradient(item.category),
                            color: 'white',
                            width: 32,
                            height: 32,
                            '&:hover': {
                              transform: 'rotate(15deg) scale(1.1)',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                            },
                            transition: 'all 0.2s'
                          }}
                        >
                          <OpenInNew sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </Card>
              </Grid>
            </Zoom>
          ))}
          {currentNews.length === 0 && (
            <Grid item xs={12}>
              <Alert severity="info" icon={<Newspaper />}>
                Aucune actualité disponible pour le moment
              </Alert>
            </Grid>
          )}
        </Grid>
      )}
      
      {/* Keyframes pour animations */}
      <style>
        {`
          @keyframes pulse {
            0%, 100% { 
              transform: scale(1);
              box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.7);
            }
            50% { 
              transform: scale(1.05);
              box-shadow: 0 0 0 10px rgba(102, 126, 234, 0);
            }
          }
          
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </MainCard>
  );
};

export default ComprehensiveDashboard;

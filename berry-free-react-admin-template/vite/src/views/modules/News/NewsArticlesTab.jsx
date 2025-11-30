import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Chip,
  Typography,
  InputAdornment,
  TablePagination,
  TableSortLabel,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  Divider
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Article,
  Search as SearchIcon,
  FileDownload as DownloadIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { newsArticlesApi, assetsApi } from 'api';

const CATEGORIES = ['MARKET', 'COMPANY', 'ECONOMIC', 'POLITICAL'];
const SENTIMENTS = ['POSITIVE', 'NEUTRAL', 'NEGATIVE'];
const IMPACT_LEVELS = ['LOW', 'MEDIUM', 'HIGH'];

export default function NewsArticlesTab() {
  const [articles, setArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  
  // Preview dialog
  const [previewArticle, setPreviewArticle] = useState(null);
  const [openPreview, setOpenPreview] = useState(false);
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Sorting state
  const [orderBy, setOrderBy] = useState('publish_date');
  const [order, setOrder] = useState('desc');
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSentiment, setFilterSentiment] = useState('');
  const [filterImpact, setFilterImpact] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    summary: '',
    author: '',
    source: '',
    publish_date: new Date().toISOString().slice(0, 16),
    category: 'MARKET',
    sentiment: 'NEUTRAL',
    impact_level: 'MEDIUM',
    related_assets: []
  });

  useEffect(() => {
    fetchData();
    fetchAssets();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [articles, searchTerm, filterCategory, filterSentiment, filterImpact, orderBy, order]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await newsArticlesApi.getAll();
      console.log('News Articles Response:', response);
      // L'API retourne {articles: [...], pagination: {...}}
      const articlesData = Array.isArray(response) ? response : (response?.articles || response?.data || []);
      setArticles(articlesData);
      setError(null);
    } catch (err) {
      setError(err.message);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssets = async () => {
    try {
      const response = await assetsApi.getAll();
      const assetsData = Array.isArray(response) ? response : (response?.data || []);
      setAssets(assetsData);
    } catch (err) {
      console.error('Error fetching assets:', err);
      setAssets([]);
    }
  };

  const handleOpenDialog = (article = null) => {
    if (article) {
      setEditingArticle(article);
      setFormData({
        title: article.title || '',
        content: article.content || '',
        summary: article.summary || '',
        author: article.author || '',
        source: article.source || '',
        publish_date: article.publish_date ? new Date(article.publish_date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
        category: article.category || 'MARKET',
        sentiment: article.sentiment || 'NEUTRAL',
        impact_level: article.impact_level || 'MEDIUM',
        related_assets: article.related_assets || []
      });
    } else {
      setEditingArticle(null);
      setFormData({
        title: '',
        content: '',
        summary: '',
        author: '',
        source: '',
        publish_date: new Date().toISOString().slice(0, 16),
        category: 'MARKET',
        sentiment: 'NEUTRAL',
        impact_level: 'MEDIUM',
        related_assets: []
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingArticle(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingArticle) {
        await newsArticlesApi.update(editingArticle.article_id, formData);
      } else {
        await newsArticlesApi.create(formData);
      }
      handleCloseDialog();
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet article?')) {
      try {
        await newsArticlesApi.delete(id);
        fetchData();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'MARKET': 'primary',
      'COMPANY': 'secondary',
      'ECONOMIC': 'warning',
      'POLITICAL': 'error'
    };
    return colors[category] || 'default';
  };

  const getSentimentColor = (sentiment) => {
    const colors = {
      'POSITIVE': 'success',
      'NEUTRAL': 'default',
      'NEGATIVE': 'error'
    };
    return colors[sentiment] || 'default';
  };

  const applyFilters = () => {
    let filtered = [...articles];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(article => {
        const searchLower = searchTerm.toLowerCase();
        return (
          article.title?.toLowerCase().includes(searchLower) ||
          article.content?.toLowerCase().includes(searchLower) ||
          article.author?.toLowerCase().includes(searchLower) ||
          article.source?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Category filter
    if (filterCategory) {
      filtered = filtered.filter(article => article.category === filterCategory);
    }

    // Sentiment filter
    if (filterSentiment) {
      filtered = filtered.filter(article => article.sentiment === filterSentiment);
    }

    // Impact filter
    if (filterImpact) {
      filtered = filtered.filter(article => article.impact_level === filterImpact);
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue = a[orderBy];
      let bValue = b[orderBy];

      if (orderBy === 'publish_date') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (typeof aValue === 'string') {
        aValue = aValue?.toLowerCase() || '';
        bValue = bValue?.toLowerCase() || '';
      }

      if (order === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredArticles(filtered);
    setPage(0);
  };

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handlePreview = (article) => {
    setPreviewArticle(article);
    setOpenPreview(true);
  };

  const handleClosePreview = () => {
    setOpenPreview(false);
    setPreviewArticle(null);
  };

  const handleExportCSV = () => {
    const headers = ['Titre', 'Catégorie', 'Auteur', 'Source', 'Sentiment', 'Impact', 'Date'];
    const csvData = filteredArticles.map(article => [
      `"${article.title?.replace(/"/g, '""') || ''}"`,
      article.category,
      article.author || '',
      article.source || '',
      article.sentiment || 'NEUTRAL',
      article.impact_level || 'MEDIUM',
      new Date(article.publish_date).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `news-articles-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const getStats = () => {
    if (filteredArticles.length === 0) return { total: 0, positive: 0, negative: 0, neutral: 0 };
    
    const positive = filteredArticles.filter(a => a.sentiment === 'POSITIVE').length;
    const negative = filteredArticles.filter(a => a.sentiment === 'NEGATIVE').length;
    const neutral = filteredArticles.filter(a => a.sentiment === 'NEUTRAL').length;
    
    return { total: filteredArticles.length, positive, negative, neutral };
  };

  const stats = getStats();

  const paginatedArticles = filteredArticles.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Total Articles
              </Typography>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Positifs
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.positive}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Négatifs
              </Typography>
              <Typography variant="h4" color="error.main">
                {stats.negative}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Neutres
              </Typography>
              <Typography variant="h4">
                {stats.neutral}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters and Actions */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Rechercher articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Catégorie</InputLabel>
              <Select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                label="Catégorie"
              >
                <MenuItem value="">Toutes</MenuItem>
                {CATEGORIES.map((cat) => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Sentiment</InputLabel>
              <Select
                value={filterSentiment}
                onChange={(e) => setFilterSentiment(e.target.value)}
                label="Sentiment"
              >
                <MenuItem value="">Tous</MenuItem>
                {SENTIMENTS.map((sent) => (
                  <MenuItem key={sent} value={sent}>{sent}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Impact</InputLabel>
              <Select
                value={filterImpact}
                onChange={(e) => setFilterImpact(e.target.value)}
                label="Impact"
              >
                <MenuItem value="">Tous</MenuItem>
                {IMPACT_LEVELS.map((level) => (
                  <MenuItem key={level} value={level}>{level}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button
                size="small"
                startIcon={<RefreshIcon />}
                onClick={fetchData}
              >
                Actualiser
              </Button>
              <Button
                size="small"
                startIcon={<DownloadIcon />}
                onClick={handleExportCSV}
                disabled={filteredArticles.length === 0}
              >
                Export CSV
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Nouveau
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'title'}
                  direction={orderBy === 'title' ? order : 'asc'}
                  onClick={() => handleSort('title')}
                >
                  <strong>Titre</strong>
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'category'}
                  direction={orderBy === 'category' ? order : 'asc'}
                  onClick={() => handleSort('category')}
                >
                  <strong>Catégorie</strong>
                </TableSortLabel>
              </TableCell>
              <TableCell><strong>Auteur</strong></TableCell>
              <TableCell><strong>Source</strong></TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'sentiment'}
                  direction={orderBy === 'sentiment' ? order : 'asc'}
                  onClick={() => handleSort('sentiment')}
                >
                  <strong>Sentiment</strong>
                </TableSortLabel>
              </TableCell>
              <TableCell><strong>Impact</strong></TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'publish_date'}
                  direction={orderBy === 'publish_date' ? order : 'asc'}
                  onClick={() => handleSort('publish_date')}
                >
                  <strong>Date</strong>
                </TableSortLabel>
              </TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">Chargement...</TableCell>
              </TableRow>
            ) : filteredArticles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">Aucun article trouvé</TableCell>
              </TableRow>
            ) : (
              paginatedArticles.map((article) => (
                <TableRow key={article.article_id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Article fontSize="small" color="action" />
                      <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                        {article.title}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={article.category}
                      size="small"
                      color={getCategoryColor(article.category)}
                    />
                  </TableCell>
                  <TableCell>{article.author || '-'}</TableCell>
                  <TableCell>{article.source || '-'}</TableCell>
                  <TableCell>
                    <Chip 
                      label={article.sentiment || 'NEUTRAL'}
                      size="small"
                      color={getSentimentColor(article.sentiment)}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={article.impact_level || 'MEDIUM'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {article.publish_date ? new Date(article.publish_date).toLocaleDateString() : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handlePreview(article)}
                      color="info"
                      title="Aperçu"
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(article)}
                      color="primary"
                      title="Modifier"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(article.article_id)}
                      color="error"
                      title="Supprimer"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={filteredArticles.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
        labelRowsPerPage="Lignes par page:"
      />

      {/* Preview Dialog */}
      <Dialog open={openPreview} onClose={handleClosePreview} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Aperçu de l'Article</Typography>
            <IconButton onClick={handleClosePreview} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {previewArticle && (
            <Box sx={{ display: 'grid', gap: 2 }}>
              <Box>
                <Typography variant="h5" gutterBottom>
                  {previewArticle.title}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  <Chip 
                    label={previewArticle.category}
                    size="small"
                    color={getCategoryColor(previewArticle.category)}
                  />
                  <Chip 
                    label={previewArticle.sentiment || 'NEUTRAL'}
                    size="small"
                    color={getSentimentColor(previewArticle.sentiment)}
                    variant="outlined"
                  />
                  <Chip 
                    label={`Impact: ${previewArticle.impact_level || 'MEDIUM'}`}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </Box>
              
              <Divider />
              
              <Box>
                <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
                  Auteur: {previewArticle.author || 'N/A'} | Source: {previewArticle.source || 'N/A'}
                </Typography>
                <Typography variant="caption" color="textSecondary" display="block">
                  Publié le: {previewArticle.publish_date ? new Date(previewArticle.publish_date).toLocaleDateString('fr-FR', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  }) : 'N/A'}
                </Typography>
              </Box>
              
              {previewArticle.summary && (
                <Box>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Résumé
                  </Typography>
                  <Typography variant="body2" paragraph sx={{ fontStyle: 'italic', backgroundColor: 'action.hover', p: 2, borderRadius: 1 }}>
                    {previewArticle.summary}
                  </Typography>
                </Box>
              )}
              
              <Box>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Contenu
                </Typography>
                <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-wrap' }}>
                  {previewArticle.content || 'Aucun contenu disponible'}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            handleClosePreview();
            handleOpenDialog(previewArticle);
          }} startIcon={<EditIcon />}>
            Modifier
          </Button>
          <Button onClick={handleClosePreview} variant="contained">
            Fermer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Form */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingArticle ? 'Modifier Article' : 'Nouvel Article'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
            <TextField
              label="Titre"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Résumé"
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              multiline
              rows={2}
              fullWidth
            />
            <TextField
              label="Contenu"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
              multiline
              rows={4}
              fullWidth
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Auteur"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                fullWidth
              />
              <TextField
                label="Source"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                fullWidth
              />
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
              <TextField
                select
                label="Catégorie"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
                fullWidth
              >
                {CATEGORIES.map((cat) => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Sentiment"
                value={formData.sentiment}
                onChange={(e) => setFormData({ ...formData, sentiment: e.target.value })}
                fullWidth
              >
                {SENTIMENTS.map((sent) => (
                  <MenuItem key={sent} value={sent}>{sent}</MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Impact"
                value={formData.impact_level}
                onChange={(e) => setFormData({ ...formData, impact_level: e.target.value })}
                fullWidth
              >
                {IMPACT_LEVELS.map((level) => (
                  <MenuItem key={level} value={level}>{level}</MenuItem>
                ))}
              </TextField>
            </Box>
            <TextField
              label="Date de Publication"
              type="datetime-local"
              value={formData.publish_date}
              onChange={(e) => setFormData({ ...formData, publish_date: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingArticle ? 'Modifier' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

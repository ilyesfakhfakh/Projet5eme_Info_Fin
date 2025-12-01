import { useEffect, useState } from 'react';
import {
  listPortfolios,
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
  createPosition,
  getPortfolioPositions,
  updatePosition,
  archivePosition,
  deletePosition,
  getPositionPerformance
} from 'api/portfolios';
import { useAuth } from 'contexts/auth';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Archive as ArchiveIcon,
  TrendingUp as PerformanceIcon
} from '@mui/icons-material';

export default function PortfolioPage() {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [positions, setPositions] = useState([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);

  // Portfolio dialogs
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ portfolio_name: '', base_currency: 'EUR', initial_balance: 100000 });

  // Position dialogs and forms
  const [openCreatePosition, setOpenCreatePosition] = useState(false);
  const [openEditPosition, setOpenEditPosition] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [positionForm, setPositionForm] = useState({
    asset_symbol: '',
    asset_type: 'STOCK',
    quantity: '',
    average_price: '',
    current_price: '',
    currency: 'EUR'
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const currencies = ['EUR', 'USD', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD'];

  async function fetchData() {
    setLoading(true);
    setError('');
    try {
      const res = await listPortfolios({ user_id: user?.user_id });
      if (Array.isArray(res)) {
        setRows(res);
      } else if (res && res.data && Array.isArray(res.data)) {
        setRows(res.data);
      } else {
        setRows([]);
      }
    } catch (e) {
      console.error('Error fetching portfolios:', e);
      setError('Erreur lors du chargement des portefeuilles');
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async () => {
    try {
      await createPortfolio({ ...form, user_id: user?.user_id });
      setSuccess('Portefeuille créé avec succès');
      setOpenCreate(false);
      setForm({ portfolio_name: '', base_currency: 'EUR', initial_balance: 100000 });
      fetchData();
    } catch (e) {
      console.error('Error creating portfolio:', e);
      setError(`Erreur lors de la création: ${e.message}`);
    }
  };

  const handleEdit = async () => {
    try {
      await updatePortfolio(selected.portfolio_id, form);
      setSuccess('Portefeuille mis à jour avec succès');
      setOpenEdit(false);
      setSelected(null);
      setForm({ portfolio_name: '', base_currency: 'EUR', initial_balance: 100000 });
      fetchData();
    } catch (e) {
      setError('Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async (portfolio) => {
    if (window.confirm(`Supprimer le portefeuille ${portfolio.portfolio_name} ?`)) {
      try {
        await deletePortfolio(portfolio.portfolio_id);
        setSuccess('Portefeuille supprimé avec succès');
        fetchData();
      } catch (e) {
        setError(`Erreur lors de la suppression: ${e.message}`);
      }
    }
  };

  // Position management functions
  const loadPositions = async (portfolioId) => {
    try {
      const result = await getPortfolioPositions(portfolioId);
      if (Array.isArray(result)) {
        setPositions(result);
      } else if (result && result.data && Array.isArray(result.data)) {
        setPositions(result.data);
      } else {
        setPositions([]);
      }
    } catch (e) {
      console.error('Error loading positions:', e);
      setError('Erreur lors du chargement des positions');
    }
  };

  const handleCreatePosition = async () => {
    if (!selectedPortfolio) {
      setError('Veuillez sélectionner un portefeuille');
      return;
    }

    try {
      await createPosition(selectedPortfolio.portfolio_id, positionForm);
      setSuccess('Position créée avec succès');
      setOpenCreatePosition(false);
      setPositionForm({
        asset_symbol: '',
        asset_type: 'STOCK',
        quantity: '',
        average_price: '',
        current_price: '',
        currency: 'EUR'
      });
      loadPositions(selectedPortfolio.portfolio_id);
    } catch (e) {
      setError(`Erreur lors de la création: ${e.message}`);
    }
  };

  const handleUpdatePosition = async () => {
    try {
      await updatePosition(selectedPosition.position_id, positionForm);
      setSuccess('Position mise à jour avec succès');
      setOpenEditPosition(false);
      setSelectedPosition(null);
      setPositionForm({
        asset_symbol: '',
        asset_type: 'STOCK',
        quantity: '',
        average_price: '',
        current_price: '',
        currency: 'EUR'
      });
      loadPositions(selectedPortfolio.portfolio_id);
    } catch (e) {
      setError(`Erreur lors de la mise à jour: ${e.message}`);
    }
  };

  const handleArchivePosition = async (position) => {
    if (window.confirm(`Archiver la position ${position.asset_symbol} ?`)) {
      try {
        await archivePosition(position.position_id);
        setSuccess('Position archivée avec succès');
        loadPositions(selectedPortfolio.portfolio_id);
      } catch (e) {
        setError(`Erreur lors de l'archivage: ${e.message}`);
      }
    }
  };

  const handleDeletePosition = async (position) => {
    if (window.confirm(`Supprimer définitivement la position ${position.asset_symbol} ?`)) {
      try {
        await deletePosition(position.position_id);
        setSuccess('Position supprimée avec succès');
        loadPositions(selectedPortfolio.portfolio_id);
      } catch (e) {
        setError(`Erreur lors de la suppression: ${e.message}`);
      }
    }
  };

  const openEditPositionDialog = (position) => {
    setSelectedPosition(position);
    setPositionForm({
      asset_symbol: position.asset_symbol,
      asset_type: position.asset_type,
      quantity: position.quantity,
      average_price: position.average_price,
      current_price: position.current_price || position.average_price,
      currency: position.currency
    });
    setOpenEditPosition(true);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    if (newValue === 1 && selectedPortfolio) {
      loadPositions(selectedPortfolio.portfolio_id);
    }
  };

  const handlePortfolioSelect = (portfolio) => {
    setSelectedPortfolio(portfolio);
    setTabValue(1); // Switch to positions tab
    loadPositions(portfolio.portfolio_id);
  };

  const openEditDialog = (portfolio) => {
    setSelected(portfolio);
    setForm({
      portfolio_name: portfolio.portfolio_name,
      base_currency: portfolio.base_currency,
      initial_balance: portfolio.initial_balance || 100000
    });
    setOpenEdit(true);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Gestion des Portefeuilles
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="portfolio tabs">
          <Tab label="Portefeuilles" />
          <Tab label="Positions" disabled={!selectedPortfolio} />
        </Tabs>
      </Box>

      {/* Portfolios Tab */}
      {tabValue === 0 && (
        <>
          <Stack sx={{ mb: 2, alignItems: 'center', justifyContent: 'space-between' }} direction="row">
            <Typography variant="h6">Gestion des Portefeuilles</Typography>
            <Stack direction="row" sx={{ gap: 1 }}>
              <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchData}>
                Actualiser
              </Button>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenCreate(true)}>
                Nouveau Portefeuille
              </Button>
            </Stack>
          </Stack>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
              {success}
            </Alert>
          )}

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nom</TableCell>
                  <TableCell>Devise de Base</TableCell>
                  <TableCell align="right">Solde Initial</TableCell>
                  <TableCell align="right">Solde Actuel</TableCell>
                  <TableCell align="right">Valeur Totale</TableCell>
                  <TableCell align="right">P&L</TableCell>
                  <TableCell align="right">Perf. %</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                )}
                {!loading && rows.map((row) => (
                  <TableRow key={row.portfolio_id} hover>
                    <TableCell>{row.portfolio_name}</TableCell>
                    <TableCell>{row.base_currency}</TableCell>
                    <TableCell align="right">{parseFloat(row.initial_balance || 0).toLocaleString()} {row.base_currency}</TableCell>
                    <TableCell align="right">{parseFloat(row.current_balance || 0).toLocaleString()} {row.base_currency}</TableCell>
                    <TableCell align="right">{parseFloat(row.total_value || 0).toLocaleString()} {row.base_currency}</TableCell>
                    <TableCell align="right">
                      <Typography color={parseFloat(row.profit_loss || 0) >= 0 ? 'success.main' : 'error.main'}>
                        {parseFloat(row.profit_loss || 0).toLocaleString()} {row.base_currency}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography color={parseFloat(row.profit_loss_percentage || 0) >= 0 ? 'success.main' : 'error.main'}>
                        {parseFloat(row.profit_loss_percentage || 0).toFixed(2)}%
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handlePortfolioSelect(row)}
                        sx={{ mr: 1 }}
                      >
                        Gérer Positions
                      </Button>
                      <IconButton size="small" onClick={() => openEditDialog(row)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(row)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography variant="body2" color="text.secondary">
                        Aucun portefeuille trouvé
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Positions Tab */}
      {tabValue === 1 && selectedPortfolio && (
        <>
          <Stack sx={{ mb: 2, alignItems: 'center', justifyContent: 'space-between' }} direction="row">
            <Typography variant="h6">
              Positions - {selectedPortfolio.portfolio_name}
            </Typography>
            <Stack direction="row" sx={{ gap: 1 }}>
              <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => loadPositions(selectedPortfolio.portfolio_id)}>
                Actualiser
              </Button>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenCreatePosition(true)}>
                Nouvelle Position
              </Button>
            </Stack>
          </Stack>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
              {success}
            </Alert>
          )}

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Symbole</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Quantité</TableCell>
                  <TableCell align="right">Prix Moyen</TableCell>
                  <TableCell align="right">Prix Actuel</TableCell>
                  <TableCell align="right">Valeur Marchande</TableCell>
                  <TableCell align="right">P&L</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                )}
                {!loading && positions.map((position) => (
                  <TableRow key={position.position_id} hover>
                    <TableCell>{position.asset_symbol}</TableCell>
                    <TableCell>
                      <Chip
                        label={position.asset_type}
                        size="small"
                        color={position.asset_type === 'STOCK' ? 'primary' : 'secondary'}
                      />
                    </TableCell>
                    <TableCell align="right">{parseFloat(position.quantity).toLocaleString()}</TableCell>
                    <TableCell align="right">{parseFloat(position.average_price).toFixed(2)} {position.currency}</TableCell>
                    <TableCell align="right">{parseFloat(position.current_price || position.average_price).toFixed(2)} {position.currency}</TableCell>
                    <TableCell align="right">{parseFloat(position.market_value).toFixed(2)} {position.currency}</TableCell>
                    <TableCell align="right">
                      <Typography
                        color={position.unrealized_pl >= 0 ? 'success.main' : 'error.main'}
                      >
                        {parseFloat(position.unrealized_pl).toFixed(2)} {position.currency}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => openEditPositionDialog(position)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleArchivePosition(position)} color="warning">
                        <ArchiveIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeletePosition(position)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && positions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography variant="body2" color="text.secondary">
                        Aucune position trouvée dans ce portefeuille
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Create Dialog */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nouveau Portefeuille</DialogTitle>
        <DialogContent>
          <Stack sx={{ mt: 1, gap: 2 }}>
            <TextField
              label="Nom du Portefeuille"
              value={form.portfolio_name}
              onChange={(e) => setForm({ ...form, portfolio_name: e.target.value })}
              fullWidth
              required
            />
            <FormControl fullWidth>
              <InputLabel>Devise de Base</InputLabel>
              <Select
                value={form.base_currency}
                onChange={(e) => setForm({ ...form, base_currency: e.target.value })}
              >
                {currencies.map((currency) => (
                  <MenuItem key={currency} value={currency}>
                    {currency}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Solde Initial"
              type="number"
              value={form.initial_balance}
              onChange={(e) => setForm({ ...form, initial_balance: parseFloat(e.target.value) || 0 })}
              fullWidth
              required
              helperText="Capital de départ du portefeuille"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleCreate}>Créer</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Modifier le Portefeuille</DialogTitle>
        <DialogContent>
          <Stack sx={{ mt: 1, gap: 2 }}>
            <TextField
              label="Nom du Portefeuille"
              value={form.portfolio_name}
              onChange={(e) => setForm({ ...form, portfolio_name: e.target.value })}
              fullWidth
              required
            />
            <FormControl fullWidth>
              <InputLabel>Devise de Base</InputLabel>
              <Select
                value={form.base_currency}
                onChange={(e) => setForm({ ...form, base_currency: e.target.value })}
              >
                {currencies.map((currency) => (
                  <MenuItem key={currency} value={currency}>
                    {currency}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Solde Initial"
              type="number"
              value={form.initial_balance}
              onChange={(e) => setForm({ ...form, initial_balance: parseFloat(e.target.value) || 0 })}
              fullWidth
              required
              helperText="Capital de départ du portefeuille"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleEdit}>Mettre à Jour</Button>
        </DialogActions>
      </Dialog>

      {/* Create Position Dialog */}
      <Dialog open={openCreatePosition} onClose={() => setOpenCreatePosition(false)} maxWidth="md" fullWidth>
        <DialogTitle>Nouvelle Position</DialogTitle>
        <DialogContent>
          <Stack sx={{ mt: 1, gap: 2 }}>
            <TextField
              label="Symbole de l'Actif"
              value={positionForm.asset_symbol}
              onChange={(e) => setPositionForm({ ...positionForm, asset_symbol: e.target.value.toUpperCase() })}
              fullWidth
              required
              placeholder="AAPL, TSLA, EUR, etc."
            />
            <FormControl fullWidth>
              <InputLabel>Type d'Actif</InputLabel>
              <Select
                value={positionForm.asset_type}
                onChange={(e) => setPositionForm({ ...positionForm, asset_type: e.target.value })}
              >
                <MenuItem value="STOCK">Action</MenuItem>
                <MenuItem value="BOND">Obligation</MenuItem>
                <MenuItem value="ETF">ETF</MenuItem>
                <MenuItem value="CASH">Liquidités</MenuItem>
                <MenuItem value="CRYPTO">Cryptomonnaie</MenuItem>
              </Select>
            </FormControl>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Quantité"
                type="number"
                value={positionForm.quantity}
                onChange={(e) => setPositionForm({ ...positionForm, quantity: e.target.value })}
                fullWidth
                required
              />
              <FormControl fullWidth>
                <InputLabel>Devise</InputLabel>
                <Select
                  value={positionForm.currency}
                  onChange={(e) => setPositionForm({ ...positionForm, currency: e.target.value })}
                >
                  {currencies.map((currency) => (
                    <MenuItem key={currency} value={currency}>
                      {currency}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Prix Moyen d'Achat"
                type="number"
                step="0.01"
                value={positionForm.average_price}
                onChange={(e) => setPositionForm({ ...positionForm, average_price: e.target.value })}
                fullWidth
                required
              />
              <TextField
                label="Prix Actuel (optionnel)"
                type="number"
                step="0.01"
                value={positionForm.current_price}
                onChange={(e) => setPositionForm({ ...positionForm, current_price: e.target.value })}
                fullWidth
                helperText="Laissez vide pour utiliser le prix moyen"
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreatePosition(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleCreatePosition}>Créer la Position</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Position Dialog */}
      <Dialog open={openEditPosition} onClose={() => setOpenEditPosition(false)} maxWidth="md" fullWidth>
        <DialogTitle>Modifier la Position</DialogTitle>
        <DialogContent>
          <Stack sx={{ mt: 1, gap: 2 }}>
            <TextField
              label="Symbole de l'Actif"
              value={positionForm.asset_symbol}
              onChange={(e) => setPositionForm({ ...positionForm, asset_symbol: e.target.value.toUpperCase() })}
              fullWidth
              required
            />
            <FormControl fullWidth>
              <InputLabel>Type d'Actif</InputLabel>
              <Select
                value={positionForm.asset_type}
                onChange={(e) => setPositionForm({ ...positionForm, asset_type: e.target.value })}
              >
                <MenuItem value="STOCK">Action</MenuItem>
                <MenuItem value="BOND">Obligation</MenuItem>
                <MenuItem value="ETF">ETF</MenuItem>
                <MenuItem value="CASH">Liquidités</MenuItem>
                <MenuItem value="CRYPTO">Cryptomonnaie</MenuItem>
              </Select>
            </FormControl>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Quantité"
                type="number"
                value={positionForm.quantity}
                onChange={(e) => setPositionForm({ ...positionForm, quantity: e.target.value })}
                fullWidth
                required
              />
              <FormControl fullWidth>
                <InputLabel>Devise</InputLabel>
                <Select
                  value={positionForm.currency}
                  onChange={(e) => setPositionForm({ ...positionForm, currency: e.target.value })}
                >
                  {currencies.map((currency) => (
                    <MenuItem key={currency} value={currency}>
                      {currency}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Prix Moyen d'Achat"
                type="number"
                step="0.01"
                value={positionForm.average_price}
                onChange={(e) => setPositionForm({ ...positionForm, average_price: e.target.value })}
                fullWidth
                required
              />
              <TextField
                label="Prix Actuel"
                type="number"
                step="0.01"
                value={positionForm.current_price}
                onChange={(e) => setPositionForm({ ...positionForm, current_price: e.target.value })}
                fullWidth
                required
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditPosition(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleUpdatePosition}>Mettre à Jour</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

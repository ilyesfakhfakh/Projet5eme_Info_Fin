import { useEffect, useMemo, useState } from 'react';
import { listUsers, updateUser, deleteUser, exportUsers } from 'api/users';
import { useAuth } from 'contexts/auth';
import { useNavigate } from 'react-router-dom';
import { hasPermission } from 'utils/permissions';

// Fonction utilitaire pour formater les dates
const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    // Vérifier si la date est valide
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch (e) {
    console.error('Erreur de format de date:', e);
    return '-';
  }
};

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Pagination from '@mui/material/Pagination';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';

// URL de base pour les images de profil
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3200';
import Select from '@mui/material/Select';
import Tooltip from '@mui/material/Tooltip';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import {
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Lock as LockIcon,
  LockOpen as UnlockIcon,
  Download as DownloadIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

export default function UsersList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [selected, setSelected] = useState(null);
  const [openView, setOpenView] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editForm, setEditForm] = useState({ username: '', email: '', is_active: false, first_name: '', last_name: '', phone: '' });
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [filters, setFilters] = useState({
    user_type: '',
    is_active: '',
    date_from: '',
    date_to: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const pages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const userTypes = [
    { value: 'NOVICE', label: 'Novice', color: 'default' },
    { value: 'INTERMEDIATE', label: 'Intermédiaire', color: 'primary' },
    { value: 'PROFESSIONAL', label: 'Professionnel', color: 'secondary' },
    { value: 'ADMIN', label: 'Administrateur', color: 'error' }
  ];

  async function fetchData(params = {}) {
    setLoading(true);
    setError('');
    try {
      const queryParams = { q, page, pageSize, ...filters, ...params };
      const res = await listUsers(queryParams);
      if (res && typeof res === 'object') {
        setRows(res.data || []);
        setTotal(res.total || 0);
      } else {
        throw new Error('Format de réponse invalide');
      }
    } catch (e) {
      console.error('Erreur fetchData:', e);
      setError(`Erreur lors du chargement des utilisateurs: ${e.message}`);
      setRows([]);
      setTotal(0);
    }
    setLoading(false);
  }
  const handleExport = async (format = 'csv') => {
    try {
      const response = await exportUsers({ format, ...filters, q });
      const blob = new Blob([response], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users_export_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setSuccess('Export réussi');
    } catch (error) {
      console.error('Export error:', error);
      setError("Erreur lors de l'export");
    }
  };

  const handleMenuClick = (event, user) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  const handleViewProfile = (user) => {
    navigate(`/users/${user.user_id}`);
    handleMenuClose();
  };

  const handleEditUser = (user) => {
    setSelected(user);
    setEditForm({
      username: user.username || '',
      email: user.email || '',
      is_active: !!user.is_active,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      phone: user.phone || '',
      date_of_birth: user.date_of_birth || '',
      user_type: user.user_type || 'NOVICE'
    });
    setOpenEdit(true);
    handleMenuClose();
  };

  const handleToggleStatus = async (user) => {
    try {
      await updateUser(user.user_id, { is_active: !user.is_active });
      setSuccess(`Utilisateur ${user.is_active ? 'désactivé' : 'activé'} avec succès`);
      fetchData();
    } catch (e) {
      setError('Erreur lors de la mise à jour du statut');
    }
    handleMenuClose();
  };

  const handleDeleteUser = async (user) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${user.username} ?`)) {
      try {
        await deleteUser(user.user_id);
        setSuccess('Utilisateur supprimé avec succès');
        fetchData();
      } catch (e) {
        setError('Erreur lors de la suppression');
      }
    }
    handleMenuClose();
  };

  const getUserTypeInfo = (type) => {
    return userTypes.find((t) => t.value === type) || userTypes[0];
  };

  const getUserInitials = (user) => {
    const first = user.first_name ? user.first_name.charAt(0).toUpperCase() : '';
    const last = user.last_name ? user.last_name.charAt(0).toUpperCase() : '';
    return first + last || user.username.charAt(0).toUpperCase();
  };

  const getUserFullName = (user) => {
    return `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username;
  };

  const searchUsers = (query) => {};

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  return (
    <Box>
      {/* Header avec actions */}
      <Stack sx={{ mb: 2, alignItems: 'center', justifyContent: 'space-between' }} direction="row">
        <Typography variant="h4">Gestion des Utilisateurs</Typography>
        <Stack direction="row" sx={{ gap: 1 }}>
          <Button variant="outlined" startIcon={<FilterListIcon />} onClick={() => setShowFilters(!showFilters)}>
            Filtres
          </Button>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => handleExport('csv')}>
            Exporter CSV
          </Button>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => fetchData()}>
            Actualiser
          </Button>
        </Stack>
      </Stack>

      {/* Messages d'erreur/succès */}
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

      {/* Barre de recherche */}
      <Stack sx={{ mb: 2, alignItems: 'center', justifyContent: '' }} direction="row">
        {
          <TextField
            size="small"
            placeholder="Rechercher par nom, email..."
            value={q}
            onChange={(e) => {
              const value = e.target.value;
              setQ(value);

              if (searchTimeout) clearTimeout(searchTimeout);

              // Ajout d’un délai de 500 ms avant la recherche
              const timeout = setTimeout(() => {
                setPage(1);
                fetchData({ page: 1, q: value });
              }, 500);

              setSearchTimeout(timeout);
            }}
            sx={{ minWidth: 300 }}
          />
        }
      </Stack>
      {/* Filtres avancés */}
      {showFilters && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Filtres avancés
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Type d'utilisateur</InputLabel>
                <Select value={filters.user_type} onChange={(e) => setFilters({ ...filters, user_type: e.target.value })}>
                  <MenuItem value="">Tous</MenuItem>
                  {userTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Statut</InputLabel>
                <Select value={filters.is_active} onChange={(e) => setFilters({ ...filters, is_active: e.target.value })}>
                  <MenuItem value="">Tous</MenuItem>
                  <MenuItem value="1">Actif</MenuItem>
                  <MenuItem value="0">Inactif</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Date de début"
                value={filters.date_from}
                onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Date de fin"
                value={filters.date_to}
                onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Button
              variant="contained"
              onClick={() => {
                setPage(1);
                fetchData({ page: 1 });
              }}
            >
              Appliquer les filtres
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setFilters({ user_type: '', is_active: '', date_from: '', date_to: '' });
                setPage(1);
                fetchData({ page: 1 });
              }}
            >
              Effacer les filtres
            </Button>
          </Stack>
        </Paper>
      )}

      {/* Tableau des utilisateurs */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Utilisateur</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Rôles</TableCell>
              <TableCell>Localisation</TableCell>
              <TableCell>Date de naissance</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Inscription</TableCell>
              <TableCell>Dernière connexion</TableCell>
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
            {!loading &&
              rows.map((r) => {
                const userTypeInfo = getUserTypeInfo(r.user_type);
                return (
                  <TableRow key={r.user_id} hover>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Avatar 
                          sx={{ 
                            width: 32, 
                            height: 32, 
                            bgcolor: userTypeInfo.color + '.main',
                            '& .MuiAvatar-img': {
                              objectFit: 'cover'
                            }
                          }} 
                          src={r.profile_picture ? `${API_BASE_URL}${r.profile_picture}` : undefined}
                        >
                          {!r.profile_picture && getUserInitials(r)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {getUserFullName(r)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            @{r.username}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{r.email}</Typography>
                      {r.phone && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {r.phone}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip label={userTypeInfo.label} color={userTypeInfo.color} size="small" />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap">
                        {(r.roles || []).map((role, index) => (
                          <Chip key={index} label={role.role_name} size="small" variant="outlined" />
                        ))}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {r.city && <>{r.city}</>}
                        {r.city && r.country && ', '}
                        {r.country && <>{r.country}</>}
                        {!r.city && !r.country && '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(r.date_of_birth)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip label={r.is_active ? 'Actif' : 'Inactif'} color={r.is_active ? 'success' : 'error'} size="small" />
                        {r.isLocked && <Chip label="Bloqué" color="error" size="small" />}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {r.registration_date ? new Date(r.registration_date).toLocaleDateString() : ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {r.last_login_date ? new Date(r.last_login_date).toLocaleDateString() : 'Jamais'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Actions">
                        <IconButton size="small" onClick={(e) => handleMenuClick(e, r)}>
                          <MoreVertIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            {!loading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="text.secondary">
                    Aucun utilisateur trouvé
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <Stack sx={{ mt: 2, alignItems: 'center' }}>
        <Pagination count={pages} page={page} onChange={(_, p) => setPage(p)} color="primary" />
      </Stack>

      {/* Menu contextuel */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        {hasPermission(user, 'users.read') && (
          <MenuItem onClick={() => handleViewProfile(selectedUser)}>
            <VisibilityIcon sx={{ mr: 1 }} />
            Voir le profil
          </MenuItem>
        )}
        {hasPermission(user, 'users.update') && (
          <MenuItem onClick={() => handleEditUser(selectedUser)}>
            <EditIcon sx={{ mr: 1 }} />
            Modifier
          </MenuItem>
        )}
        {hasPermission(user, 'users.update') && (
          <MenuItem onClick={() => handleToggleStatus(selectedUser)}>
            {selectedUser?.is_active ? <LockIcon sx={{ mr: 1 }} /> : <UnlockIcon sx={{ mr: 1 }} />}
            {selectedUser?.is_active ? 'Désactiver' : 'Activer'}
          </MenuItem>
        )}
        {hasPermission(user, 'users.delete') && (
          <MenuItem onClick={() => handleDeleteUser(selectedUser)} sx={{ color: 'error.main' }}>
            <DeleteIcon sx={{ mr: 1 }} />
            Supprimer
          </MenuItem>
        )}
      </Menu>

      {/* View Modal */}
      <Dialog open={openView} onClose={() => setOpenView(false)} maxWidth="sm" fullWidth>
        <DialogTitle>User details</DialogTitle>
        <DialogContent>
          {selected && (
            <Stack sx={{ gap: 1, mt: 1 }}>
              <Typography variant="subtitle2">Username: {selected.username}</Typography>
              <Typography variant="subtitle2">Email: {selected.email}</Typography>
              <Typography variant="subtitle2">First Name: {selected.first_name || ''}</Typography>
              <Typography variant="subtitle2">Last Name: {selected.last_name || ''}</Typography>
              <Typography variant="subtitle2">Phone: {selected.phone || ''}</Typography>
              <Typography variant="subtitle2">Roles: {(selected.roles || []).map((x) => x.role_name).join(', ')}</Typography>
              <Typography variant="subtitle2">Status: {selected.is_active ? 'Active' : 'Inactive'}</Typography>
              <Typography variant="subtitle2">
                Registered: {selected.created_at ? new Date(selected.created_at).toLocaleString() : ''}
              </Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenView(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} maxWidth="md" fullWidth>
        <DialogTitle>Modifier l'utilisateur</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Nom d'utilisateur"
                value={editForm.username}
                onChange={(e) => setEditForm((s) => ({ ...s, username: e.target.value }))}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                type="email"
                label="Email"
                value={editForm.email}
                onChange={(e) => setEditForm((s) => ({ ...s, email: e.target.value }))}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Prénom"
                value={editForm.first_name}
                onChange={(e) => setEditForm((s) => ({ ...s, first_name: e.target.value }))}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Nom"
                value={editForm.last_name}
                onChange={(e) => setEditForm((s) => ({ ...s, last_name: e.target.value }))}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Téléphone"
                value={editForm.phone}
                onChange={(e) => setEditForm((s) => ({ ...s, phone: e.target.value }))}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                type="date"
                label="Date de naissance"
                value={editForm.date_of_birth ? editForm.date_of_birth.split('T')[0] : ''}
                onChange={(e) => setEditForm((s) => ({
                  ...s,
                  date_of_birth: e.target.value ? new Date(e.target.value).toISOString().split('T')[0] : null
                }))}
                InputLabelProps={{
                  shrink: true,
                }}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Type d'utilisateur</InputLabel>
                <Select value={editForm.user_type} onChange={(e) => setEditForm((s) => ({ ...s, user_type: e.target.value }))}>
                  {userTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox checked={editForm.is_active} onChange={(e) => setEditForm((s) => ({ ...s, is_active: e.target.checked }))} />
                }
                label="Actif"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)}>Annuler</Button>
          <Button
            variant="contained"
            onClick={async () => {
              if (selected) {
                try {
                  await updateUser(selected.user_id, editForm);
                  setOpenEdit(false);
                  setSuccess('Utilisateur mis à jour avec succès');
                  fetchData();
                } catch (e) {
                  setError('Erreur lors de la mise à jour');
                }
              }
            }}
          >
            Sauvegarder
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

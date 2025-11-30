import React, { useState, useEffect } from 'react';

// URL de base pour les images de profil
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3200';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Grid,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tab,
  Tabs,
  Stack,
  IconButton,
  Tooltip,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress
} from '@mui/material';
import {
  Edit as EditIcon,
  Lock as LockIcon,
  LockOpen,
  LockReset as LockResetIcon,
  Send as SendIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  History as HistoryIcon,
  TrendingUp as TrendingUpIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { http } from 'api/http';
import { 
  getUser, 
  updateUser, 
  getUserStats, 
  unlockUser, 
  resetPassword, 
  getUserAuditLogs, 
  getUserSecurityInfo, 
  updateUserSecurity, 
  toggleTwoFactorAuth 
} from 'api/users';
import SecuritySection from './components/SecuritySection';
import { useAuth } from 'contexts/auth';
import { hasPermission } from 'utils/permissions';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`user-tabpanel-${index}`}
      aria-labelledby={`user-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function UserProfile({ isProfilePage = false }) {
  const params = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [user, setUser] = useState(null);
  
  // Récupérer l'ID depuis les paramètres, l'utilisateur connecté ou l'utilisateur chargé
  const getUserId = () => {
    // Si on a un utilisateur chargé, on utilise son ID
    if (user?.user_id) return user.user_id;
    if (user?._id) return user._id;
    if (user?.id) return user.id;
    
    // Sinon, on essaie avec l'utilisateur connecté
    if (currentUser?.user_id) return currentUser.user_id;
    if (currentUser?._id) return currentUser._id;
    if (currentUser?.id) return currentUser.id;
    
    // En dernier recours, on essaie avec les paramètres de route
    return params.id || params.userId;
  };
  
  const id = getUserId();
  
  // Ajouter un log pour le débogage
  console.log('Paramètres de route:', params);
  console.log('Utilisateur chargé:', user);
  console.log('ID extrait:', id);
  const [stats, setStats] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDialog, setEditDialog] = useState(false);
  const [resetPasswordDialog, setResetPasswordDialog] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Gestion de l'état de sécurité via le contexte utilisateur

  const userTypes = [
    { value: 'NOVICE', label: 'Novice', color: 'default' },
    { value: 'INTERMEDIATE', label: 'Intermédiaire', color: 'primary' },
    { value: 'PROFESSIONAL', label: 'Professionnel', color: 'secondary' },
    { value: 'ADMIN', label: 'Administrateur', color: 'error' }
  ];

  const languages = [
    { value: 'fr', label: 'Français' },
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
    { value: 'de', label: 'Deutsch' }
  ];

  const currencies = [
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'USD', label: 'USD ($)' },
    { value: 'GBP', label: 'GBP (£)' },
    { value: 'CHF', label: 'CHF (CHF)' }
  ];

  const timezones = [
    'UTC',
    'Europe/Paris',
    'Europe/London',
    'America/New_York',
    'America/Los_Angeles',
    'Asia/Tokyo',
    'Asia/Shanghai'
  ];

  useEffect(() => {
    if (isProfilePage && currentUser) {
      // Si c'est la page de profil de l'utilisateur connecté, utiliser ses données
      const userData = {
        ...currentUser,
        getInitials: () => getUserInitials(currentUser),
        getFullName: () => getUserFullName(currentUser)
      };
      setUser(userData);
      setLoading(false);
    } else if (id) {
      // Sinon, charger les données de l'utilisateur spécifié
      fetchUserData();
    } else {
      setError('Aucun utilisateur spécifié');
      setLoading(false);
    }
  }, [id, isProfilePage, currentUser]);

  // Fonction utilitaire pour obtenir les initiales d'un utilisateur
  const getUserInitials = (user) => {
    if (!user) return '';
    if (user.getInitials) return user.getInitials();
    const first = user.first_name ? user.first_name.charAt(0).toUpperCase() : '';
    const last = user.last_name ? user.last_name.charAt(0).toUpperCase() : '';
    return (first + last) || (user.username ? user.username.charAt(0).toUpperCase() : '?');
  };

  // Fonction utilitaire pour obtenir le nom complet d'un utilisateur
  const getUserFullName = (user) => {
    if (!user) return 'Utilisateur inconnu';
    if (user.getFullName) return user.getFullName();
    return `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || 'Utilisateur sans nom';
  };

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Récupération des données utilisateur, statistiques, logs d'audit et sécurité en parallèle
      const [userData, statsResponse, auditResponse, securityData] = await Promise.all([
        getUser(id).catch(error => {
          console.error('Erreur lors de la récupération des données utilisateur:', error);
          return null;
        }),
        getUserStats(id).catch(error => {
          console.error('Erreur lors de la récupération des statistiques:', error);
          return { data: { activity: { recent_actions: 0, total_portfolios: 0 }, sessions: [] } };
        }),
        getUserAuditLogs(id, { page: 1, pageSize: 10 }).catch(error => {
          console.error('Erreur lors de la récupération des logs d\'audit:', error);
          return { data: [] };
        }),
        getUserSecurityInfo(id).catch(error => {
          console.error('Erreur lors de la récupération des données de sécurité:', error);
          return { 
            data: {
              is_locked: false,
              login_attempts: 0,
              email_verified: false,
              two_factor_enabled: false,
              last_login_date: null,
              sessions: []
            }
          };
        })
      ]);

      console.log('Données utilisateur reçues:', userData);
      console.log('Statistiques reçues:', statsResponse);
      console.log('Logs d\'audit reçus:', auditResponse);
      console.log('Données de sécurité reçues:', securityData);

      if (!userData) {
        throw new Error('Impossible de charger les données de l\'utilisateur');
      }

      // Extraire les données de la réponse
      const statsData = statsResponse?.data || { activity: { recent_actions: 0, total_portfolios: 0 }, sessions: [] };
      const auditLogs = Array.isArray(auditResponse?.data) ? auditResponse.data : [];
      const securityInfo = securityData?.data || {
        is_locked: false,
        login_attempts: 0,
        email_verified: false,
        two_factor_enabled: false,
        last_login_date: null,
        sessions: []
      };
      
      // Fusionner les données de l'utilisateur avec les données de sécurité
      const mergedUserData = {
        ...userData,
        ...securityInfo, // Les champs de sécurité écraseront les champs existants si nécessaire
        is_locked: securityInfo.is_locked || false,
        login_attempts: securityInfo.login_attempts || 0,
        email_verified: securityInfo.email_verified || false,
        two_factor_enabled: securityInfo.two_factor_enabled || false,
        last_login_date: securityInfo.last_login_date || null
      };
      
      // Créer l'objet utilisateur enrichi avec les méthodes utilitaires
      const enhancedUser = {
        ...mergedUserData,
        getInitials: () => getUserInitials(mergedUserData),
        getFullName: () => getUserFullName(mergedUserData)
      };
      
      // Mettre à jour l'état avec toutes les données récupérées
      setUser(enhancedUser);
      setStats({
        activity: {
          recent_actions: statsData.activity?.recent_actions || 0,
          total_portfolios: statsData.activity?.total_portfolios || 0
        },
        sessions: securityData.sessions || []
      });
      
      setAuditLogs(auditLogs);
    } catch (err) {
      console.error('Erreur inattendue lors du chargement des données utilisateur:', err);
      setError('Une erreur inattendue est survenue lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditForm({
      username: user.username || '',
      email: user.email || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      phone: user.phone || '',
      date_of_birth: user.date_of_birth || '',
      address: user.address || '',
      city: user.city || '',
      country: user.country || '',
      postal_code: user.postal_code || '',
      timezone: user.timezone || 'UTC',
      language: user.language || 'fr',
      currency: user.currency || 'EUR',
      user_type: user.user_type || 'NOVICE',
      is_active: user.is_active !== false,
      notes: user.notes || ''
    });
    setEditDialog(true);
  };

  const handleSaveEdit = async () => {
    try {
      await updateUser(id, editForm);
      setEditDialog(false);
      setSuccess('Utilisateur mis à jour avec succès');
      fetchUserData();
    } catch (err) {
      setError('Erreur lors de la mise à jour');
    }
  };

  // Fonction pour déverrouiller un utilisateur
  const handleUnlockUser = async () => {
    try {
      setIsLoading(true);
      const response = await unlockUser(id);
      if (response && response.success) {
        // Mettre à jour les paramètres de sécurité via l'API
        await updateUserSecurity(id, {
          is_locked: false,
          is_active: true,
          login_attempts: 0
        });
        
        // Mettre à jour l'état local
        setUser(prev => ({
          ...prev,
          is_locked: false,
          is_active: true,
          login_attempts: 0
        }));
        
        setSuccess('Utilisateur débloqué avec succès');
      } else {
        throw new Error(response?.message || 'Erreur lors du déverrouillage');
      }
    } catch (error) {
      console.error('Erreur lors du déverrouillage:', error);
      setError(error.response?.data?.message || error.message || 'Erreur lors du déverrouillage de l\'utilisateur');
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour réinitialiser les tentatives de connexion
  const handleResetLoginAttempts = async () => {
    try {
      setIsLoading(true);
      
      // Mettre à jour les paramètres de sécurité via l'API
      const response = await updateUserSecurity(id, { 
        login_attempts: 0,
        is_locked: false // Déverrouiller le compte lors de la réinitialisation
      });
      
      if (response && response.success) {
        // Mettre à jour l'état local
        setUser(prev => ({
          ...prev,
          login_attempts: 0,
          is_locked: false
        }));
        
        setSuccess('Compteur de tentatives réinitialisé avec succès');
      } else {
        throw new Error(response?.message || 'Erreur lors de la réinitialisation');
      }
    } catch (error) {
      console.error('Erreur détaillée:', error);
      setError(error.response?.data?.message || error.message || 'Erreur lors de la réinitialisation des tentatives');
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour vérifier l'état de vérification de l'email
  const handleResendVerificationEmail = async () => {
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');
      
      // Rafraîchir les données utilisateur pour obtenir l'état de vérification le plus récent
      const securityInfo = await getUserSecurityInfo(id);
      
      if (securityInfo) {
        // Mettre à jour l'état local avec les données fraîches
        setUser(prev => ({
          ...prev,
          email_verified: securityInfo.email_verified || false,
          ...securityInfo // Mettre à jour toutes les propriétés de sécurité
        }));
        
        if (securityInfo.email_verified) {
          setSuccess('L\'email est déjà vérifié');
        } else {
          // Appeler l'API pour renvoyer l'email de vérification
          const response = await http.post(`/users/${id}/resend-verification`);
          if (response && response.success) {
            setSuccess('Email de vérification envoyé avec succès');
          } else {
            throw new Error(response?.message || 'Échec de l\'envoi de l\'email de vérification');
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'email:', error);
      setError(error.message || 'Impossible de vérifier l\'état de l\'email. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour activer/désactiver l'authentification à deux facteurs
  const handleToggle2FA = async (enable) => {
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');
      
      // Appeler l'API pour activer/désactiver la 2FA
      const response = await toggleTwoFactorAuth(id, enable);
      
      if (response) {
        // Mettre à jour l'état local avec les données fraîches du serveur
        const updatedUser = await getUser(id);
        if (updatedUser) {
          setUser(prev => ({
            ...prev,
            ...updatedUser,
            two_factor_enabled: enable,
            two_factor_secret: response.two_factor_secret || response.data?.two_factor_secret || prev.two_factor_secret
          }));
        }
        
        // Si on active la 2FA et qu'on a un QR code, on l'affiche
        if (enable && (response.qrCodeUrl || response.data?.qrCodeUrl)) {
          setQrCodeUrl(response.qrCodeUrl || response.data.qrCodeUrl);
          setShow2FADialog(true);
        }
        
        setSuccess(`Authentification à deux facteurs ${enable ? 'activée' : 'désactivée'} avec succès`);
        
        // Rafraîchir les données utilisateur
        await fetchUserData();
      } else {
        throw new Error(`Erreur lors de ${enable ? 'l\'activation' : 'la désactivation'} de l'authentification à deux facteurs`);
      }
    } catch (error) {
      console.error('Erreur détaillée:', error);
      setError(error.message || `Erreur lors de ${enable ? 'l\'activation' : 'la désactivation'} de l'authentification à deux facteurs`);
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour révoquer une session
  const handleRevokeSession = async (sessionId) => {
    if (window.confirm('Êtes-vous sûr de vouloir révoquer cette session ?')) {
      try {
        setIsLoading(true);
        const response = await http.delete(`/users/${id}/sessions/${sessionId}`);
        
        if (response && response.success) {
          // Mettre à jour l'état local en supprimant la session
          setUser(prev => ({
            ...prev,
            sessions: prev.sessions?.filter(session => session.id !== sessionId) || []
          }));
          
          // Mettre à jour également les stats si nécessaire
          if (stats?.sessions) {
            setStats(prev => ({
              ...prev,
              sessions: prev.sessions.filter(session => session.id !== sessionId)
            }));
          }
          
          setSuccess('Session révoquée avec succès');
        } else {
          throw new Error(response?.message || 'Erreur lors de la révocation de la session');
        }
      } catch (error) {
        console.error('Erreur détaillée:', error);
        setError(error.response?.data?.message || 'Erreur lors de la révocation de la session');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleUnlock = async () => {
    try {
      await unlockUser(id);
      setSuccess('Utilisateur débloqué avec succès');
      fetchUserData();
    } catch (err) {
      setError('Erreur lors du déverrouillage');
    }
  };

  const handleResetPassword = async () => {
    try {
      await resetPassword(id, { new_password: newPassword });
      setResetPasswordDialog(false);
      setNewPassword('');
      setSuccess('Mot de passe réinitialisé avec succès');
    } catch (err) {
      setError('Erreur lors de la réinitialisation du mot de passe');
    }
  };

  const getUserTypeInfo = (type) => {
    return userTypes.find(t => t.value === type) || userTypes[0];
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box>
        <Typography variant="h4" color="error">Utilisateur non trouvé</Typography>
        <Button onClick={() => navigate('/users')} sx={{ mt: 2 }}>
          Retour à la liste
        </Button>
      </Box>
    );
  }

  // Composant de débogage temporaire
  const DebugInfo = () => (
    <Card sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5' }}>
      <Typography variant="h6" gutterBottom>Débogage - Données brutes</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div>
          <Typography variant="subtitle2">Données utilisateur:</Typography>
          <pre style={{ margin: 0, fontSize: '12px', maxHeight: '200px', overflow: 'auto' }}>
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
        <div>
          <Typography variant="subtitle2">Statistiques:</Typography>
          <pre style={{ margin: 0, fontSize: '12px', maxHeight: '200px', overflow: 'auto' }}>
            {JSON.stringify(stats, null, 2)}
          </pre>
        </div>
      </Box>
    </Card>
  );

  const userTypeInfo = getUserTypeInfo(user.user_type);
  
  // Fonction pour gérer la mise à jour de l'utilisateur
  const handleUserUpdate = (updatedUser) => {
    setUser(prev => ({
      ...prev,
      ...updatedUser
    }));
    setSuccess('Profil mis à jour avec succès');
    setTimeout(() => setSuccess(''), 5000);
  };



  return (
    <Box>
      {/* Header avec actions */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Profil Utilisateur</Typography>
        <Stack direction="row" spacing={1}>
          {hasPermission(currentUser, 'users.update') && (
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={handleEdit}
            >
              Modifier
            </Button>
          )}
          {hasPermission(currentUser, 'users.update') && user.isLocked && (
            <Button
              variant="outlined"
              color="success"
              startIcon={<UnlockIcon />}
              onClick={handleUnlockUser}
            >
              Débloquer
            </Button>
          )}
          {hasPermission(currentUser, 'users.update') && (
            <Button
              variant="outlined"
              color="warning"
              startIcon={<LockIcon />}
              onClick={() => setResetPasswordDialog(true)}
            >
              Réinitialiser mot de passe
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchUserData}
          >
            Actualiser
          </Button>
        </Stack>
      </Box>

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

      {/* Informations principales */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item>
              <Avatar
                sx={{ 
                  width: 80, 
                  height: 80, 
                  bgcolor: userTypeInfo?.color ? `${userTypeInfo.color}.main` : 'primary.main',
                  '& .MuiAvatar-img': {
                    objectFit: 'cover'
                  }
                }}
                src={user?.profile_picture ? `${API_BASE_URL}${user.profile_picture}` : undefined}
              >
                {!user?.profile_picture && getUserInitials(user)}
              </Avatar>
            </Grid>
            <Grid item xs>
              <Typography variant="h5" gutterBottom>
                {getUserFullName(user)}
              </Typography>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                @{user.username} • {user.email}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Chip
                  label={userTypeInfo.label}
                  color={userTypeInfo.color}
                  size="small"
                />
                <Chip
                  label={user.is_active ? 'Actif' : 'Inactif'}
                  color={user.is_active ? 'success' : 'error'}
                  size="small"
                />
                {user.isLocked && (
                  <Chip
                    label="Bloqué"
                    color="error"
                    size="small"
                  />
                )}
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Onglets */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab icon={<PersonIcon />} label="Profil" />
            <Tab label="Sécurité" icon={<SecurityIcon />} />
            <Tab icon={<HistoryIcon />} label="Activité" />
            {hasPermission(currentUser, 'users.stats.view') && (
              <Tab icon={<TrendingUpIcon />} label="Statistiques" />
            )}
          </Tabs>
        </Box>

        {/* Onglet Profil */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {/* Section Profil */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon fontSize="small" />
                    Profil
                  </Typography>
                  <Stack spacing={2}>
                    <TextField
                      label="Nom d'utilisateur"
                      value={user.username || ''}
                      InputProps={{ readOnly: true }}
                      fullWidth
                    />
                    <TextField
                      label="Email"
                      value={user.email || ''}
                      InputProps={{ readOnly: true }}
                      fullWidth
                    />
                    <TextField
                      label="Date d'inscription"
                      value={user.registration_date ? new Date(user.registration_date).toLocaleDateString() : ''}
                      InputProps={{ readOnly: true }}
                      fullWidth
                    />
                  </Stack>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon fontSize="small" />
                    Informations personnelles
                  </Typography>
                  <Stack spacing={2}>
                    <TextField
                      label="Prénom"
                      value={user.first_name || ''}
                      InputProps={{ readOnly: true }}
                      fullWidth
                    />
                    <TextField
                      label="Nom"
                      value={user.last_name || ''}
                      InputProps={{ readOnly: true }}
                      fullWidth
                    />
                    <TextField
                      label="Téléphone"
                      value={user.phone || 'Non renseigné'}
                      InputProps={{ readOnly: true }}
                      fullWidth
                    />
                    <TextField
                      label="Date de naissance"
                      value={user.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString() : 'Non renseignée'}
                      InputProps={{ readOnly: true }}
                      fullWidth
                    />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Section Contact et Paramètres */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon fontSize="small" />
                    Contact
                  </Typography>
                  <Stack spacing={2}>
                    <TextField
                      label="Adresse"
                      value={user.address || 'Non renseignée'}
                      InputProps={{ readOnly: true }}
                      fullWidth
                      multiline
                      rows={2}
                    />
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Ville"
                          value={user.city || 'Non renseignée'}
                          InputProps={{ readOnly: true }}
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Code postal"
                          value={user.postal_code || 'Non renseigné'}
                          InputProps={{ readOnly: true }}
                          fullWidth
                        />
                      </Grid>
                    </Grid>
                    <TextField
                      label="Pays"
                      value={user.country || 'Non renseigné'}
                      InputProps={{ readOnly: true }}
                      fullWidth
                    />
                  </Stack>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SettingsIcon fontSize="small" />
                    Paramètres du compte
                  </Typography>
                  <Stack spacing={2}>
                    <TextField
                      label="Fuseau horaire"
                      value={user.timezone || 'UTC'}
                      InputProps={{ readOnly: true }}
                      fullWidth
                    />
                    <TextField
                      label="Langue"
                      value={languages.find(lang => lang.value === user.language)?.label || user.language || 'Non défini'}
                      InputProps={{ readOnly: true }}
                      fullWidth
                    />
                    <TextField
                      label="Devise"
                      value={currencies.find(curr => curr.value === user.currency)?.label || user.currency || 'Non défini'}
                      InputProps={{ readOnly: true }}
                      fullWidth
                    />
                    <TextField
                      label="Type de compte"
                      value={userTypeInfo?.label || user.user_type || 'Non défini'}
                      InputProps={{ readOnly: true }}
                      fullWidth
                    />
                    <TextField
                      label="Statut du compte"
                      value={user.is_active ? 'Actif' : 'Inactif'}
                      InputProps={{ readOnly: true }}
                      fullWidth
                      sx={{
                        '& .MuiInputBase-input': {
                          color: user.is_active ? 'success.main' : 'error.main',
                          fontWeight: 'medium'
                        }
                      }}
                    />
                  </Stack>
                  {user.notes && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="h6" gutterBottom>Notes</Typography>
                      <TextField
                        value={user.notes}
                        InputProps={{ readOnly: true }}
                        fullWidth
                        multiline
                        rows={3}
                      />
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Onglet Sécurité */}
        <TabPanel value={tabValue} index={1}>
          {console.log('ID utilisateur:', id, 'Données utilisateur:', user)}
          {!id ? (
            <Alert severity="error">Erreur: Aucun ID utilisateur spécifié</Alert>
          ) : !user ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
              <Typography variant="body1" sx={{ ml: 2 }}>Chargement des données de sécurité...</Typography>
            </Box>
          ) : (
            <SecuritySection 
              userId={id}
              user={user}
              onUpdateUser={handleUserUpdate}
            />
          )}
        </TabPanel>

        {/* Onglet Activité */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Activité récente</Typography>
                  <Divider sx={{ mb: 2 }} />
                  {auditLogs.length > 0 ? (
                    <TableContainer component={Paper}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Action</TableCell>
                            <TableCell>Type d'entité</TableCell>
                            <TableCell>Adresse IP</TableCell>
                            <TableCell align="right">Statut</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {auditLogs.map((log, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Date inconnue'}
                              </TableCell>
                              <TableCell>{log.action || 'Action inconnue'}</TableCell>
                              <TableCell>{log.entity_type || '-'}</TableCell>
                              <TableCell>{log.ip_address || '-'}</TableCell>
                              <TableCell align="right">
                                <Chip 
                                  label={log.status || 'inconnu'} 
                                  size="small" 
                                  color={log.status === 'success' ? 'success' : 'error'}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Aucune activité récente
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Onglet Statistiques */}
        <TabPanel value={tabValue} index={3}>
          {stats && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Statistiques générales</Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Actions récentes (30 derniers jours)
                    </Typography>
                    <Typography variant="h4">{stats.activity?.recent_actions || 0}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Total des portefeuilles
                    </Typography>
                    <Typography variant="h4">{stats.activity?.total_portfolios || 0}</Typography>
                  </Box>
                </Stack>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Sessions récentes</Typography>
                <Stack spacing={1}>
                  {stats.sessions?.slice(0, 5).map((session, index) => (
                    <Box key={index} sx={{ p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                      <Typography variant="body2">
                        {session.created_at ? new Date(session.created_at).toLocaleString() : ''}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        IP: {session.ip_address} • {session.is_active ? 'Active' : 'Inactive'}
                      </Typography>
                    </Box>
                  ))}
                  {(!stats.sessions || stats.sessions.length === 0) && (
                    <Typography variant="body2" color="text.secondary">
                      Aucune session trouvée
                    </Typography>
                  )}
                </Stack>
              </Grid>
            </Grid>
          )}
        </TabPanel>
      </Card>

      {/* Dialog d'édition */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Modifier l'utilisateur</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Nom d'utilisateur"
                value={editForm.username || ''}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Email"
                type="email"
                value={editForm.email || ''}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Prénom"
                value={editForm.first_name || ''}
                onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Nom"
                value={editForm.last_name || ''}
                onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Téléphone"
                value={editForm.phone || ''}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Date de naissance"
                type="date"
                value={editForm.date_of_birth || ''}
                onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Adresse"
                value={editForm.address || ''}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                fullWidth
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Ville"
                value={editForm.city || ''}
                onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Pays"
                value={editForm.country || ''}
                onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Code postal"
                value={editForm.postal_code || ''}
                onChange={(e) => setEditForm({ ...editForm, postal_code: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Langue</InputLabel>
                <Select
                  value={editForm.language || 'fr'}
                  onChange={(e) => setEditForm({ ...editForm, language: e.target.value })}
                >
                  {languages.map((lang) => (
                    <MenuItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Devise</InputLabel>
                <Select
                  value={editForm.currency || 'EUR'}
                  onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}
                >
                  {currencies.map((curr) => (
                    <MenuItem key={curr.value} value={curr.value}>
                      {curr.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Fuseau horaire</InputLabel>
                <Select
                  value={editForm.timezone || 'UTC'}
                  onChange={(e) => setEditForm({ ...editForm, timezone: e.target.value })}
                >
                  {timezones.map((tz) => (
                    <MenuItem key={tz} value={tz}>
                      {tz}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Type d'utilisateur</InputLabel>
                <Select
                  value={editForm.user_type || 'NOVICE'}
                  onChange={(e) => setEditForm({ ...editForm, user_type: e.target.value })}
                >
                  {userTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Statut</InputLabel>
                <Select
                  value={editForm.is_active ? 'active' : 'inactive'}
                  onChange={(e) => setEditForm({ ...editForm, is_active: e.target.value === 'active' })}
                >
                  <MenuItem value="active">Actif</MenuItem>
                  <MenuItem value="inactive">Inactif</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Notes"
                value={editForm.notes || ''}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                fullWidth
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleSaveEdit}>
            Sauvegarder
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de réinitialisation de mot de passe */}
      <Dialog open={resetPasswordDialog} onClose={() => setResetPasswordDialog(false)}>
        <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
        <DialogContent>
          <TextField
            label="Nouveau mot de passe"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            fullWidth
            sx={{ mt: 2 }}
            helperText="Le mot de passe doit contenir au moins 8 caractères"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetPasswordDialog(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleResetPassword}>
            Réinitialiser
          </Button>
        </DialogActions>
      </Dialog>


      {/* Affichage des données brutes pour débogage */}
      {/* <DebugInfo /> */}
    </Box>
  );
}; 

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Grid,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Email as EmailIcon,
  Refresh as RefreshIcon,
  QrCode as QrCodeIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Security as SecurityIcon,
  VerifiedUser as VerifiedUserIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useUserSecurity } from 'hooks/useUserSecurity';

const SecuritySection = ({ userId, user, onUpdateUser }) => {
  const [showQRCode, setShowQRCode] = useState(false);
  const [show2FADialog, setShow2FADialog] = useState(false);
  
  const {
    isLoading,
    error,
    success,
    qrCodeUrl,
    handleToggle2FA,
    handleResendVerification,
    refreshSecurityInfo,
    setError,
    setSuccess
  } = useUserSecurity(userId);

  useEffect(() => {
    if (success?.includes('activée') && !show2FADialog) {
      setShow2FADialog(true);
    }
  }, [success, show2FADialog]);

  const handleToggle2FAWithUpdate = async (enable) => {
    const { success: toggleSuccess, securityInfo } = await handleToggle2FA(enable);
    if (toggleSuccess && securityInfo) {
      onUpdateUser(prev => ({ ...prev, ...securityInfo }));
    }
  };

  const handleResendVerificationWithUpdate = async () => {
    const { securityInfo } = await handleResendVerification();
    if (securityInfo) {
      onUpdateUser(prev => ({ ...prev, ...securityInfo }));
    }
  };

  const handleRefreshSecurity = async () => {
    const securityInfo = await refreshSecurityInfo();
    if (securityInfo) {
      onUpdateUser(prev => ({ ...prev, ...securityInfo }));
      setSuccess('Informations de sécurité mises à jour');
    }
  };

  return (
    <Box>
      {/* En-tête avec bouton de rafraîchissement */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" component="h2">
          <SecurityIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
          Sécurité du compte
        </Typography>
        <Tooltip title="Rafraîchir les informations de sécurité">
          <IconButton 
            onClick={handleRefreshSecurity} 
            disabled={isLoading}
            color="primary"
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Messages d'erreur et de succès */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Carte d'état de vérification d'email */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box display="flex" alignItems="center">
                  {user.email_verified ? (
                    <VerifiedUserIcon color="success" sx={{ mr: 1 }} />
                  ) : (
                    <WarningIcon color="warning" sx={{ mr: 1 }} />
                  )}
                  <Typography variant="h6">Vérification d'email</Typography>
                </Box>
                <Chip 
                  label={user.email_verified ? 'Vérifié' : 'Non vérifié'} 
                  color={user.email_verified ? 'success' : 'warning'} 
                  size="small"
                />
              </Box>
              
              <Typography variant="body2" color="textSecondary" paragraph>
                {user.email_verified 
                  ? 'Votre adresse email a été vérifiée avec succès.'
                  : 'Veuillez vérifier votre adresse email pour accéder à toutes les fonctionnalités.'
                }
              </Typography>
              
              {!user.email_verified && (
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<EmailIcon />}
                  onClick={handleResendVerificationWithUpdate}
                  disabled={isLoading}
                  fullWidth
                >
                  {isLoading ? 'Envoi en cours...' : 'Renvoyer l\'email de vérification'}
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Carte d'authentification à deux facteurs */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box display="flex" alignItems="center">
                  <SecurityIcon color={user.two_factor_enabled ? 'primary' : 'action'} sx={{ mr: 1 }} />
                  <Typography variant="h6">Authentification à deux facteurs (2FA)</Typography>
                </Box>
                <Chip 
                  label={user.two_factor_enabled ? 'Activée' : 'Désactivée'} 
                  color={user.two_factor_enabled ? 'primary' : 'default'} 
                  size="small"
                />
              </Box>
              
              <Typography variant="body2" color="textSecondary" paragraph>
                {user.two_factor_enabled 
                  ? 'L\'authentification à deux facteurs est activée pour votre compte.'
                  : 'Ajoutez une couche de sécurité supplémentaire à votre compte en activant l\'authentification à deux facteurs.'
                }
              </Typography>
              
              <Box display="flex" gap={2}>
                <Button
                  variant={user.two_factor_enabled ? 'outlined' : 'contained'}
                  color={user.two_factor_enabled ? 'error' : 'primary'}
                  startIcon={
                    isLoading ? 
                      <CircularProgress size={20} /> : 
                      (user.two_factor_enabled ? <LockOpenIcon /> : <LockIcon />)
                  }
                  onClick={() => handleToggle2FAWithUpdate(!user.two_factor_enabled)}
                  disabled={isLoading}
                >
                  {user.two_factor_enabled ? 'Désactiver la 2FA' : 'Activer la 2FA'}
                </Button>
                
                {user.two_factor_enabled && qrCodeUrl && (
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<QrCodeIcon />}
                    onClick={() => setShowQRCode(true)}
                  >
                    Voir le QR Code
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Section des sessions actives */}
        {user.sessions && user.sessions.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <SecurityIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Sessions actives
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  Voici les appareils actuellement connectés à votre compte.
                </Typography>
                
                <List>
                  {user.sessions.map((session, index) => (
                    <React.Fragment key={session.id || index}>
                      <ListItem>
                        <ListItemIcon>
                          {session.isCurrent ? (
                            <CheckCircleIcon color="primary" />
                          ) : (
                            <CancelIcon color="disabled" />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={`${session.browser || 'Navigateur inconnu'} sur ${session.os || 'système d\'exploitation inconnu'}`}
                          secondary={
                            <>
                              <span>{session.ip_address}</span>
                              {session.last_activity && (
                                <span> - Dernière activité: {new Date(session.last_activity).toLocaleString()}</span>
                              )}
                            </>
                          }
                        />
                        {!session.isCurrent && (
                          <Button 
                            size="small" 
                            color="error"
                            disabled={isLoading}
                            // Ajoutez ici la logique pour déconnecter la session
                          >
                            Déconnecter
                          </Button>
                        )}
                      </ListItem>
                      {index < user.sessions.length - 1 && <Divider component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Dialogue pour afficher le QR Code 2FA */}
      <Dialog 
        open={showQRCode && !!qrCodeUrl} 
        onClose={() => setShowQRCode(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Configuration de l'authentification à deux facteurs</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" alignItems="center" p={2}>
            <Typography variant="body1" paragraph textAlign="center">
              Scannez ce code QR avec votre application d'authentification (comme Google Authenticator ou Authy) :
            </Typography>
            <img 
              src={qrCodeUrl} 
              alt="QR Code pour l'authentification à deux facteurs" 
              style={{ width: '100%', maxWidth: '300px', margin: '0 auto' }} 
            />
            <Typography variant="body2" color="textSecondary" mt={2} textAlign="center">
              Si vous ne pouvez pas scanner le code, entrez manuellement ce code :
            </Typography>
            <Box 
              bgcolor="action.hover" 
              p={1} 
              mt={1} 
              borderRadius={1}
              fontFamily="monospace"
              textAlign="center"
              width="100%"
              maxWidth="300px"
            >
              {user.two_factor_secret || 'Chargement...'}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowQRCode(false)} color="primary">
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SecuritySection;

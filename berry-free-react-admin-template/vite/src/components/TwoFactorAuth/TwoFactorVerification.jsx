import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  CircularProgress,
  Alert,
  useMediaQuery
} from '@mui/material';
import { verifyTwoFactorCode } from '../../api/auth';
import OTPInput from '../OTPInput';

const TwoFactorVerification = ({ open, onClose, onSuccess, userId }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  useEffect(() => {
    if (open) {
      // Réinitialiser l'état à chaque ouverture
      setCode(['', '', '', '', '', '']);
      setError('');
      setLoading(false);
    }
  }, [open]);

  const handleCodeChange = (newCode) => {
    setCode([...newCode]);
    setError(''); // Effacer les erreurs lors de la saisie
  };

  const handleVerify = async () => {
    const verificationCode = code.join('');
    
    if (verificationCode.length !== 6) {
      setError('Veuillez entrer un code à 6 chiffres');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await verifyTwoFactorCode({
        userId,
        code: verificationCode
      });

      if (response.success) {
        // Mettre à jour l'état d'authentification si nécessaire
        if (onSuccess) {
          onSuccess();
        }
        
        // Fermer la boîte de dialogue
        if (onClose) {
          onClose();
        }
        
        // Rediriger si une redirection est prévue
        const { from } = location.state || { from: { pathname: '/' } };
        navigate(from);
      } else {
        setError(response.message || 'Code de vérification invalide');
      }
    } catch (err) {
      console.error('Erreur lors de la vérification 2FA:', err);
      setError('Une erreur est survenue lors de la vérification. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="xs"
      fullWidth
      onKeyDown={handleKeyDown}
    >
      <DialogTitle sx={{ textAlign: 'center', pt: 3, pb: 1 }}>
        Vérification en deux étapes
      </DialogTitle>
      
      <DialogContent sx={{ py: 2, textAlign: 'center' }}>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Entrez le code à 6 chiffres de votre application d'authentification
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <OTPInput
            value={code}
            onChange={handleCodeChange}
            length={6}
            error={!!error}
            disabled={loading}
          />
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2, textAlign: 'left' }}>
            {error}
          </Alert>
        )}
        
        <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
          Si vous n'avez pas accès à votre application d'authentification, contactez l'administrateur.
        </Typography>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'center' }}>
        <Button 
          onClick={onClose} 
          color="inherit"
          disabled={loading}
          sx={{ mr: 2 }}
        >
          Annuler
        </Button>
        <Button
          variant="contained"
          onClick={handleVerify}
          disabled={loading || code.join('').length !== 6}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {loading ? 'Vérification...' : 'Vérifier'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TwoFactorVerification;

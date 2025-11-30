import React, { useState, useEffect, useCallback } from 'react';
import logo from '../../../../src/assets/images/logo-dark.png';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Button,
  Grid,
  Typography,
  useMediaQuery,
  CircularProgress,
  Alert,
  Link,
  IconButton,
  Fade
} from '@mui/material';
import { ArrowBack, Refresh } from '@mui/icons-material';

// API
import { verifyEmail, resendVerificationCode } from 'api/auth';

// Project imports
import AuthCardWrapper from 'views/pages/authentication/AuthCardWrapper';
import AuthWrapper1 from 'views/pages/authentication/AuthWrapper1';
import { gridSpacing } from 'store/constant';

// Composants
import OTPInput from 'components/OTPInput';

// Constantes
const RESEND_DELAY = 60; // 60 secondes avant de pouvoir renvoyer le code
const OTP_LENGTH = 6; // Longueur du code OTP

const EmailVerification = () => {
  const theme = useTheme();
  const matchDownSM = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  // États
  const [code, setCode] = useState(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [showResend, setShowResend] = useState(true);

  // Vérifier si les paramètres nécessaires sont présents
  useEffect(() => {
    console.log('useEffect de vérification des paramètres déclenché');
    console.log('searchParams:', Object.fromEntries(searchParams.entries()));
    console.log('location.state:', location.state);
    
    // S'assurer que le code est bien initialisé comme un tableau
    setCode(Array(OTP_LENGTH).fill(''));
    
    // Essayer d'abord de récupérer depuis les paramètres d'URL
    let userIdParam = searchParams.get('userId');
    let emailParam = searchParams.get('email');
    
    console.log('Paramètres de l\'URL - userId:', userIdParam, 'email:', emailParam);
    
    // Si pas dans l'URL, vérifier dans l'état de navigation
    if (!userIdParam || !emailParam) {
      console.log('Paramètres non trouvés dans l\'URL, vérification de l\'état de navigation...');
      
      // Essayer de récupérer depuis l'état de navigation
      const state = location.state || {};
      userIdParam = state.userId || state.user?.id; // Vérifier les deux formats possibles
      emailParam = state.email;
      
      console.log('Paramètres de l\'état - userId:', userIdParam, 'email:', emailParam);
    }
    
    // Vérifier si on a au moins l'email, qui est le plus important
    if (emailParam) {
      console.log('Configuration du composant avec les paramètres disponibles...');
      
      // Mettre à jour l'email même si le userId est manquant
      setEmail(emailParam);
      
      // Si on a un userId, on le définit
      if (userIdParam) {
        setUserId(userIdParam);
      } else {
        console.warn('Avertissement: userId manquant, mais l\'email est présent');
        // On peut continuer sans userId pour permettre la vérification par email uniquement
        // ou afficher un message à l'utilisateur selon les besoins
      }
      
      startCountdown(RESEND_DELAY);
      
      // Afficher un message de succès si un message est fourni
      if (location.state?.message) {
        console.log('Message de succès détecté:', location.state.message);
        setSuccess(location.state.message);
      } else if (location.state?.from === 'register') {
        console.log('Redirection depuis l\'inscription détectée');
        setSuccess('Un code de vérification a été envoyé à votre adresse email.');
      }
    } else {
      console.warn('Email manquant, redirection vers la page d\'inscription');
      
      // Ne pas rediriger immédiatement pour éviter les boucles de redirection
      const timer = setTimeout(() => {
        navigate('/register', { 
          replace: true,
          state: { 
            error: 'Veuvez compléter le processus d\'inscription pour recevoir un code de vérification.',
            from: 'verification',
            // Conserver l'email s'il est disponible
            ...(emailParam ? { email: emailParam } : {})
          } 
        });
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [navigate, searchParams, location.state]);

  // Gérer le compte à rebours
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0) {
      setShowResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const startCountdown = useCallback((seconds) => {
    setCountdown(seconds);
    setShowResend(false);
    setResendSuccess('');
  }, []);

  // Gérer la mise à jour du code OTP
  const handleCodeChange = (newCode) => {
    // S'assurer que newCode est un tableau avant de le définir
    if (Array.isArray(newCode)) {
      setCode(newCode);
      if (error) setError('');
    } else {
      console.error('Le code OTP doit être un tableau');
      setCode(Array(OTP_LENGTH).fill(''));
    }
  };

  // Gérer la soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const otpCode = code.join('');
    
    // Validation côté client
    if (otpCode.length !== OTP_LENGTH) {
      setError(`Veuillez entrer un code à ${OTP_LENGTH} chiffres`);
      return;
    }
    
    if (!/^\d+$/.test(otpCode)) {
      setError('Le code ne doit contenir que des chiffres');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      // Utiliser l'email pour la vérification (plus fiable que le userId qui peut être manquant)
      const response = await verifyEmail({
        email: email,
        otp: otpCode
      });
      
      if (response.data?.success) {
        setSuccess('Votre email a été vérifié avec succès ! Redirection...');
        
        // Rediriger vers la page de connexion après un court délai
        setTimeout(() => {
          navigate('/login', { 
            replace: true,
            state: { 
              from: 'verification',
              message: 'Votre compte a été activé avec succès. Vous pouvez maintenant vous connecter.',
              email: email
            } 
          });
        }, 2000);
      } else {
        setError(response.message || 'Le code est incorrect ou a expiré. Veuillez réessayer.');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Une erreur est survenue lors de la vérification';
      setError(errorMessage);
      
      // Si le code a expiré, proposer d'en renvoyer un nouveau
      if (errorMessage.includes('expiré') || errorMessage.includes('invalide')) {
        setShowResend(true);
      }
    } finally {
      setLoading(false);
    }
  };

  // Renvoyer le code de vérification
  const handleResendCode = async () => {
    if (countdown > 0) {
      setError(`Veuillez patienter ${countdown} secondes avant de demander un nouveau code`);
      return;
    }
    
    try {
      setResendLoading(true);
      setResendSuccess('');
      setError('');
      
      const response = await resendVerificationCode(userId);
      
      if (response.success) {
        setResendSuccess('Un nouveau code a été envoyé à votre adresse email');
        startCountdown(RESEND_DELAY);
        
        // Effacer les champs du code
        setCode(Array(OTP_LENGTH).fill(''));
      } else {
        setError(response.message || 'Une erreur est survenue lors de l\'envoi du code');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Une erreur est survenue lors de l\'envoi du code';
      setError(errorMessage);
      
      // Si le token a expiré, rediriger vers la page d'inscription
      if (errorMessage.includes('token') && errorMessage.includes('expiré')) {
        setTimeout(() => {
          navigate('/register', { 
            replace: true,
            state: { 
              error: 'Votre session a expiré. Veuvez-vous vous réinscrire ?',
              email: email
            } 
          });
        }, 3000);
      }
    } finally {
      setResendLoading(false);
    }
  };
  
  // Retourner à la page précédente
  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <AuthWrapper1>
      <Grid container direction="column" justifyContent="flex-end" sx={{ minHeight: '100vh' }}>
        <Grid item xs={12}>
          <Grid container justifyContent="center" alignItems="center" sx={{ minHeight: 'calc(100vh - 68px)' }}>
            <Grid item sx={{ m: { xs: 1, sm: 3 }, mb: 0 }}>
              <AuthCardWrapper>
                <Grid container spacing={2} alignItems="center" justifyContent="center">
                  <Grid item xs={12} sx={{ mb: 3, textAlign: 'center' }}>
                    <Link href="#">
                      <img src={logo} alt="Logo" width="150" />
                    </Link>
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ p: { xs: 2, sm: 3, md: 4, xl: 5 }, position: 'relative' }}>
                      {/* Bouton de retour */}
                      <IconButton 
                        onClick={handleGoBack}
                        sx={{
                          position: 'absolute',
                          left: 16,
                          top: 16,
                          color: 'text.secondary'
                        }}
                      >
                        <ArrowBack />
                      </IconButton>
                      
                      <Box sx={{ 
                        textAlign: 'center',
                        mb: 4,
                        pt: 2,
                        px: { xs: 1, sm: 2 }
                      }}>
                        <Typography 
                          color={theme.palette.secondary.main} 
                          gutterBottom 
                          variant={matchDownSM ? 'h4' : 'h3'}
                          sx={{ fontWeight: 700, mb: 1.5 }}
                        >
                          Vérification d'email
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 0.5 }}>
                          Entrez le code à {OTP_LENGTH} chiffres envoyé à
                        </Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, wordBreak: 'break-all' }}>
                          {email}
                        </Typography>
                        
                        {location.state?.message && (
                          <Fade in={!!location.state?.message}>
                            <Alert severity="info" sx={{ mb: 2, textAlign: 'left' }}>
                              {location.state.message}
                            </Alert>
                          </Fade>
                        )}
                        
                        {error && (
                          <Fade in={!!error}>
                            <Alert severity="error" sx={{ mb: 2, textAlign: 'left' }}>
                              {error}
                            </Alert>
                          </Fade>
                        )}
                        
                        {success && (
                          <Fade in={!!success}>
                            <Alert severity="success" sx={{ mb: 2, textAlign: 'left' }}>
                              {success}
                            </Alert>
                          </Fade>
                        )}
                        
                        {resendSuccess && (
                          <Fade in={!!resendSuccess}>
                            <Alert severity="success" sx={{ mb: 2, textAlign: 'left' }}>
                              {resendSuccess}
                            </Alert>
                          </Fade>
                        )}
                      </Box>
                      
                      <form onSubmit={handleSubmit}>
                        <Box sx={{ mb: 3, px: { xs: 0, sm: 2 } }}>
                          <OTPInput
                            value={code}
                            onChange={handleCodeChange}
                            length={OTP_LENGTH}
                            error={!!error}
                            disabled={loading}
                          />
                        </Box>
                        
                        <Grid container spacing={2} justifyContent="center">
                          <Grid item xs={12} sm={6}>
                            <Button
                              fullWidth
                              type="submit"
                              variant="contained"
                              color="primary"
                              disabled={loading || code.join('').length !== OTP_LENGTH}
                              sx={{ height: 48 }}
                            >
                              {loading ? (
                                <CircularProgress size={24} color="inherit" />
                              ) : (
                                'Vérifier le code'
                              )}
                            </Button>
                          </Grid>
                        </Grid>
                      </form>
                      
                      <Box sx={{ mt: 3, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Vous n'avez pas reçu de code ?
                        </Typography>
                        <Button
                          variant="text"
                          color="primary"
                          onClick={handleResendCode}
                          disabled={!showResend || resendLoading}
                          startIcon={resendLoading ? <CircularProgress size={16} /> : <Refresh />}
                        >
                          {resendLoading ? 'Envoi en cours...' : 'Renvoyer le code'}
                          {countdown > 0 && ` (${countdown}s)`}
                        </Button>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </AuthCardWrapper>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </AuthWrapper1>
  );
};

export default EmailVerification;

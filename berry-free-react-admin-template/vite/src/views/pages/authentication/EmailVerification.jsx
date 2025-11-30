import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Button,
  Grid,
  TextField,
  Typography,
  useMediaQuery,
  CircularProgress,
  Alert,
  Link,
  IconButton,
  InputAdornment,
  Fade
} from '@mui/material';
import { ArrowBack, Refresh } from '@mui/icons-material';

// API
import { verifyEmail, resendVerificationCode } from 'api/auth';

// Project imports
import AuthCardWrapper from 'views/pages/authentication/AuthCardWrapper';
import AuthWrapper1 from 'views/pages/authentication/AuthWrapper1';
import { gridSpacing } from 'store/constant';

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
    // Essayer d'abord de récupérer depuis les paramètres d'URL
    let userIdParam = searchParams.get('userId');
    let emailParam = searchParams.get('email');
    
    // Si pas dans l'URL, vérifier dans l'état de navigation
    if (!userIdParam || !emailParam) {
      userIdParam = location.state?.userId;
      emailParam = location.state?.email;
    }
    
    if (userIdParam && emailParam) {
      setUserId(userIdParam);
      setEmail(emailParam);
      startCountdown(RESEND_DELAY);
      
      // Afficher un message de succès si redirigé depuis l'inscription
      if (location.state?.from === 'register') {
        setSuccess('Un code de vérification a été envoyé à votre adresse email.');
      }
    } else {
      // Rediriger vers la page d'inscription avec un message d'erreur
      navigate('/register', { 
        replace: true,
        state: { 
          error: 'Veuvez compléter le processus d\'inscription pour recevoir un code de vérification.' 
        } 
      });
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

  // Gérer la saisie du code OTP
  const handleChange = (index, value) => {
    // N'autoriser que les chiffres
    if (value !== '' && !/^[0-9]$/.test(value)) {
      return;
    }
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    
    // Effacer les erreurs lors de la saisie
    if (error) setError('');
    
    // Passer au champ suivant ou précédent
    if (value !== '') {
      if (index < OTP_LENGTH - 1) {
        // Passer au champ suivant
        document.getElementById(`otp-${index + 1}`)?.focus();
      } else if (index === OTP_LENGTH - 1 && value) {
        // Si c'est le dernier champ et qu'une valeur est entrée, soumettre automatiquement
        handleSubmit({ preventDefault: () => {} });
      }
    } else if (value === '' && index > 0) {
      // Revenir au champ précédent si on efface
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };
  
  // Gérer les touches du clavier pour une meilleure navigation
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      // Si on efface un champ vide, aller au champ précédent
      document.getElementById(`otp-${index - 1}`)?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      // Flèche gauche
      e.preventDefault();
      document.getElementById(`otp-${index - 1}`)?.focus();
    } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      // Flèche droite
      e.preventDefault();
      document.getElementById(`otp-${index + 1}`)?.focus();
    } else if (e.key === ' ' || e.key === 'Spacebar') {
      // Empêcher le défilement avec la barre d'espace
      e.preventDefault();
    }
  };
  
  // Coller le code depuis le presse-papier
  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text/plain').trim();
    
    // Vérifier que les données collées sont un nombre à 6 chiffres
    if (/^\d{6}$/.test(pasteData)) {
      const newCode = pasteData.split('').slice(0, OTP_LENGTH);
      setCode([...newCode, ...Array(OTP_LENGTH - newCode.length).fill('')]);
      
      // Si le code est complet, soumettre automatiquement après un court délai
      if (newCode.length === OTP_LENGTH) {
        setTimeout(() => {
          handleSubmit({ preventDefault: () => {} });
        }, 100);
      }
    } else {
      setError('Veuillez coller un code à 6 chiffres');
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
      
      const response = await verifyEmail(userId, otpCode);
      
      if (response.success) {
        setSuccess('Votre email a été vérifié avec succès ! Redirection...');
        
        // Rediriger vers la page de connexion après un court délai
        setTimeout(() => {
          navigate('/login', { 
            replace: true,
            state: { 
              from: 'verification',
              message: 'Votre compte a été activé avec succès. Vous pouvez maintenant vous connecter.',
              email: email // Pré-remplir l'email sur la page de connexion
            } 
          });
        }, 2000);
      } else {
        setError(response.message || 'Le code est incorrect ou a expiré. Veuillez réessayer.');
        
        // Mettre en surbrillance les champs en cas d'erreur
        const inputs = document.querySelectorAll('input[type="text"]');
        inputs.forEach(input => {
          input.style.borderColor = theme.palette.error.main;
          setTimeout(() => {
            input.style.borderColor = '';
          }, 1000);
        });
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
        
        // Donner le focus au premier champ
        setTimeout(() => {
          document.getElementById('otp-0')?.focus();
        }, 100);
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

  // Styles pour les champs de code OTP
  const otpInputStyle = {
    width: '100%',
    '& .MuiOutlinedInput-root': {
      height: '60px',
      width: '100%',
      fontSize: '1.5rem',
      textAlign: 'center',
      '& input': {
        textAlign: 'center',
        padding: theme.spacing(1.5),
      },
      '&:hover fieldset': {
        borderColor: theme.palette.primary.main,
      },
      '&.Mui-focused fieldset': {
        borderColor: theme.palette.primary.main,
        borderWidth: '2px',
      },
    },
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
                      <img src="/assets/images/logo-dark.png" alt="Logo" width="150" />
                    </Link>
                  </Grid>
                  <Grid item xs={12}>
                    <Grid container direction={matchDownSM ? 'column-reverse' : 'row'} alignItems="center" justifyContent="center">
                    </Grid>
                  </Grid>
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
                  <Grid container spacing={{ xs: 1, sm: 2 }} justifyContent="center" sx={{ mb: 3, px: { xs: 0, sm: 2 } }}>
                    {Array.from({ length: OTP_LENGTH }).map((_, index) => (
                      <Grid item xs={4} sm={3} md={2} key={index}>
                        <TextField
                          id={`otp-${index}`}
                          type="text"
                          inputProps={{
                            maxLength: 1,
                            inputMode: 'numeric',
                            pattern: '[0-9]*',
                            autoComplete: 'one-time-code',
                          }}
                          value={code[index]}
                          onChange={(e) => handleChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(index, e)}
                          onPaste={index === 0 ? handlePaste : undefined}
                          onFocus={(e) => e.target.select()}
                          disabled={loading}
                          sx={otpInputStyle}
                          autoFocus={index === 0 && !code[0]}
                        />
                      </Grid>
                    ))}
                  </Grid>
                  
                  <Box sx={{ mt: 4, mb: 3 }}>
                    <Button
                      color="primary"
                      disabled={loading || code.join('').length !== OTP_LENGTH}
                      fullWidth
                      size="large"
                      type="submit"
                      variant="contained"
                      sx={{
                        py: 1.5,
                        fontSize: '1rem',
                        fontWeight: 600,
                        textTransform: 'none',
                        borderRadius: 2,
                        boxShadow: 'none',
                        '&:hover': {
                          boxShadow: theme.shadows[3],
                        },
                        '&.Mui-disabled': {
                          backgroundColor: theme.palette.primary.light,
                          color: 'white',
                          opacity: 0.7,
                        },
                      }}
                    >
                      {loading ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        'Vérifier le code'
                      )}
                    </Button>
                  </Box>
                </form>
                
                <Box sx={{ textAlign: 'center', mt: 4, mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    Vous n'avez pas reçu de code ?
                  </Typography>
                  <Button
                    color="primary"
                    variant="outlined"
                    disabled={!showResend || resendLoading}
                    onClick={handleResendCode}
                    startIcon={resendLoading ? <CircularProgress size={20} color="inherit" /> : <Refresh />}
                    sx={{
                      minWidth: 200,
                      py: 1,
                      borderRadius: 2,
                      textTransform: 'none',
                      '&.Mui-disabled': {
                        borderColor: 'transparent',
                        color: 'text.disabled',
                      },
                    }}
                  >
                    {countdown > 0 
                      ? `Renvoyer (${countdown}s)` 
                      : resendLoading ? 'Envoi en cours...' : 'Renvoyer le code'}
                  </Button>
                  {countdown > 0 && (
                    <Typography 
                      variant="caption" 
                      color="text.secondary" 
                      display="block" 
                      sx={{ mt: 1.5, fontSize: '0.75rem' }}
                    >
                      Un nouveau code pourra être demandé dans {countdown} seconde{countdown > 1 ? 's' : ''}
                    </Typography>
                  )}
                </Box>

                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="textSecondary">
                    Vous avez déjà un compte ?{' '}
                    <Link href="/login" color="primary" sx={{ textDecoration: 'none' }}>
                      Se connecter
                    </Link>
                  </Typography>
                </Box>
              </Box>
            </AuthCardWrapper>
          </Grid>
        </Grid>
      </Grid>
    </AuthWrapper1>
  );
};

export default EmailVerification;

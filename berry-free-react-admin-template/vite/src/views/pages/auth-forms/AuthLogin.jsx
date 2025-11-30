import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

// material-ui
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { styled } from '@mui/material/styles';
import Paper from '@mui/material/Paper';

// project imports
import AnimateButton from 'ui-component/extended/AnimateButton';
import CustomFormControl from 'ui-component/extended/Form/CustomFormControl';
import { useAuth } from 'contexts/auth';
import { AuthLayout } from 'layout/AuthLayout';

// assets
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

// image
import loginImage from 'assets/images/auth/auth-bg.webp';

// styled components
const SideImage = styled(Box)(({ theme }) => ({
  backgroundImage: `url(${loginImage})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  padding: theme.spacing(8),
  color: 'white',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1,
  },
  '& > *': {
    position: 'relative',
    zIndex: 2,
  },
}));

const FormContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(6, 4),
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  height: '100%',
  width: '100%',
  maxWidth: 400,
  margin: '0 auto',
  boxShadow: 'none',
  backgroundColor: 'transparent',
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(4, 2),
    maxWidth: '100%',
  },
}));

// ===============================|| JWT - LOGIN ||=============================== //

export default function AuthLogin() {
  const [checked, setChecked] = useState(true);
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Pre-fill email if coming from registration
    if (location.state?.email) {
      setEmail(location.state.email);
    }
    // Afficher le message de succès s'il est présent
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Effacer le message après 5 secondes
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { signin, loading } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  
  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Réinitialiser les erreurs précédentes
    
    // Validation des champs
    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setIsLoading(true);
    
    try {
      await signin(email, password);
      navigate('/');
    } catch (error) {
      console.error('Erreur de connexion détaillée:', error);
      
      // Gestion des erreurs spécifiques
      if (error.code === 'INVALID_CREDENTIALS') {
        setError('Email ou mot de passe incorrect');
      } else if (error.code === 'EMAIL_NOT_VERIFIED') {
        setError('Veuvez vérifier votre adresse email avant de vous connecter');
        // Rediriger vers la page de vérification d'email
        navigate('/pages/verification-email', { 
          state: { 
            email: email,
            message: 'Un email de vérification a été envoyé à votre adresse email.'
          } 
        });
      } else if (error.code === 'NETWORK_ERROR') {
        setError('Erreur de connexion. Vérifiez votre connexion internet.');
      } else {
        setError('Une erreur est survenue lors de la connexion. Veuillez réessayer.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Side Image - Plus large */}
      <Box sx={{ display: { xs: '80%', lg: '50%' }, width: '60%' }}>
        <SideImage>
          <Box>
            {/* <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
              Bienvenue sur Notre Plateforme
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, maxWidth: '80%' }}>
              Gérez votre compte en toute simplicité et accédez à toutes les fonctionnalités de notre plateforme.
            </Typography> */}
          </Box>
        </SideImage>
      </Box>

      {/* Login Form - Plus étroit */}
      <Box sx={{ 
        width: { xs: 'none', lg: 'flex' },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'background.paper',
        p: 3,
        margin: '0 auto'
      }}>
        <FormContainer elevation={0}>
          <Stack spacing={3} sx={{ width: '100%' }}>
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
                Bienvenue
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Entrez vos identifiants pour accéder à votre compte
              </Typography>
              
              {/* Affichage des messages d'erreur */}
              {error && (
                <Typography 
                  color="error" 
                  variant="body2" 
                  sx={{ 
                    mt: 2, 
                    p: 1.5, 
                    backgroundColor: 'error.lighter',
                    borderRadius: 1,
                    borderLeft: '4px solid',
                    borderColor: 'error.main'
                  }}
                >
                  {error}
                </Typography>
              )}
              
              {/* Affichage des messages de succès */}
              {successMessage && (
                <Typography 
                  color="success.main" 
                  variant="body2" 
                  sx={{ 
                    mt: 2, 
                    p: 1.5, 
                    backgroundColor: 'success.lighter',
                    borderRadius: 1,
                    borderLeft: '4px solid',
                    borderColor: 'success.main'
                  }}
                >
                  {successMessage}
                </Typography>
              )}
            </Box>

            <form onSubmit={handleSubmit} style={{ width: '100%' }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <CustomFormControl fullWidth>
                    <InputLabel htmlFor="email">Email</InputLabel>
                    <OutlinedInput
                      id="email"
                      type="email"
                      name="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      size="small"
                    />
                  </CustomFormControl>
                </Grid>
                <Grid item xs={12}>
                  <CustomFormControl fullWidth>
                    <InputLabel htmlFor="password">Mot de passe</InputLabel>
                    <OutlinedInput
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      size="small"
                      endAdornment={
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={handleClickShowPassword}
                            onMouseDown={handleMouseDownPassword}
                            edge="end"
                            size="large"
                          >
                            {showPassword ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      }
                    />
                  </CustomFormControl>
                </Grid>
                <Grid item xs={12} sx={{ mt: -1 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={checked}
                          onChange={(event) => setChecked(event.target.checked)}
                          name="checked"
                          color="secondary"
                          size="small"
                        />
                      }
                      label={
                        <Typography variant="body2">Se souvenir de moi</Typography>
                      }
                    />
                    <Typography
                      component={Link}
                      to="/forgot-password"
                      variant="body2"
                      color="secondary"
                      sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                    >
                      Mot de passe oublié ?
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={12}>
                  <AnimateButton>
                    <Button
                      disableElevation
                      fullWidth
                      size="large"
                      type="submit"
                      variant="contained"
                      color="secondary"
                      disabled={isLoading}
                      startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
                    >
                      {isLoading ? 'Connexion en cours...' : 'Se connecter'}
                    </Button>
                  </AnimateButton>
                </Grid>
                <Grid item xs={12}>
                  
                  {successMessage && (
                    <Box sx={{ 
                      backgroundColor: 'success.light',
                      color: 'success.contrastText',
                      p: 2,
                      mb: 2,
                      borderRadius: 1
                    }}>
                      {successMessage}
                    </Box>
                  )}
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                    Vous n'avez pas de compte ?{' '}
                    <Link
                      to="/register"
                      style={{
                        color: 'secondary.main',
                        fontWeight: 600,
                        textDecoration: 'none',
                        '&:hover': { textDecoration: 'underline' }
                      }}
                    >
                      S'inscrire
                    </Link>
                  </Typography>
                </Grid>
              </Grid>
            </form>
          </Stack>
        </FormContainer>
      </Box>
    </Box>
  );
}

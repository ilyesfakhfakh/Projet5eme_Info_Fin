import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// material-ui
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { styled } from '@mui/material/styles';
import Paper from '@mui/material/Paper';

// project imports
import AnimateButton from 'ui-component/extended/AnimateButton';
import CustomFormControl from 'ui-component/extended/Form/CustomFormControl';
import { strengthColor, strengthIndicator } from 'utils/password-strength';
import { useAuth } from 'contexts/auth';

// assets
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
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
  padding: theme.spacing(4, 4),
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  width: '100%',
  maxWidth: '1200px',
  margin: '20px auto',
  boxShadow: 'none',
  backgroundColor: 'transparent',
  overflowY: 'auto',
  maxHeight: 'calc(100vh - 40px)',
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(3, 2),
    maxWidth: '100%',
  },
  '& .fixed-width-select, & .fixed-width-date': {
    '& .MuiSelect-select, & .MuiOutlinedInput-input': {
      minWidth: '200px',
      width: '100%',
      boxSizing: 'border-box',
    },
    '&.MuiFormControl-root': {
      width: '100%',
    }
  },
  '& .form-section': {
    marginBottom: theme.spacing(4),
    '&:last-child': {
      marginBottom: 0
    },
    '& .section-title': {
      color: theme.palette.primary.main,
      fontWeight: 600,
      marginBottom: theme.spacing(2),
      paddingBottom: theme.spacing(1),
      borderBottom: `1px solid ${theme.palette.divider}`
    }
  },
  '& .form-row': {
    marginBottom: theme.spacing(2),
    '&:last-child': {
      marginBottom: 0
    }
  }
}));

// ===========================|| JWT - REGISTER ||=========================== //

export default function AuthRegister() {
  const [showPassword, setShowPassword] = useState(false);
  const [checked, setChecked] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    postalCode: '',
    dateOfBirth: '',
    timezone: 'UTC',
    language: 'fr',
    currency: 'TND',
    role: 'user',
    profile_picture: null,
    profilePicturePreview: ''
  });
  const [errors, setErrors] = useState({});

  const navigate = useNavigate();
  const { signup, loading } = useAuth();

  const [strength, setStrength] = useState(0);
  const [level, setLevel] = useState();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          profile_picture: file,
          profilePicturePreview: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;

    if (type === 'file') {
      handleFileChange(e);
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const changePassword = (value) => {
    const temp = strengthIndicator(value);
    setStrength(temp);
    setLevel(strengthColor(temp));
  };

  useEffect(() => {
    changePassword('123456');
  }, []);

  // Fonction de validation d'email
  const isValidEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const {
        firstName,
        lastName,
        email,
        password,
        confirmPassword,
        username,
        phone,
        address,
        city,
        country,
        postalCode,
        dateOfBirth,
        timezone,
        language,
        currency,
        role,
        profile_picture
      } = formData;

      if (password !== confirmPassword) {
        throw new Error('Les mots de passe ne correspondent pas');
      }

      // Valider les champs requis
      if (!email) {
        throw new Error('L\'email est requis');
      }
      
      // Valider le format de l'email
      if (!isValidEmail(email)) {
        throw new Error('Veuillez entrer une adresse email valide');
      }
      if (!password) {
        throw new Error('Le mot de passe est requis');
      }
      if (!firstName) {
        throw new Error('Le prénom est requis');
      }
      if (!lastName) {
        throw new Error('Le nom est requis');
      }

      // Créer un objet FormData
      const formDataToSend = new FormData();

      // Ajouter les champs au FormData
      const userData = {
        username: username || (email || '').split('@')[0] || `${firstName}${lastName}`.toLowerCase(),
        email: email.trim(),
        password: password,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone || null,
        address: address || null,
        city: city || null,
        country: country || null,
        postal_code: postalCode || null,
        date_of_birth: dateOfBirth || null,
        timezone: timezone || 'UTC',
        language: language || 'fr',
        currency: currency || 'TND',
        user_type: 'novice',
        role: role || 'user'
      };

      // Ajouter les champs au FormData
      Object.entries(userData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formDataToSend.append(key, value);
        }
      });

      // Ajouter le fichier s'il existe
      if (profile_picture) {
        formDataToSend.append('profile_picture', profile_picture);
      }

      // Envoyer les données au serveur
      const response = await signup(formDataToSend);

      // Si on arrive ici, c'est que l'inscription a réussi
      const userEmail = formDataToSend.get('email') || userData.email;

      // Afficher un message de succès
      const successMessage = response?.message || 'Un email de vérification a été envoyé à votre adresse email.';

      // Rediriger vers la page de vérification d'email avec l'ID utilisateur et l'email
      navigate('/verify-email', {
        replace: true, 
        state: {
          userId: response?.data?.user?.id,
          email: userEmail,
          message: successMessage
        }
      });
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);

      // Afficher un message d'erreur plus convivial
      let errorMessage = 'Une erreur est survenue lors de l\'inscription';

      if (error.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
        // Si l'email n'est pas vérifié mais que l'utilisateur est enregistré
        const userId = error.response.data.userId;
        const email = error.response.data.email;

        // Rediriger vers la page de vérification d'email
        navigate('/verify-email', {
          replace: true,
          state: {
            userId,
            email,
            message: 'Un email de vérification a été envoyé à votre adresse email.'
          }
        });
        return;
      } else {
        // Pour les autres erreurs, afficher le message d'erreur
        errorMessage = error.response?.data?.message || error.message || errorMessage;
        alert(errorMessage);
      }
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Side Image - Plus large */}
      <Box sx={{ display: { xs: 'none', lg: 'block' }, width: '85%' }}>
        <SideImage />
      </Box>

      {/* Formulaire d'inscription */}
      <Box sx={{
        width: '62%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        backgroundColor: 'background.paper',
        p: { xs: 2, sm: 3, md: 4 },
        overflowY: 'auto',
        maxHeight: '100vh',
      }}>
        <FormContainer elevation={0}>
          <Stack spacing={1} sx={{ width: '100%' }}>
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
                Créer un compte
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Remplissez le formulaire pour créer votre compte
              </Typography>
            </Box>

            <form onSubmit={handleSubmit}>
              <div className="form-section">
                <Typography variant="h6" className="section-title">Informations personnelles</Typography>

                {/* Ligne 1 : Prénom, Nom, Email */}
                <Grid container spacing={2} sx={{ mb: 3, width: '100%' }}>
                  <Grid item xs={12} sm={6} md={4} >
                    <CustomFormControl fullWidth required>
                      <InputLabel htmlFor="first-name">Prénom</InputLabel>
                      <OutlinedInput
                        id="first-name"
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        error={!!errors.firstName}
                        aria-describedby="first-name-error"
                      />
                      {errors.firstName && (
                        <Typography color="error" variant="caption" id="first-name-error">
                          {errors.firstName}
                        </Typography>
                      )}
                    </CustomFormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4} >
                    <CustomFormControl fullWidth required>
                      <InputLabel htmlFor="last-name">Nom</InputLabel>
                      <OutlinedInput
                        id="last-name"
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        error={!!errors.lastName}
                        aria-describedby="last-name-error"
                      />
                      {errors.lastName && (
                        <Typography color="error" variant="caption" id="last-name-error">
                          {errors.lastName}
                        </Typography>
                      )}
                    </CustomFormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4} >
                    <CustomFormControl fullWidth required>
                      <InputLabel htmlFor="email">Email</InputLabel>
                      <OutlinedInput
                        id="email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        error={!!errors.email}
                        aria-describedby="email-error"
                      />
                      {errors.email && (
                        <Typography color="error" variant="caption" id="email-error">
                          {errors.email}
                        </Typography>
                      )}
                    </CustomFormControl>
                  </Grid>
                </Grid>

                {/* Ligne 2 : Téléphone, Date de naissance, Nom d'utilisateur */}
                <Grid container spacing={2} sx={{ mb: 3, maxWidth: '100%' }}>
                  <Grid item xs={12} sm={6} md={4} >
                    <CustomFormControl fullWidth required>
                      <InputLabel htmlFor="phone">Téléphone</InputLabel>
                      <OutlinedInput
                        id="phone"
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        error={!!errors.phone}
                        aria-describedby="phone-error"
                      />
                      {errors.phone && (
                        <Typography color="error" variant="caption" id="phone-error">
                          {errors.phone}
                        </Typography>
                      )}
                    </CustomFormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4} >
                    <CustomFormControl fullWidth required>
                      <InputLabel htmlFor="date-of-birth" shrink>Date de naissance</InputLabel>
                      <OutlinedInput
                        id="date-of-birth"
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleChange}
                        error={!!errors.dateOfBirth}
                        aria-describedby="date-of-birth-error"
                        label="Date de naissance"
                        notched
                      />
                      {errors.dateOfBirth && (
                        <Typography color="error" variant="caption" id="date-of-birth-error">
                          {errors.dateOfBirth}
                        </Typography>
                      )}
                    </CustomFormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4} >
                    <CustomFormControl fullWidth required>
                      <InputLabel htmlFor="username">Nom d'utilisateur</InputLabel>
                      <OutlinedInput
                        id="username"
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        error={!!errors.username}
                        aria-describedby="username-error"
                      />
                      {errors.username && (
                        <Typography color="error" variant="caption" id="username-error">
                          {errors.username}
                        </Typography>
                      )}
                    </CustomFormControl>
                  </Grid>
                </Grid>

                {/* Ligne 3 : Adresse, Ville, Code postal */}
                <Grid container spacing={2} sx={{ mb: 3, maxWidth: '100%' }}>
                  <Grid item xs={12} sm={6} md={4} >
                    <CustomFormControl fullWidth required>
                      <InputLabel htmlFor="address">Adresse</InputLabel>
                      <OutlinedInput
                        id="address"
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        error={!!errors.address}
                        aria-describedby="address-error"
                      />
                      {errors.address && (
                        <Typography color="error" variant="caption" id="address-error">
                          {errors.address}
                        </Typography>
                      )}
                    </CustomFormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4} >
                    <CustomFormControl fullWidth required>
                      <InputLabel htmlFor="city">Ville</InputLabel>
                      <OutlinedInput
                        id="city"
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        error={!!errors.city}
                        aria-describedby="city-error"
                      />
                      {errors.city && (
                        <Typography color="error" variant="caption" id="city-error">
                          {errors.city}
                        </Typography>
                      )}
                    </CustomFormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4} >
                    <CustomFormControl fullWidth required>
                      <InputLabel htmlFor="postal-code">Code postal</InputLabel>
                      <OutlinedInput
                        id="postal-code"
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleChange}
                        error={!!errors.postalCode}
                        aria-describedby="postal-code-error"
                      />
                      {errors.postalCode && (
                        <Typography color="error" variant="caption" id="postal-code-error">
                          {errors.postalCode}
                        </Typography>
                      )}
                    </CustomFormControl>
                  </Grid>
                </Grid>

                {/* Ligne 4 : Pays, Type de compte, Photo de profil */}
                <Grid container spacing={2} sx={{ mb: 3, maxWidth: '100%' }}>
                  <Grid item xs={12} sm={6} md={4} >
                    <CustomFormControl fullWidth required>
                      <InputLabel htmlFor="country">Pays</InputLabel>
                      <OutlinedInput
                        id="country"
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        error={!!errors.country}
                        aria-describedby="country-error"
                      />
                      {errors.country && (
                        <Typography color="error" variant="caption" id="country-error">
                          {errors.country}
                        </Typography>
                      )}
                    </CustomFormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4} sx={{ minWidth: '200px' }}>
                    <CustomFormControl fullWidth>
                      <InputLabel id="role-label">Rôle</InputLabel>
                      <Select
                        labelId="role-label"
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        label="Rôle"
                        required
                      >
                        <MenuItem value="user">Utilisateur</MenuItem>
                        <MenuItem value="trader">Trader</MenuItem>
                        <MenuItem value="moderator">Modérateur</MenuItem>
                      </Select>
                    </CustomFormControl>
                  </Grid>

                  <Grid item xs={12} sm={6} md={4} >
                    <CustomFormControl fullWidth>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <input
                          accept="image/*"
                          style={{ display: 'none' }}
                          id="profile-picture-upload"
                          type="file"
                          onChange={handleChange}
                          name="profile_picture"
                        />
                        <label htmlFor="profile-picture-upload">
                          <Button
                            variant="outlined"
                            component="span"
                            fullWidth
                            sx={{
                              height: '56px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '1px dashed',
                              borderColor: 'divider',
                              '&:hover': {
                                borderColor: 'primary.main',
                                backgroundColor: 'action.hover'
                              }
                            }}
                          >
                            {formData.profilePicturePreview ? (
                              <Box
                                component="img"
                                src={formData.profilePicturePreview}
                                alt="Aperçu"
                                sx={{
                                  maxWidth: '40px',
                                  maxHeight: '40px',
                                  borderRadius: '50%',
                                  mr: 1
                                }}
                              />
                            ) : (
                              <Typography variant="body2" color="textSecondary">
                                Photo de profil
                              </Typography>
                            )}
                          </Button>
                        </label>
                      </Box>
                    </CustomFormControl>
                  </Grid>
                </Grid>
              </div>

              <div className="form-section">
                <Typography variant="h6" className="section-title">Sécurité</Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <CustomFormControl fullWidth required>
                      <InputLabel htmlFor="password">Mot de passe</InputLabel>
                      <OutlinedInput
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={(e) => {
                          handleChange(e);
                          changePassword(e.target.value);
                        }}
                        error={!!errors.password}
                        aria-describedby="password-error"
                        endAdornment={
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={handleClickShowPassword}
                              onMouseDown={handleMouseDownPassword}
                              edge="end"
                              size="large"
                            >
                              {showPassword ? <Visibility /> : <VisibilityOff />}
                            </IconButton>
                          </InputAdornment>
                        }
                      />
                      {errors.password && (
                        <Typography color="error" variant="caption" id="password-error">
                          {errors.password}
                        </Typography>
                      )}
                      {strength !== 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Grid container spacing={1} alignItems="center">
                            <Grid item>
                              <Box
                                style={{ backgroundColor: level?.color }}
                                sx={{ width: 85, height: 8, borderRadius: '7px' }}
                              />
                            </Grid>
                            <Grid item>
                              <Typography variant="caption" color="textSecondary">
                                {level?.label}
                              </Typography>
                            </Grid>
                          </Grid>
                        </Box>
                      )}
                    </CustomFormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <CustomFormControl fullWidth required>
                      <InputLabel htmlFor="confirm-password">Confirmer le mot de passe</InputLabel>
                      <OutlinedInput
                        id="confirm-password"
                        type={showPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        error={!!errors.confirmPassword}
                        aria-describedby="confirm-password-error"
                        endAdornment={
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle confirm password visibility"
                              onClick={handleClickShowPassword}
                              onMouseDown={handleMouseDownPassword}
                              edge="end"
                              size="large"
                            >
                              {showPassword ? <Visibility /> : <VisibilityOff />}
                            </IconButton>
                          </InputAdornment>
                        }
                      />
                      {errors.confirmPassword && (
                        <Typography color="error" variant="caption" id="confirm-password-error">
                          {errors.confirmPassword}
                        </Typography>
                      )}
                    </CustomFormControl>
                  </Grid>
                </Grid>
              </div>

              <div className="form-section">
                <Grid container spacing={2} sx={{ mb: 1 }}>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={checked}
                          onChange={(event) => setChecked(event.target.checked)}
                          name="checked"
                          color="secondary"
                        />
                      }
                      label={
                        <Typography variant="subtitle2">
                          J'accepte les conditions d'utilisation et la politique de confidentialité.
                        </Typography>
                      }
                    />
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
                        disabled={!checked || loading}
                        sx={{ py: 1.5, fontWeight: 600 }}
                      >
                        {loading ? 'Inscription en cours...' : "S'inscrire"}
                      </Button>
                    </AnimateButton>
                  </Grid>
                </Grid>
              </div>

            </form>

            <Box sx={{ textAlign: 'start', mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Vous avez déjà un compte ?{' '}
                <Link
                  to="/login"
                  style={{
                    color: 'secondary.main',
                    fontWeight: 600,
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  Se connecter
                </Link>
              </Typography>
            </Box>
          </Stack>
        </FormContainer>
      </Box>
    </Box>
  );
}

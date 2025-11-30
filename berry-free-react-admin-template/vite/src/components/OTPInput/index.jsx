import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { TextField, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const OTPInput = ({ value = [], onChange, length = 6, error = false, disabled = false }) => {
  // S'assurer que value est toujours un tableau
  const safeValue = Array.isArray(value) ? value : [];
  const theme = useTheme();
  const inputRefs = useRef([]);

  // Focus sur le premier champ au chargement
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index, e) => {
    if (typeof onChange !== 'function') {
      console.error('La propriété onChange est requise et doit être une fonction');
      return;
    }

    const newValue = [...safeValue];
    const inputValue = e.target.value;

    // N'autoriser que les chiffres
    if (inputValue !== '' && !/^\d$/.test(inputValue)) {
      return;
    }

    // Mettre à jour la valeur à l'index spécifié
    newValue[index] = inputValue;
    
    // Remplir avec des chaînes vides si nécessaire
    while (newValue.length < length) {
      newValue.push('');
    }
    
    // Tronquer si nécessaire
    const finalValue = newValue.slice(0, length);
    
    try {
      onChange(finalValue);
      
      // Passer au champ suivant si une valeur a été entrée
      if (inputValue !== '' && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    } catch (err) {
      console.error('Erreur lors de la mise à jour du code OTP:', err);
    }
  };

  const handleKeyDown = (index, e) => {
    // Gérer la touche retour arrière
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    // Gérer les flèches gauche/droite
    else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
    // Gérer la touche d'espace
    else if (e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    
    try {
      const pasteData = e.clipboardData.getData('text/plain').trim();
      
      // Vérifier que les données collées sont un nombre à X chiffres
      if (new RegExp(`^\\d{1,${length}}$`).test(pasteData)) {
        const newValue = pasteData.split('').slice(0, length);
        
        // Remplir avec des chaînes vides si nécessaire
        while (newValue.length < length) {
          newValue.push('');
        }
        
        // Appeler onChange avec la nouvelle valeur
        if (typeof onChange === 'function') {
          onChange(newValue);
        }
        
        // Déplacer le focus sur le dernier champ rempli
        const lastFilledIndex = Math.min(pasteData.length, length) - 1;
        if (inputRefs.current[lastFilledIndex]) {
          inputRefs.current[lastFilledIndex].focus();
        }
      }
    } catch (err) {
      console.error('Erreur lors du collage du code OTP:', err);
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
      {Array.from({ length }).map((_, index) => (
        <TextField
          key={index}
          inputRef={(el) => (inputRefs.current[index] = el)}
          type="text"
          value={safeValue[index] || ''}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          inputProps={{
            maxLength: 1,
            style: { textAlign: 'center', fontSize: '1.25rem' },
            'aria-label': `Chiffre ${index + 1} sur ${length}`,
            inputMode: 'numeric',
            pattern: '[0-9]*',
            'data-testid': `otp-input-${index}`,
          }}
          disabled={disabled}
          error={!!error}
          sx={{
            width: '50px',
            '& .MuiOutlinedInput-root': {
              height: '60px',
              '& input': {
                textAlign: 'center',
                padding: '8px',
                '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
                  WebkitAppearance: 'none',
                  margin: 0,
                },
                '&[type=number]': {
                  MozAppearance: 'textfield',
                },
              },
              '&:hover fieldset': {
                borderColor: theme.palette.primary.main,
              },
              '&.Mui-focused fieldset': {
                borderColor: theme.palette.primary.main,
                borderWidth: '2px',
              },
              ...(error && {
                '& fieldset': {
                  borderColor: theme.palette.error.main,
                  borderWidth: '2px',
                },
              }),
            },
          }}
        />
      ))}
    </Box>
  );
};

OTPInput.propTypes = {
  /** Tableau de chaînes représentant la valeur actuelle du code OTP */
  value: (props, propName, componentName) => {
    if (!Array.isArray(props[propName])) {
      return new Error(
        `La prop '${propName}' fournie à '${componentName}' doit être un tableau.`
      );
    }
    return null;
  },
  /** Fonction de rappel appelée lorsque la valeur change */
  onChange: PropTypes.func.isRequired,
  /** Longueur du code OTP (par défaut: 6) */
  length: PropTypes.number,
  /** Message d'erreur à afficher */
  error: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.bool,
  ]),
  /** Désactive tous les champs de saisie */
  disabled: PropTypes.bool,
};

OTPInput.defaultProps = {
  length: 6,
  error: false,
  disabled: false,
  value: [],
};

export default OTPInput;

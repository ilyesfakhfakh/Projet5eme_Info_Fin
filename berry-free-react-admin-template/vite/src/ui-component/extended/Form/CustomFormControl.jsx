import { styled } from '@mui/material/styles';
import FormControl from '@mui/material/FormControl';

const CustomFormControl = styled(FormControl)(({ theme }) => ({
  marginTop: 12,
  marginBottom: 12,
  width: '100%',
  '& > label': {
    top: 23,
    left: 0,
    color: theme.palette.text.primary,
    fontSize: '0.9rem',
    fontWeight: 500,
    '&.Mui-focused': {
      color: theme.palette.primary.main,
    },
    '&[data-shrink="false"]': {
      top: 5,
      fontSize: '1rem'
    }
  },
  '& > div > input': {
    padding: '32px 16px 12px !important',
    fontSize: '1rem',
    '&[type="date"]': {
      padding: '32px 16px 12px !important',
      height: '60px',
      display: 'flex',
      alignItems: 'center',
      '&::-webkit-calendar-picker-indicator': {
        marginLeft: 0,
        padding: 8
      }
    }
  },
  '& legend': {
    display: 'none'
  },
  '& .MuiOutlinedInput-root': {
    borderRadius: 8,
    backgroundColor: theme.palette.background.paper,
    '& fieldset': {
      borderColor: theme.palette.grey[300],
      borderWidth: 1,
      top: 0,
      transition: 'all 0.2s ease-in-out'
    },
    '&:hover fieldset': {
      borderColor: theme.palette.primary.main,
      boxShadow: `0 0 0 1px ${theme.palette.primary.main}`
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main,
      borderWidth: '1px',
      boxShadow: `0 0 0 2px ${theme.palette.primary.light}`
    },
    '&.Mui-error fieldset': {
      borderColor: theme.palette.error.main,
    },
    '&.Mui-error.Mui-focused fieldset': {
      borderColor: theme.palette.error.main,
      boxShadow: `0 0 0 2px ${theme.palette.error.light}`
    },
    // Styles pour les Select
    '&.MuiInputBase-root': {
      '& .MuiSelect-select': {
        padding: '32px 16px 12px',
        height: '60px !important',
        display: 'flex',
        alignItems: 'center',
        backgroundColor: theme.palette.background.paper,
        fontSize: '1rem'
      },
      '& .MuiSelect-icon': {
        marginTop: '8px',
        color: theme.palette.text.secondary,
        right: 12
      },
      '&:hover .MuiSelect-icon': {
        color: theme.palette.primary.main
      }
    },
    // Styles spécifiques pour le champ de date
    '& input[type="date"]': {
      padding: '32px 16px 12px !important',
      height: '60px',
      display: 'flex',
      alignItems: 'center',
      cursor: 'pointer',
      '&::-webkit-calendar-picker-indicator': {
        marginLeft: 0,
        padding: 8,
        cursor: 'pointer',
        opacity: 0.7,
        '&:hover': {
          opacity: 1
        }
      }
    }
  }
}));

export default CustomFormControl;

import { Box, Chip, Tooltip, alpha } from '@mui/material';
import { Circle, SignalCellularAlt } from '@mui/icons-material';
import { keyframes } from '@mui/system';

const pulse = keyframes`
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
`;

const RealTimeIndicator = ({ isConnected, updateCount = 0 }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Tooltip title={isConnected ? 'Connecté au serveur temps réel' : 'Déconnecté'}>
        <Chip
          icon={
            <Circle
              sx={{
                fontSize: 12,
                animation: isConnected ? `${pulse} 2s ease-in-out infinite` : 'none',
                color: isConnected ? 'success.main' : 'error.main'
              }}
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <SignalCellularAlt sx={{ fontSize: 16 }} />
              {isConnected ? 'LIVE' : 'OFFLINE'}
            </Box>
          }
          size="small"
          variant="outlined"
          color={isConnected ? 'success' : 'error'}
          sx={{
            fontWeight: 'bold',
            borderWidth: 2,
            backgroundColor: (theme) =>
              isConnected ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.error.main, 0.1)
          }}
        />
      </Tooltip>
      {isConnected && updateCount > 0 && (
        <Chip label={`${updateCount} mises à jour`} size="small" color="primary" variant="outlined" />
      )}
    </Box>
  );
};

export default RealTimeIndicator;

import { keyframes } from '@mui/system';

// 🎨 ANIMATIONS
export const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(1080deg); }
`;

export const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

export const glow = keyframes`
  0%, 100% { box-shadow: 0 0 5px rgba(255, 215, 0, 0.5), 0 0 10px rgba(255, 215, 0, 0.3); }
  50% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.8), 0 0 30px rgba(255, 215, 0, 0.5); }
`;

export const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
`;

export const shimmer = keyframes`
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
`;

export const bounce = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
`;

export const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

export const sparkle = keyframes`
  0%, 100% { opacity: 0; transform: scale(0); }
  50% { opacity: 1; transform: scale(1); }
`;

// 🎨 STYLES
export const wheelContainerStyle = {
  position: 'relative',
  width: 300,
  height: 300,
  margin: '0 auto',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  borderRadius: '50%',
  boxShadow: '0 20px 60px rgba(0,0,0,0.3), 0 0 40px rgba(102, 126, 234, 0.5)',
  border: '8px solid #fff',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
    pointerEvents: 'none'
  }
};

export const betButtonStyle = (color, isActive) => ({
  position: 'relative',
  overflow: 'hidden',
  background: isActive 
    ? `linear-gradient(135deg, ${color} 0%, ${adjustColor(color, -30)} 100%)`
    : `linear-gradient(135deg, ${adjustColor(color, 20)} 0%, ${color} 100%)`,
  color: '#fff',
  fontWeight: 'bold',
  fontSize: '1.1rem',
  padding: '20px',
  borderRadius: '16px',
  border: isActive ? `3px solid ${color}` : 'none',
  boxShadow: isActive 
    ? `0 8px 32px ${color}80, 0 0 20px ${color}60`
    : `0 4px 15px ${color}40`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  transform: isActive ? 'scale(1.05)' : 'scale(1)',
  '&:hover': {
    transform: 'scale(1.08) translateY(-2px)',
    boxShadow: `0 12px 40px ${color}80, 0 0 30px ${color}80`,
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
    transition: 'left 0.5s',
  },
  '&:hover::after': {
    left: '100%',
  }
});

export const cardGradientStyle = {
  background: 'linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%)',
  borderRadius: '24px',
  boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
  overflow: 'hidden',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: 'linear-gradient(90deg, #667eea, #764ba2, #f093fb, #667eea)',
    backgroundSize: '200% 100%',
    animation: `${shimmer} 3s linear infinite`,
  }
};

export const statCardStyle = (color) => ({
  background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
  borderRadius: '20px',
  padding: '24px',
  border: `2px solid ${color}30`,
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: `0 12px 24px ${color}30`,
    border: `2px solid ${color}60`,
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    top: '-50%',
    right: '-50%',
    width: '100%',
    height: '100%',
    background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`,
    animation: `${float} 6s ease-in-out infinite`,
  }
});

export const spinButtonStyle = (spinning) => ({
  background: spinning 
    ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  color: '#fff',
  fontWeight: 'bold',
  fontSize: '1.5rem',
  padding: '24px 48px',
  borderRadius: '50px',
  boxShadow: spinning
    ? '0 8px 32px rgba(245, 87, 108, 0.5)'
    : '0 8px 32px rgba(79, 172, 254, 0.5)',
  border: 'none',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s ease',
  animation: spinning ? `${pulse} 1s infinite` : 'none',
  '&:hover:not(:disabled)': {
    transform: 'scale(1.05)',
    boxShadow: '0 12px 48px rgba(79, 172, 254, 0.7)',
  },
  '&:disabled': {
    opacity: 0.7,
    cursor: 'not-allowed',
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '0',
    height: '0',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.5)',
    transform: 'translate(-50%, -50%)',
    transition: 'width 0.6s, height 0.6s',
  },
  '&:active::before': {
    width: '300px',
    height: '300px',
  }
});

export const jackpotStyle = {
  background: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
  borderRadius: '20px',
  padding: '32px',
  textAlign: 'center',
  boxShadow: '0 15px 35px rgba(253, 160, 133, 0.4)',
  position: 'relative',
  overflow: 'hidden',
  animation: `${glow} 2s ease-in-out infinite`,
  '&::before': {
    content: '"💎"',
    position: 'absolute',
    top: '10px',
    right: '10px',
    fontSize: '2rem',
    opacity: 0.3,
    animation: `${float} 3s ease-in-out infinite`,
  }
};

export const resultChipStyle = (type) => {
  const colors = {
    RED: { bg: '#ef5350', shadow: '0 4px 20px rgba(239, 83, 80, 0.5)' },
    BLACK: { bg: '#424242', shadow: '0 4px 20px rgba(66, 66, 66, 0.5)' },
    GREEN: { bg: '#66bb6a', shadow: '0 4px 20px rgba(102, 187, 106, 0.5)' },
    SECTOR: { bg: '#ab47bc', shadow: '0 4px 20px rgba(171, 71, 188, 0.5)' },
    STOCK: { bg: '#ffa726', shadow: '0 4px 20px rgba(255, 167, 38, 0.5)' },
  };
  
  const color = colors[type] || colors.RED;
  
  return {
    background: color.bg,
    color: '#fff',
    fontWeight: 'bold',
    fontSize: '0.95rem',
    padding: '8px 16px',
    borderRadius: '12px',
    boxShadow: color.shadow,
    animation: `${bounce} 0.6s ease-out`,
  };
};

// Helper function
function adjustColor(color, amount) {
  const clamp = (num) => Math.min(255, Math.max(0, num));
  const num = parseInt(color.replace('#', ''), 16);
  const r = clamp((num >> 16) + amount);
  const g = clamp(((num >> 8) & 0x00FF) + amount);
  const b = clamp((num & 0x0000FF) + amount);
  return `#${(0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1)}`;
}

export default {
  spin,
  pulse,
  glow,
  float,
  shimmer,
  bounce,
  fadeInUp,
  sparkle,
  wheelContainerStyle,
  betButtonStyle,
  cardGradientStyle,
  statCardStyle,
  spinButtonStyle,
  jackpotStyle,
  resultChipStyle
};

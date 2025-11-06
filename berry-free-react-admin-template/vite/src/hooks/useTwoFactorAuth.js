import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setUser } from '../store/slices/auth';
import { checkTwoFactorRequirement, verifyTwoFactorCode as verify2FACode } from '../api/auth';

const useTwoFactorAuth = () => {
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [is2FALoading, setIs2FALoading] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [is2FAVerified, setIs2FAVerified] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  // Vérifier si la 2FA est requise
  const check2FARequirement = useCallback(async () => {
    if (!user?.id) return false;
    
    try {
      setIs2FALoading(true);
      const response = await checkTwoFactorRequirement();
      
      if (response?.success) {
        setRequires2FA(response.requiresTwoFactor === true);
        setIs2FAVerified(response.isVerified === true);
        
        // Si la 2FA est requise mais pas encore vérifiée, afficher la modale
        if (response.requiresTwoFactor && !response.isVerified) {
          setShow2FAModal(true);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Erreur lors de la vérification 2FA:', error);
      return false;
    } finally {
      setIs2FALoading(false);
    }
  }, [user?.id]);

  // Vérifier le code 2FA
  const verifyTwoFactorCode = useCallback(async (code) => {
    if (!user?.id) return { success: false, message: 'Utilisateur non connecté' };
    
    try {
      setIs2FALoading(true);
      setTwoFactorError('');
      
      const response = await verify2FACode({
        userId: user.id,
        code
      });
      
      if (response?.success) {
        // Mettre à jour l'état de l'utilisateur si nécessaire
        if (response.user) {
          dispatch(setUser(response.user));
        }
        
        setIs2FAVerified(true);
        setShow2FAModal(false);
        return { success: true };
      } else {
        setTwoFactorError(response?.message || 'Code de vérification invalide');
        return { success: false, message: response?.message || 'Code de vérification invalide' };
      }
    } catch (error) {
      console.error('Erreur lors de la vérification 2FA:', error);
      setTwoFactorError('Une erreur est survenue lors de la vérification');
      return { 
        success: false, 
        message: error.response?.data?.message || 'Une erreur est survenue lors de la vérification' 
      };
    } finally {
      setIs2FALoading(false);
    }
  }, [dispatch, user?.id]);

  // Vérifier la 2FA au chargement si nécessaire
  useEffect(() => {
    // Ne vérifier que si l'utilisateur est connecté
    if (user?.id && !is2FAVerified) {
      check2FARequirement();
    }
  }, [user?.id, is2FAVerified, check2FARequirement]);

  // Rediriger si la 2FA est requise mais pas vérifiée
  useEffect(() => {
    if (requires2FA && !is2FAVerified && !show2FAModal) {
      // Si l'utilisateur est sur la page de connexion, ne pas rediriger
      if (!location.pathname.includes('/login')) {
        navigate('/login', { 
          state: { 
            from: location,
            requires2FA: true
          } 
        });
      }
    }
  }, [requires2FA, is2FAVerified, show2FAModal, navigate, location]);

  return {
    // État
    show2FAModal,
    setShow2FAModal,
    is2FALoading,
    twoFactorError,
    requires2FA,
    is2FAVerified,
    
    // Méthodes
    check2FARequirement,
    verifyTwoFactorCode,
    
    // Composant de vérification
    TwoFactorVerification: ({ onSuccess, ...props }) => (
      <TwoFactorVerification
        open={show2FAModal}
        onClose={() => setShow2FAModal(false)}
        onSuccess={() => {
          setIs2FAVerified(true);
          if (onSuccess) onSuccess();
        }}
        userId={user?.id}
        {...props}
      />
    )
  };
};

export default useTwoFactorAuth;

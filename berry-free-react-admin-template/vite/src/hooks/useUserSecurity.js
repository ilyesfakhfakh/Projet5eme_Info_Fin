import { useState, useCallback } from 'react';
import { 
  getUserSecurityInfo, 
  toggleTwoFactorAuth 
} from '../api/users';

export const useUserSecurity = (userId) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState(null);

  const handleError = useCallback((error) => {
    console.error('Erreur de sécurité:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Une erreur est survenue';
    setError(errorMessage);
    return errorMessage;
  }, []);

  const handleSuccess = useCallback((message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 5000);
    return message;
  }, []);

  const refreshSecurityInfo = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const securityInfo = await getUserSecurityInfo(userId);
      return securityInfo;
    } catch (error) {
      handleError(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [userId, handleError]);

  const handleToggle2FA = useCallback(async (enable) => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      const response = await toggleTwoFactorAuth(userId, enable);
      
      if (!response) {
        throw new Error('Aucune réponse du serveur');
      }

      const message = `Authentification à deux facteurs ${enable ? 'activée' : 'désactivée'}`;
      const securityInfo = await refreshSecurityInfo();
      
      if (enable && (response.qrCodeUrl || response.data?.qrCodeUrl)) {
        setQrCodeUrl(response.qrCodeUrl || response.data.qrCodeUrl);
      }

      handleSuccess(message);
      return { success: true, securityInfo };
    } catch (error) {
      return { success: false, message: handleError(error) };
    } finally {
      setIsLoading(false);
    }
  }, [userId, refreshSecurityInfo, handleSuccess, handleError]);

  const handleResendVerification = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/users/${userId}/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Échec de l\'envoi de l\'email de vérification');
      }

      const data = await response.json();
      const securityInfo = await refreshSecurityInfo();
      
      handleSuccess('Email de vérification envoyé avec succès');
      return { success: true, securityInfo };
    } catch (error) {
      return { success: false, message: handleError(error) };
    } finally {
      setIsLoading(false);
    }
  }, [userId, refreshSecurityInfo, handleSuccess, handleError]);

  return {
    isLoading,
    error,
    success,
    qrCodeUrl,
    handleToggle2FA,
    handleResendVerification,
    refreshSecurityInfo,
    setError,
    setSuccess
  };
};

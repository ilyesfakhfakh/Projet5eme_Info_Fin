const speakeasy = require('speakeasy');
const db = require('../../models');

/**
 * Vérifie un code 2FA pour un utilisateur
 */
async function verifyTwoFactorCode(req, res) {
  const { userId, code } = req.body;
  
  if (!userId || !code) {
    return res.status(400).json({
      success: false,
      message: 'L\'ID utilisateur et le code sont requis'
    });
  }

  try {
    const user = await db.users.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    if (!user.two_factor_enabled || !user.two_factor_secret) {
      return res.status(400).json({
        success: false,
        message: 'L\'authentification à deux facteurs n\'est pas activée pour cet utilisateur'
      });
    }

    // Vérifier le code
    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token: code,
      window: 1 // Tolère un délai d'une période (30s) avant/après
    });

    if (!verified) {
      // Enregistrer la tentative échouée
      await db.audit_logs.create({
        user_id: userId,
        action: '2FA_VERIFICATION_FAILED',
        resource_type: 'USER',
        resource_id: userId,
        details: {
          ip_address: req.ip,
          user_agent: req.headers['user-agent']
        },
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });

      return res.status(400).json({
        success: false,
        message: 'Code de vérification invalide ou expiré'
      });
    }

    // Enregistrer la vérification réussie
    await db.audit_logs.create({
      user_id: userId,
      action: '2FA_VERIFICATION_SUCCESS',
      resource_type: 'USER',
      resource_id: userId,
      details: {
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      },
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });

    // Si c'est la première vérification, marquer l'email comme vérifié
    if (!user.email_verified) {
      await user.update({ email_verified: true });
    }

    // Créer ou mettre à jour la session
    if (req.session) {
      req.session.twoFactorVerified = true;
      req.session.twoFactorVerifiedAt = new Date();
    }

    res.json({
      success: true,
      message: 'Code de vérification valide',
      requiresTwoFactor: false
    });

  } catch (error) {
    console.error('Erreur lors de la vérification 2FA:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification du code',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
}

/**
 * Vérifie si l'utilisateur a besoin d'une authentification 2FA
 */
async function checkTwoFactorRequirement(req, res) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Non authentifié'
    });
  }

  try {
    const user = await db.users.findByPk(req.user.user_id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Vérifier si la 2FA est requise
    const requires2FA = user.two_factor_enabled === true;
    
    // Vérifier si la 2FA a déjà été vérifiée dans cette session
    const isVerified = req.session.twoFactorVerified === true;
    
    // Vérifier si la vérification est toujours valide (24h)
    const verificationValid = req.session.twoFactorVerifiedAt && 
      (new Date() - new Date(req.session.twoFactorVerifiedAt)) < 24 * 60 * 60 * 1000;

    res.json({
      success: true,
      requiresTwoFactor: requires2FA && (!isVerified || !verificationValid),
      isVerified: isVerified && verificationValid
    });

  } catch (error) {
    console.error('Erreur lors de la vérification 2FA:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification 2FA',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
}

module.exports = {
  verifyTwoFactorCode,
  checkTwoFactorRequirement
};

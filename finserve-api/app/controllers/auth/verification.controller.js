const db = require('../../models');
const emailService = require('../../services/email.service');

// Vérifier le code OTP
async function verifyEmail(req, res) {
  try {
    const { userId, otpCode } = req.body;

    // Vérifier que les champs requis sont présents
    if (!userId || !otpCode) {
      return res.status(400).json({ 
        success: false,
        message: 'L\'ID utilisateur et le code OTP sont requis' 
      });
    }

    // Vérifier le code OTP
    const result = await emailService.verifyOTP(userId, otpCode);

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: result.message || 'Code OTP invalide ou expiré'
      });
    }

    // Générer un token JWT pour la connexion automatique
    const user = await db.users.findByPk(userId, {
      include: [{
        model: db.roles,
        as: 'roles',
        through: { attributes: [] },
        attributes: ['role_id', 'role_name']
      }]
    });

    // Générer le token JWT
    const token = signToken(user);

    res.json({
      success: true,
      message: 'Email vérifié avec succès',
      token,
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        isEmailVerified: true,
        roles: user.roles.map(r => r.role_name)
      }
    });
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'email :', error);
    res.status(500).json({
      success: false,
      message: 'Une erreur est survenue lors de la vérification de l\'email'
    });
  }
}

// Renvoyer le code OTP
async function resendVerificationCode(req, res) {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'L\'ID utilisateur est requis'
      });
    }

    // Récupérer l'utilisateur
    const user = await db.users.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Vérifier si l'email est déjà vérifié
    if (user.is_email_verified) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà vérifié'
      });
    }

    // Vérifier que l'utilisateur a un email valide
    if (!user.email) {
      return res.status(400).json({
        success: false,
        message: 'Aucune adresse email trouvée pour cet utilisateur'
      });
    }

    // Renvoyer un nouveau code OTP
    await emailService.resendOTP(user);

    res.json({
      success: true,
      message: `Un nouveau code de vérification a été envoyé à ${user.email}`
    });
  } catch (error) {
    console.error('Erreur lors du renvoi du code de vérification :', error);
    
    // Messages d'erreur plus précis selon le type d'erreur
    let errorMessage = 'Une erreur est survenue lors de l\'envoi du code de vérification';
    let statusCode = 500;
    
    if (error.message.includes('adresse email')) {
      errorMessage = error.message;
      statusCode = 400;
    }
    
    res.status(statusCode).json({
      success: false,
      message: errorMessage
    });
  }
}

// Fonction utilitaire pour générer un token JWT
function signToken(user) {
  const jwt = require('jsonwebtoken');
  const { randomUUID } = require('crypto');
  
  const secret = process.env.JWT_SECRET || 'dev_secret_change_me';
  const payload = {
    sub: user.user_id,
    roles: (user.roles || []).map((r) => r.role_name || r),
  };
  
  return jwt.sign(payload, secret, { 
    expiresIn: '7d', 
    jwtid: randomUUID() 
  });
}

module.exports = {
  verifyEmail,
  resendVerificationCode
};

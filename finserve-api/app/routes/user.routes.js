const express = require('express');
const router = express.Router();
const { authenticateJWT, hasRole } = require('../middlewares/auth.middleware');
const userController = require('../controllers/user.controller');

// Middleware pour vérifier si l'utilisateur est propriétaire du compte ou administrateur
const checkOwnershipOrAdmin = (req, res, next) => {
  // Si l'utilisateur est admin, il peut accéder à toutes les routes
  if (req.user.roles.includes('ADMIN')) {
    return next();
  }
  
  // Sinon, vérifier si l'utilisateur est propriétaire du compte
  if (req.user.user_id === req.params.id) {
    return next();
  }
  
  // Si ni l'un ni l'autre, refuser l'accès
  return res.status(403).json({
    success: false,
    message: 'Accès non autorisé. Vous devez être propriétaire du compte ou administrateur.'
  });
};

// Routes protégées par authentification
router.use(authenticateJWT);

// Récupérer les informations d'un utilisateur (propriétaire ou admin)
router.get('/:id', checkOwnershipOrAdmin, userController.getUserById);

// Mettre à jour les paramètres de sécurité (propriétaire ou admin)
router.put('/:id/security', checkOwnershipOrAdmin, userController.updateUserSecurity);

// Réinitialiser le mot de passe (propriétaire ou admin)
router.post('/:id/reset-password', checkOwnershipOrAdmin, userController.resetUserPassword);

// Activer/désactiver l'authentification à deux facteurs (propriétaire uniquement)
router.post('/:id/two-factor', (req, res, next) => {
  // Seul le propriétaire du compte peut gérer sa 2FA
  if (req.user.user_id !== req.params.id) {
    return res.status(403).json({
      success: false,
      message: 'Accès non autorisé. Vous ne pouvez gérer que votre propre authentification à deux facteurs.'
    });
  }
  next();
}, userController.toggleTwoFactorAuth);

module.exports = router;

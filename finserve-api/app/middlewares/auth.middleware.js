const jwt = require('jsonwebtoken');
const db = require('../models');

// Middleware pour vérifier le token JWT
exports.authenticateJWT = async (req, res, next) => {
  // Récupérer le token depuis les en-têtes
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    
    try {
      // Vérifier et décoder le token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');

      // Récupérer l'utilisateur depuis la base de données
      const user = await db.users.findByPk(decoded.sub, {
        attributes: { exclude: ['password'] } // Exclure le mot de passe
      });
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }
      
      // Ajouter l'utilisateur à la requête pour les middlewares suivants
      req.user = user;
      next();
    } catch (error) {
      console.error('Erreur d\'authentification JWT:', error);
      return res.status(401).json({
        success: false,
        message: 'Token invalide ou expiré',
        error: error.message
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      message: 'Token d\'authentification manquant ou invalide'
    });
  }
};

// Middleware pour vérifier les rôles
exports.hasRole = (roles = []) => {
  // Convertir en tableau si ce n'est pas déjà le cas
  if (typeof roles === 'string') {
    roles = [roles];
  }
  
  return (req, res, next) => {
    // Vérifier si l'utilisateur a un des rôles requis
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      });
    }
    
    // Vérifier si l'utilisateur a un des rôles requis
    const hasRequiredRole = roles.some(role => req.user.roles.includes(role));
    
    if (!hasRequiredRole) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé. Rôle requis: ' + roles.join(', ')
      });
    }
    
    next();
  };
};

// Middleware pour vérifier si l'utilisateur est propriétaire ou admin
exports.checkOwnershipOrAdmin = (req, res, next) => {
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

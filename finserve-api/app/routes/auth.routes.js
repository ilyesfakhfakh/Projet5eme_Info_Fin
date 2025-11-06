const express = require('express');
const router = express.Router();
const { register, login, me, logout, verifyEmail, resendVerificationCode } = require('../controllers/auth.controller');
const { sessionActivityMiddleware } = require('../middlewares/auth/session-activity.middleware');
const { jwtVerify } = require('../middlewares/auth/jwt.middleware');
const { upload, handleMulterError } = require('../../config/multer.config');

router.use(sessionActivityMiddleware);

// Route d'inscription avec gestion de l'upload de photo de profil
router.post('/register', 
  (req, res, next) => {
    console.log('=== DÉBUT DU TRAITEMENT DE LA REQUÊTE ===');
    console.log('En-têtes de la requête:', JSON.stringify(req.headers, null, 2));
    console.log('Corps de la requête (raw):', req.body);
    console.log('Fichiers reçus (avant multer):', req.file);
    
    // Vérifier le content-type
    const contentType = req.headers['content-type'] || '';
    console.log('Content-Type de la requête:', contentType);
    
    if (!contentType.includes('multipart/form-data')) {
      console.error('ERREUR: Content-Type incorrect. Attendu: multipart/form-data');
      return res.status(400).json({ 
        success: false, 
        message: 'Le Content-Type doit être multipart/form-data' 
      });
    }
    
    next();
  },
  // Middleware Multer pour gérer l'upload du fichier
  upload.single('profile_picture'),
  
  // Middleware pour vérifier le résultat de l'upload
  (req, res, next) => {
    console.log('=== APRÈS UPLOAD MULTER ===');
    console.log('Fichier après upload:', req.file);
    console.log('Données du formulaire après upload:', req.body);
    
    if (!req.file) {
      console.log('Aucun fichier n\'a été téléchargé');
    } else {
      console.log('Fichier téléchargé avec succès:', {
        originalname: req.file.originalname,
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size
      });
    }
    
    next();
  },
  
  // Gestion des erreurs Multer
  handleMulterError,
  
  // Contrôleur d'inscription
  register
);

router.post('/login', login);

// Route protégée pour récupérer les informations de l'utilisateur connecté
router.get('/me', jwtVerify(), me);

// Route de déconnexion
router.post('/logout', jwtVerify(), logout);

// Routes de vérification d'email
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationCode);

// Import des contrôleurs 2FA
const { 
  verifyTwoFactorCode, 
  checkTwoFactorRequirement 
} = require('../controllers/auth/two-factor.controller');

// Routes pour l'authentification à deux facteurs
router.post('/verify-2fa', verifyTwoFactorCode);
router.get('/check-2fa', jwtVerify(), checkTwoFactorRequirement);

module.exports = router;

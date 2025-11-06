const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Créer le dossier uploads s'il n'existe pas
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  console.log(`Création du dossier d'upload: ${uploadDir}`);
  fs.mkdirSync(uploadDir, { recursive: true });
} else {
  console.log(`Dossier d'upload trouvé: ${uploadDir}`);
}

// Configuration du stockage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log('Destination du fichier:', uploadDir);
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
    console.log('Nouveau fichier uploadé:', filename);
    cb(null, filename);
  }
});

// Filtre pour n'accepter que les images
const fileFilter = (req, file, cb) => {
  console.log('Vérification du type de fichier:', file.mimetype);
  if (file.mimetype.startsWith('image/')) {
    console.log('Type de fichier accepté:', file.mimetype);
    cb(null, true);
  } else {
    console.error('Type de fichier non autorisé:', file.mimetype);
    cb(new Error('Seules les images sont autorisées (JPEG, PNG, etc.)'), false);
  }
};

// Configuration de Multer
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // Limite de 5MB
  }
});

// Middleware pour gérer les erreurs de multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Une erreur de Multer s'est produite lors de l'upload
    console.error('Erreur Multer:', err);
    return res.status(400).json({ 
      success: false, 
      message: 'Erreur lors du téléchargement du fichier',
      error: err.message 
    });
  } else if (err) {
    // Une erreur inconnue s'est produite
    console.error('Erreur inconnue lors de l\'upload:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur lors du téléchargement du fichier',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
  // Si tout s'est bien passé, passer au middleware suivant
  next();
};

module.exports = { upload, handleMulterError };

const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const bcrypt = require('bcrypt');
const db = require('../models');
const emailService = require('../services/email.service');

const unlinkAsync = promisify(fs.unlink);

function signToken(user) {
  const secret = process.env.JWT_SECRET || 'dev_secret_change_me';
  const payload = {
    sub: user.user_id,
    roles: (user.roles || []).map((r) => r.role_name),
  };
  return jwt.sign(payload, secret, { expiresIn: '7d', jwtid: randomUUID() });
}

// Fonction utilitaire pour valider le format d'email
const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

async function register(req, res) {
  let profilePicturePath = null;
  const transaction = await db.sequelize.transaction();
  
  try {
    console.log('Requête reçue - Corps:', req.body);
    
    // Récupération des données du formulaire
    const formData = {
      email: req.body.email,
      password: req.body.password,
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      user_type: 'novice', // Toujours définir le type d'utilisateur à 'novice' par défaut
      role: req.body.role || 'user' // Récupérer le rôle du formulaire, 'user' par défaut
    };
    
    // Validation de l'email
    if (!formData.email || !isValidEmail(formData.email)) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez fournir une adresse email valide'
      });
    }
    
    // Vérifier si l'email existe déjà
    const existingUser = await db.users.findOne({
      where: { email: formData.email },
      transaction
    });
    
    if (existingUser) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: 'Un utilisateur avec cet email existe déjà' 
      });
    }

    // Ne pas hacher le mot de passe ici, cela sera fait par le hook beforeCreate du modèle
    // Gérer le téléchargement du fichier si présent
    if (req.file) {
      try {
        const fileExists = fs.existsSync(req.file.path);
        console.log('Le fichier a-t-il été enregistré ?', fileExists);
        if (fileExists) {
          profilePicturePath = '/uploads/' + req.file.filename;
          console.log('Chemin de la photo de profil:', profilePicturePath);
        } else {
          console.error('Erreur: Le fichier n\'a pas été correctement enregistré sur le serveur');
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du fichier:', error);
      }
    } else {
      console.log('Aucun fichier reçu dans la requête');
    }

    const {
      username,
      email,
      password,
      first_name,
      last_name,
      phone,
      address,
      city,
      country,
      postal_code,
      date_of_birth,
      timezone,
      language,
      currency,
      user_type
    } = req.body || {};
    // Champs obligatoires
    if (!req.body.username || !req.body.email || !req.body.password) {
      return res.status(400).json({ message: 'username, email et password sont requis' });
    }

    // Créer l'utilisateur - Le mot de passe sera haché par le hook beforeCreate
    const newUser = await db.users.create(
      {
        username: req.body.username,
        email: formData.email,
        password_hash: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: req.body.phone || null,
        address: req.body.address || null,
        city: req.body.city || null,
        country: req.body.country || null,
        postal_code: req.body.postal_code || null,
        date_of_birth: req.body.date_of_birth || null,
        timezone: req.body.timezone || 'UTC',
        language: req.body.language || 'fr',
        currency: req.body.currency || 'EUR',
        profile_picture: profilePicturePath, 
        is_active: true,
        registration_date: new Date(),
        user_type: 'novice', // Toujours définir le type d'utilisateur à 'novice'
        is_email_verified: false 
      },
      { transaction }
    );
    
    // Attribuer le rôle spécifié dans le formulaire
    let role = await db.roles.findOne({ 
      where: { role_name: formData.role.toUpperCase() },
      transaction
    });
    
    // Si le rôle spécifié n'existe pas, utiliser USER par défaut
    if (!role) {
      role = await db.roles.findOne({ 
        where: { role_name: 'USER' },
        transaction
      });
    }
    
    if (role) {
      await db.user_roles.create({ 
        user_id: newUser.user_id, 
        role_id: role.role_id 
      }, { transaction });
    }

    // Valider la transaction principale avant d'envoyer l'email
    await transaction.commit();
    
    // Générer un code OTP
    const otp = emailService.generateOTP();
    
    // Enregistrer le code OTP dans la base de données
    await db.email_verification_tokens.create({
      user_id: newUser.user_id,
      token: otp,
      expires_at: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes d'expiration
      is_used: false
    });
    
    // Envoyer l'email de vérification de manière asynchrone
    emailService.sendVerificationEmail(newUser.email, otp)
      .catch(error => {
        console.error('Erreur asynchrone lors de l\'envoi de l\'email de vérification:', error);
      });
    
    // Retourner la réponse immédiatement
    res.status(201).json({
      success: true,
      message: 'Inscription réussie ! Veuillez vérifier votre email pour activer votre compte.',
      user: {
        id: newUser.user_id,
        username: newUser.username,
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        profilePicture: newUser.profile_picture,
        isEmailVerified: newUser.is_email_verified,
        roles: role ? [role.role_name] : []
      }
    });
  } catch (e) {
    console.error('Erreur lors de l\'inscription:', e);
    
    // Annuler la transaction en cas d'erreur
    if (transaction.finished !== 'commit' && transaction.finished !== 'rollback') {
      await transaction.rollback();
    }
    
    // Supprimer le fichier téléchargé en cas d'erreur
    if (req.file) {
      try {
        await unlinkAsync(req.file.path);
      } catch (unlinkError) {
        console.error('Erreur lors de la suppression du fichier:', unlinkError);
      }
    }
    
    const errorMessage = e.message || 'Erreur lors de l\'inscription';
    res.status(500).json({ message: errorMessage });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    
    console.log('Tentative de connexion pour l\'email:', email);
    console.log('Données reçues:', { email, password: password ? '***' : 'non fourni' });

    // Vérifier si l'utilisateur existe
    const user = await db.users.findOne({
      where: { email },
      include: [
        {
          model: db.roles,
          as: 'roles',
          through: { attributes: [] },
          attributes: ['role_id', 'role_name']
        }
      ]
    });

    console.log('Utilisateur trouvé:', user ? 'Oui' : 'Non');

    if (!user) {
      console.log('Aucun utilisateur trouvé avec cet email');
      return res.status(401).json({ 
        success: false,
        code: 'INVALID_CREDENTIALS',
        message: 'Email ou mot de passe incorrect' 
      });
    }

    // Vérifier le mot de passe
    console.log('Vérification du mot de passe...');
    console.log('Mot de passe fourni:', password);
    console.log('Hash stocké:', user.password_hash);
    
    // Fonction utilitaire pour déboguer le hachage
    const debugBcrypt = async (password, hash) => {
      console.log('=== DÉBOGAGE BCRYPT ===');
      console.log('Mot de passe original:', password);
      console.log('Hash à vérifier:', hash);
      
      // Vérifier le format du hash
      const hashParts = hash.split('$');
      console.log('Format du hash:', hashParts[0] + '$' + hashParts[1] + '$' + hashParts[2].substring(0, 2) + '...');
      
      // Générer un nouveau hash avec le même sel
      const salt = hash.substring(0, 29); // Les 29 premiers caractères contiennent le sel
      console.log('Sel extrait:', salt);
      
      try {
        const newHash = await bcrypt.hash(password, salt);
        console.log('Nouveau hash généré:', newHash);
        console.log('Les hashs correspondent:', newHash === hash);
        
        // Vérifier avec bcrypt.compare
        const isValid = await bcrypt.compare(password, hash);
        console.log('bcrypt.compare résultat:', isValid);
        
        return isValid;
      } catch (error) {
        console.error('Erreur lors du hachage:', error);
        return false;
      }
    };
    
    // Utiliser la méthode validatePassword du modèle pour vérifier le mot de passe
    const isPasswordValid = await user.validatePassword(password);
    
    // Logs de débogage
    console.log('=== DÉBOGAGE AUTHENTIFICATION ===');
    console.log('Email fourni:', email);
    console.log('Longueur du mot de passe fourni:', password ? password.length : 0);
    console.log('Hash stocké (début):', user.password_hash ? user.password_hash.substring(0, 10) + '...' : 'non défini');
    console.log('Résultat de la validation:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('Échec de la validation du mot de passe');
      
      return res.status(401).json({ 
        success: false,
        code: 'INVALID_CREDENTIALS',
        message: 'Email ou mot de passe incorrect'
      });
    }
    
    // Vérification d'email désactivée pour le développement
    // if (!user.is_email_verified) {
    //   return res.status(403).json({
    //     code: 'EMAIL_NOT_VERIFIED',
    //     message: 'Veuillez vérifier votre adresse email avant de vous connecter',
    //     userId: user.user_id
    //   });
    // }

    // Politique: une seule session active par utilisateur
    const existing = await db.sessions.findOne({ where: { user_id: user.user_id, is_active: true } });
    if (existing) {
      const logout = await db.sessions.destroy({ where: { user_id: user.user_id, is_active: true } })
      // return res.status(423).json({ message: 'Une session est déjà active pour cet utilisateur. Veuillez vous déconnecter avant de vous reconnecter.' });
    }
    const token = signToken(user);
    const decoded = jwt.decode(token) || {};
    const jti = decoded.jti;
    try {
      await db.sessions.create({ session_id: jti, user_id: user.user_id, user_agent: req.headers['user-agent'], ip_address: req.ip, is_active: true });
    } catch (e) {
      // Ne bloque pas l'auth si l'écriture de session échoue
    }
    return res.json({ user, token, session_id: jti });
  } catch (e) {
    return res.status(500).json({ message: 'Erreur serveur', error: e.message });
  }
}

async function me(req, res) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    return res.json({ user: req.user });
  } catch (e) {
    return res.status(500).json({ message: 'Erreur serveur', error: e.message });
  }
}

async function logout(req, res) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    // Désactiver toutes les sessions actives de cet utilisateur pour garantir qu'aucune session ne reste ouverte
    await db.sessions.update(
      { is_active: false, expires_at: new Date() },
      { where: { user_id: req.user.user_id, is_active: true } }
    );
    return res.json({ message: 'Déconnexion réussie' });
  } catch (e) {
    return res.status(500).json({ message: 'Erreur serveur', error: e.message });
  }
}

async function verifyEmail(req, res) {
  const { email, otp } = req.body;
  const transaction = await db.sequelize.transaction();

  try {
    // Vérifier si l'utilisateur existe
    const user = await db.users.findOne({
      where: { email },
      transaction
    });

    if (!user) {
      await transaction.rollback();
      return res.status(404).json({ 
        success: false,
        message: 'Aucun compte trouvé avec cet email' 
      });
    }

    // Vérifier si l'email est déjà vérifié
    if (user.is_verified) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: 'Cet email est déjà vérifié' 
      });
    }

    // Vérifier le token de vérification
    const verificationToken = await db.email_verification_tokens.findOne({
      where: {
        user_id: user.user_id,
        token: otp,
        expires_at: { [db.Sequelize.Op.gt]: new Date() }
      },
      transaction
    });

    if (!verificationToken) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: 'Code OTP invalide ou expiré' 
      });
    }

    // Mettre à jour l'utilisateur comme vérifié
    await db.users.update(
      { is_verified: true },
      { where: { user_id: user.user_id }, transaction }
    );

    // Marquer le token comme utilisé au lieu de le supprimer pour l'audit
    await db.email_verification_tokens.update(
      { is_used: true },
      { 
        where: { token_id: verificationToken.token_id },
        transaction 
      }
    );

    await transaction.commit();
    
    // Retourner la réponse au format attendu par le frontend
    res.status(200).json({
      data: {
        success: true,
        message: 'Email vérifié avec succès',
        userId: user.user_id,
        email: user.email
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Erreur lors de la vérification de l\'email:', error);
    
    // Formater l'erreur pour le frontend
    const errorMessage = error.message || 'Une erreur est survenue lors de la vérification de l\'email';
    res.status(500).json({
      data: {
        success: false,
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
}

async function resendVerificationCode(req, res) {
  const { email } = req.body;
  const transaction = await db.sequelize.transaction();

  try {
    // Vérifier si l'utilisateur existe
    const user = await db.users.findOne({
      where: { email },
      transaction
    });

    if (!user) {
      await transaction.rollback();
      return res.status(404).json({ 
        success: false,
        message: 'Aucun compte trouvé avec cet email' 
      });
    }

    // Vérifier si l'email est déjà vérifié
    if (user.is_verified) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: 'Cet email est déjà vérifié' 
      });
    }

    // Supprimer les anciens tokens de vérification
    await db.email_verification_tokens.destroy({
      where: { user_id: user.user_id },
      transaction
    });

    // Générer un nouveau code OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // Expire dans 15 minutes

    // Enregistrer le nouveau token
    await db.email_verification_tokens.create({
      user_id: user.user_id,
      token: otp,
      expires_at: expiresAt
    }, { transaction });

    // Envoyer l'email de vérification
    await emailService.sendVerificationEmail(user.email, otp);

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: 'Un nouveau code de vérification a été envoyé à votre adresse email'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Erreur lors de l\'envoi du code de vérification:', error);
    res.status(500).json({
      success: false,
      message: 'Une erreur est survenue lors de l\'envoi du code de vérification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

module.exports = { register, login, me, logout, verifyEmail, resendVerificationCode };

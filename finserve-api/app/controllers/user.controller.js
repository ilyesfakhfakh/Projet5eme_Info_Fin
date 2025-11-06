const db = require('../models');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

/**
 * Récupère les informations d'un utilisateur par son ID avec les détails de sécurité
 */
async function getUserById(req, res) {
  try {
    const { id } = req.params;
    
    // Vérifier si l'utilisateur existe
    const user = await db.users.findByPk(id, {
      attributes: [
        'user_id',
        'username',
        'email',
        'first_name',
        'last_name',
        'profile_picture',
        'is_active',
        'is_locked',
        'login_attempts',
        'last_login_date',
        'email_verified',
        'two_factor_enabled',
        'created_at',
        'updated_at'
      ],
      include: [
        {
          model: db.sessions,
          as: 'sessions',
          where: { is_active: true },
          required: false,
          attributes: ['session_id', 'user_agent', 'ip_address', 'created_at', 'last_activity']
        },
        {
          model: db.roles,
          as: 'roles',
          through: { attributes: [] },
          attributes: ['role_name']
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Récupérer les logs d'audit récents
    const auditLogs = await db.audit_logs.findAll({
      where: { user_id: id },
      order: [['created_at', 'DESC']],
      limit: 10,
      attributes: ['action', 'status', 'ip_address', 'user_agent', 'created_at']
    });

    // Préparer la réponse
    const userData = user.get({ plain: true });
    
    const response = {
      ...userData,
      stats: {
        activity: {
          recent_actions: auditLogs.length,
          last_action: auditLogs[0]?.created_at || null
        },
        sessions: userData.sessions || []
      },
      audit_logs: auditLogs
    };

    res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des données utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des données utilisateur',
      error: error.message
    });
  }
}

/**
 * Met à jour les informations de sécurité d'un utilisateur
 */
async function updateUserSecurity(req, res) {
  const { id } = req.params;
  const updates = {};
  const transaction = await db.sequelize.transaction();

  try {
    // Vérifier si l'utilisateur existe
    const user = await db.users.findByPk(id, { transaction });
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Mettre à jour les champs de sécurité si fournis
    if (req.body.hasOwnProperty('is_active')) {
      updates.is_active = req.body.is_active;
    }
    
    if (req.body.hasOwnProperty('is_locked')) {
      updates.is_locked = req.body.is_locked;
    }
    
    if (req.body.hasOwnProperty('login_attempts')) {
      updates.login_attempts = req.body.login_attempts;
    }
    
    if (req.body.hasOwnProperty('two_factor_enabled')) {
      updates.two_factor_enabled = req.body.two_factor_enabled;
    }

    // Mettre à jour l'utilisateur
    await db.users.update(updates, {
      where: { user_id: id },
      transaction
    });

    await transaction.commit();
    
    res.json({
      success: true,
      message: 'Paramètres de sécurité mis à jour avec succès'
    });

  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    
    console.error('=== ERREUR DÉTAILLÉE updateUserSecurity ===');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    
    if (error.original) {
      console.error('=== ERREUR ORIGINALE ===');
      console.error('Message:', error.original.message);
      console.error('Code:', error.original.code);
      console.error('SQL State:', error.original.sqlState);
      console.error('SQL:', error.original.sql);
      console.error('Parameters:', error.original.parameters);
    }
    
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      ...(process.env.NODE_ENV === 'development' && {
        error: {
          message: error.message,
          ...(error.original && {
            originalMessage: error.original.message,
            code: error.original.code,
            sqlState: error.original.sqlState,
            sql: error.original.sql
          })
        }
      })
    });
  }
}

/**
 * Réinitialise le mot de passe d'un utilisateur
 */
async function resetUserPassword(req, res) {
  const { id } = req.params;
  const { newPassword, confirmPassword } = req.body;
  const transaction = await db.sequelize.transaction();

  try {
    // Validation des entrées
    if (!newPassword || !confirmPassword) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Veuillez fournir un nouveau mot de passe et le confirmer'
      });
    }

    if (newPassword !== confirmPassword) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Les mots de passe ne correspondent pas'
      });
    }

    // Vérifier si l'utilisateur existe
    const user = await db.users.findByPk(id, { transaction });
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Hacher le nouveau mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Mettre à jour le mot de passe
    await db.users.update(
      { password_hash: hashedPassword },
      { where: { user_id: id }, transaction }
    );

    // Ajouter une entrée dans les journaux d'audit
    await db.audit_logs.create({
      user_id: id,
      action: 'PASSWORD_RESET',
      status: 'success',
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    }, { transaction });

    await transaction.commit();
    
    res.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès'
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Erreur lors de la réinitialisation du mot de passe:', error);
    
    // Enregistrer l'échec dans les journaux d'audit
    try {
      await db.audit_logs.create({
        user_id: req.params.id,
        action: 'PASSWORD_RESET',
        status: 'failed',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        details: error.message
      });
    } catch (logError) {
      console.error('Erreur lors de la journalisation de l\'échec:', logError);
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la réinitialisation du mot de passe',
      error: error.message
    });
  }
}

/**
 * Active ou désactive l'authentification à deux facteurs
 */
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

async function toggleTwoFactorAuth(req, res) {
  console.log('=== DÉBUT toggleTwoFactorAuth ===');
  console.log('User ID:', req.params.id);
  console.log('Enable 2FA:', req.body.enable);
  
  const { id } = req.params;
  const { enable } = req.body;
  
  if (typeof enable !== 'boolean') {
    console.log('Erreur: Le paramètre "enable" est requis et doit être un booléen');
    return res.status(400).json({
      success: false,
      message: 'Le paramètre "enable" est requis et doit être un booléen'
    });
  }

  let transaction;
  try {
    transaction = await db.sequelize.transaction();
    console.log('Transaction démarrée');

    // Vérifier si l'utilisateur existe
    console.log('Recherche de l\'utilisateur avec l\'ID:', id);
    const user = await db.users.findByPk(id, { 
      attributes: ['user_id', 'email', 'two_factor_enabled', 'two_factor_secret'],
      transaction 
    });
    
    if (!user) {
      console.log('Utilisateur non trouvé');
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    console.log('Utilisateur trouvé:', user.email);

    let qrCodeUrl = null;
    let secret = user.two_factor_secret;
    console.log('État actuel de 2FA:', { two_factor_enabled: user.two_factor_enabled, has_secret: !!secret });

    if (enable) {
      console.log('Tentative d\'activation de la 2FA');
      // Générer un nouveau secret si on active et qu'il n'y en a pas
      if (!secret) {
        console.log('Génération d\'un nouveau secret 2FA');
        const secretData = speakeasy.generateSecret({
          length: 20,
          name: `Finserve:${user.email}`,
          issuer: 'Finserve'
        });
        secret = secretData.base32;
        console.log('Nouveau secret généré (base32):', secret);
      }

      // Générer le QR Code
      const otpauthUrl = speakeasy.otpauthURL({
        secret: secret,
        label: user.email,
        issuer: 'Finserve',
        encoding: 'base32'
      });
      
      console.log('Génération du QR Code');
      qrCodeUrl = await QRCode.toDataURL(otpauthUrl);
      console.log('QR Code généré avec succès');
    } else {
      console.log('Désactivation de la 2FA');
    }

    // Mettre à jour l'utilisateur
    const updateData = { 
      two_factor_enabled: enable,
      two_factor_secret: enable ? secret : null
    };
    
    console.log('Préparation de la mise à jour de l\'utilisateur:', updateData);
    
    try {
      console.log('Tentative de mise à jour de l\'utilisateur...');
      const [updated] = await db.users.update(
        updateData,
        { 
          where: { user_id: id },
          transaction,
          returning: true,
          individualHooks: true
        }
      );
      
      if (!updated) {
        console.error('Aucune ligne mise à jour - utilisateur non trouvé');
        throw new Error('Échec de la mise à jour de l\'utilisateur: utilisateur non trouvé');
      }
      
      console.log('Utilisateur mis à jour avec succès');
    } catch (updateError) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', {
        message: updateError.message,
        name: updateError.name,
        stack: updateError.stack,
        ...(updateError.original && {
          originalMessage: updateError.original.message,
          originalCode: updateError.original.code,
          originalSql: updateError.original.sql,
          originalParameters: updateError.original.parameters
        })
      });
      throw updateError;
    }

    // Journaliser l'action
    try {
      console.log('Journalisation de l\'action');
      await db.audit_logs.create({
        user_id: id,
        action: enable ? '2FA_ENABLED' : '2FA_DISABLED',
        resource_type: 'USER',
        resource_id: id,
        details: {
          two_factor_enabled: enable,
          ip_address: req.ip,
          status: 'success'
        },
        ip_address: req.ip,
        user_agent: req.headers['user-agent'] || null
      }, { transaction });
      console.log('Journalisation réussie');
    } catch (logError) {
      console.error('Erreur lors de la journalisation:', {
        message: logError.message,
        stack: logError.stack,
        ...(logError.original && {
          originalMessage: logError.original.message,
          originalCode: logError.original.code,
          originalSql: logError.original.sql
        })
      });
      // Ne pas arrêter le processus pour une erreur de journalisation
    }

    await transaction.commit();
    console.log('Transaction commitée avec succès');
    
    const response = {
      success: true,
      message: `Authentification à deux facteurs ${enable ? 'activée' : 'désactivée'} avec succès`,
      qrCodeUrl: enable ? qrCodeUrl : null,
      secret: enable ? secret : null
    };
    
    console.log('Réponse envoyée avec succès');
    return res.json(response);

  } catch (error) {
    await transaction.rollback();
    console.error('=== ERREUR 2FA DÉTAILLÉE ===');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.error('Code:', error.code);
    console.error('Original Error:', error.original);
    console.error('SQL:', error.sql);
    console.error('Parameters:', error.parameters);
    console.error('============================');
    
    res.status(500).json({
      success: false,
      message: `Erreur lors de ${enable ? 'l\'activation' : 'la désactivation'} de l'authentification à deux facteurs`,
      error: {
        message: error.message,
        ...(process.env.NODE_ENV === 'development' && {
          stack: error.stack,
          code: error.code,
          original: error.original,
          sql: error.sql
        })
      }
    });
  }
}

module.exports = {
  getUserById,
  updateUserSecurity,
  resetUserPassword,
  toggleTwoFactorAuth
};

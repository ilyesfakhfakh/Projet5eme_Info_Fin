const db = require("../models");
const { Op } = db.Sequelize;
const bcrypt = require('bcrypt');

async function createAudit(
  req,
  action,
  entityType,
  entityId,
  oldValues,
  newValues
) {
  try {
    await db.audit_logs.create({
      user_id: req.user && req.user.user_id,
      action,
      entity_type: entityType,
      entity_id: String(entityId || ""),
      old_values: oldValues || {},
      new_values: newValues || {},
      ip_address:
        req.headers["x-forwarded-for"] ||
        req.connection?.remoteAddress ||
        req.ip,
    });
  } catch (e) {}
}

async function listUsers(req, res) {
  try {
    const {
      q,
      page = 1,
      pageSize = 20,
      is_active,
      user_type,
      date_from,
      date_to,
    } = req.query;
    const where = {};
    // Filtre par statut actif/inactif
    if (is_active && is_active !== "") {
      // if (typeof is_active !== 'undefined') {
      where.is_active = is_active;
    } else {
      // where.is_active = true;
    }

    // Filtre par type d'utilisateur
    if (user_type) where.user_type = user_type;

    // Filtre par période d'inscription
    if (date_from || date_to) {
      where.registration_date = {};
      if (date_from) where.registration_date[Op.gte] = new Date(date_from);
      if (date_to)
        where.registration_date[Op.lte] = new Date(date_to + "T23:59:59");
    }

    // Recherche par texte
    if (q && q !== "") {
      where[Op.or] = [
        { username: { [Op.like]: `%${q}%` } },
        { email: { [Op.like]: `%${q}%` } },
        { first_name: { [Op.like]: `%${q}%` } },
        { last_name: { [Op.like]: `%${q}%` } },
      ];
    }
    const limit = Math.min(parseInt(pageSize, 10) || 20, 100);
    const offset = ((parseInt(page, 10) || 1) - 1) * limit;
    const { rows, count } = await db.users.findAndCountAll({
      where,
      limit,
      offset,
      order: [["registration_date", "DESC"]],
      attributes: [
        'user_id', 'username', 'email', 'first_name', 'last_name', 'phone',
        'date_of_birth', 'address', 'city', 'country', 'postal_code',
        'timezone', 'language', 'currency', 'user_type', 'profile_picture',
        'is_active', 'is_locked', 'registration_date', 'last_login_date'
      ],
      include: [
        { 
          model: db.roles, 
          through: { attributes: [] },
          attributes: ['role_id', 'role_name']
        },
        { 
          model: db.user_preferences, 
          as: "preferences",
          attributes: { exclude: ['created_at', 'updated_at'] }
        },
      ],
      raw: false
    });
    return res.json({
      data: rows,
      total: count,
      page: Number(page),
      pageSize: limit,
    });
  } catch (e) {
    console.log({ message: "Erreur serveur", error: e.message });
  }
}

async function getUser(req, res) {
  try {
    console.log('=== DEBUT getUSer ===');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Params:', JSON.stringify(req.params, null, 2));
    
    const { id } = req.params;
    console.log('ID reçu dans getUser:', id, 'Type:', typeof id);
    
    // Vérifier si l'ID est vide ou non défini
    if (!id) {
      console.log('Erreur: Aucun ID fourni');
      return res.status(400).json({ 
        success: false,
        message: "ID utilisateur requis",
        receivedId: id,
        params: req.params
      });
    }

    // Convertir l'ID en nombre si c'est une chaîne numérique
    const userId = isNaN(id) ? id : parseInt(id, 10);
    
    console.log('Recherche utilisateur avec ID:', userId, 'Type:', typeof userId);
    
    console.log('Recherche de l\'utilisateur dans la base de données...');
    
    try {
      const user = await db.users.findOne({
        where: { user_id: userId },
        include: [
          { model: db.roles, through: { attributes: [] } },
          { model: db.user_preferences, as: "preferences" },
        ],
      });
      
      console.log('Résultat de la recherche:', user ? 'Utilisateur trouvé' : 'Utilisateur non trouvé');
      
      if (!user) {
        console.log(`Aucun utilisateur trouvé avec l'ID: ${userId}`);
        return res.status(404).json({ 
          success: false,
          message: "Utilisateur non trouvé",
          receivedId: id,
          processedId: userId,
          type: typeof userId,
          query: { where: { user_id: userId } }
        });
      }
      
      console.log('Données utilisateur trouvées:', JSON.stringify(user, null, 2));
      
      return res.json({
        success: true,
        data: user
      });
    } catch (dbError) {
      console.error('Erreur de base de données:', dbError);
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la recherche dans la base de données",
        error: dbError.message,
        stack: process.env.NODE_ENV === 'development' ? dbError.stack : undefined
      });
    }
  } catch (e) {
    console.error('Erreur dans getUser:', e);
    return res.status(500).json({ 
      success: false,
      message: "Erreur serveur", 
      error: e.message,
      stack: process.env.NODE_ENV === 'development' ? e.stack : undefined
    });
  }
}

async function createUser(req, res) {
  try {
    const {
      username,
      email,
      password,
      first_name,
      last_name,
      phone,
      date_of_birth,
      address,
      city,
      country,
      postal_code,
      timezone = 'UTC',
      language = 'fr',
      currency = 'EUR',
      user_type = 'NOVICE',
      notes,
      is_active = true,
      isLocked = false,
      roles = []
    } = req.body || {};

    // Validation des champs requis
    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Les champs username, email et password sont obligatoires" 
      });
    }

    // Vérification de l'existence de l'utilisateur
    const exists = await db.users.findOne({
      where: { [Op.or]: [{ email }, { username }] },
    });
    
    if (exists) {
      return res.status(409).json({
        success: false,
        message: "Un utilisateur avec cet email ou ce nom d'utilisateur existe déjà"
      });
    }

    // Création de l'utilisateur - Le hachage est géré par le hook beforeCreate du modèle
    const user = await db.users.create({
      username,
      email,
      password_hash: password,
      first_name,
      last_name,
      phone,
      date_of_birth: date_of_birth ? new Date(date_of_birth) : null,
      address,
      city,
      country,
      postal_code,
      timezone,
      language,
      currency,
      user_type,
      notes,
      is_active: is_active !== false,
      is_locked: isLocked === true
    });

    await createAudit(
      req,
      "USER_CREATE",
      "USER",
      user.user_id,
      null,
      user.get({ plain: true })
    );

    return res.status(201).json(user);
  } catch (e) {
    console.error('Erreur lors de la création de l\'utilisateur:', e);
    return res
      .status(500)
      .json({ message: "Erreur serveur", error: e.message });
  }
}

async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const {
      username,
      email,
      password,
      first_name,
      last_name,
      phone,
      date_of_birth,
      address,
      city,
      country,
      postal_code,
      timezone,
      language,
      currency,
      user_type,
      notes,
      is_active,
      isLocked
    } = req.body || {};

    const user = await db.users.findOne({ where: { user_id: id } });
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    const before = user.get({ plain: true });
    
    // Préparer les champs à mettre à jour
    const updateData = {
      username,
      email,
      first_name,
      last_name,
      phone,
      date_of_birth: date_of_birth ? new Date(date_of_birth) : null,
      address,
      city,
      country,
      postal_code,
      notes
    };

    // Ne mettre à jour le mot de passe que s'il est fourni
    if (password) {
      updateData.password_hash = password;
    }

    // Mettre à jour les champs optionnels uniquement s'ils sont fournis
    if (timezone !== undefined) updateData.timezone = timezone;
    if (language !== undefined) updateData.language = language;
    if (currency !== undefined) updateData.currency = currency;
    if (user_type !== undefined) updateData.user_type = user_type;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (isLocked !== undefined) updateData.is_locked = isLocked;

    await user.update(updateData);

    const updated = await db.users.findOne({
      where: { user_id: id },
      include: [
        { model: db.roles, through: { attributes: [] } },
        { model: db.user_preferences, as: 'preferences' }
      ],
    });

    await createAudit(
      req,
      "USER_UPDATE",
      "USER",
      id,
      before,
      updated && updated.get ? updated.get({ plain: true }) : updated
    );

    return res.json(updated);
  } catch (e) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', e);
    return res
      .status(500)
      .json({ message: "Erreur serveur", error: e.message });
  }
}

async function deleteUser(req, res) {
  console.log('=== DÉBUT DE LA SUPPRESSION UTILISATEUR ===');
  
  try {
    // 1. Validation de l'ID utilisateur
    const { id } = req.params;
    console.log('Tentative de suppression de l\'utilisateur ID:', id);

    if (!id) {
      console.error('Erreur: Aucun ID utilisateur fourni');
      return res.status(400).json({ 
        success: false, 
        message: 'ID utilisateur manquant' 
      });
    }

    // 2. Vérification du format de l'ID (UUID v4)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      console.error('Erreur: Format d\'ID utilisateur invalide');
      return res.status(400).json({ 
        success: false, 
        message: 'Format d\'ID utilisateur invalide' 
      });
    }

    // 3. Désactiver temporairement les contraintes de clé étrangère
    console.log('Désactivation des contraintes de clé étrangère...');
    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { raw: true });

    try {
      // 4. Supprimer d'abord les relations
      console.log('Suppression des relations...');
      
      // Supprimer les sessions
      console.log('Suppression des sessions...');
      await db.sessions.destroy({ where: { user_id: id } });
      
      // Supprimer les rôles
      console.log('Suppression des rôles utilisateur...');
      await db.user_roles.destroy({ where: { user_id: id } });
      
      // Supprimer les préférences
      console.log('Suppression des préférences utilisateur...');
      await db.user_preferences.destroy({ where: { user_id: id } });
      
      // Supprimer la progression
      console.log('Suppression de la progression utilisateur...');
      await db.user_progress.destroy({ where: { user_id: id } });
      
      // Supprimer les portefeuilles et leurs relations
      console.log('Récupération des portefeuilles...');
      const portfolios = await db.portfolios.findAll({ 
        where: { user_id: id },
        attributes: ['portfolio_id'],
        raw: true
      });
      
      for (const portfolio of portfolios) {
        console.log(`Traitement du portefeuille ${portfolio.portfolio_id}...`);
        await db.positions.destroy({ where: { portfolio_id: portfolio.portfolio_id } });
        await db.transactions.destroy({ where: { portfolio_id: portfolio.portfolio_id } });
        await db.portfolios.destroy({ where: { portfolio_id: portfolio.portfolio_id } });
      }

      // 5. Supprimer l'utilisateur
      console.log('Suppression de l\'utilisateur...');
      const deleted = await db.users.destroy({
        where: { user_id: id },
        force: true  // Forcer la suppression même avec paranoid: true
      });

      if (!deleted) {
        throw new Error('Aucun utilisateur trouvé avec cet ID');
      }

      console.log('=== SUPPRESSION RÉUSSIE ===');
      return res.json({ 
        success: true, 
        message: 'Utilisateur supprimé avec succès' 
      });
      
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      throw error; // Propage l'erreur au bloc catch externe
    } finally {
      // 6. Toujours réactiver les contraintes de clé étrangère
      console.log('Réactivation des contraintes de clé étrangère...');
      await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { raw: true });
    }
    
  } catch (error) {
    console.error('ERREUR lors de la suppression:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la suppression de l\'utilisateur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

async function setUserRoles(req, res) {
  try {
    const { id } = req.params;
    const { roles } = req.body;

    if (!roles || !Array.isArray(roles)) {
      return res.status(400).json({ 
        success: false,
        message: 'Le paramètre roles est requis et doit être un tableau' 
      });
    }

    // Vérifier si l'utilisateur existe
    const user = await db.users.findByPk(id);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Utilisateur non trouvé' 
      });
    }

    // Récupérer les rôles actuels pour l'audit
    const current = await db.users.findOne({
      where: { user_id: id },
      include: [{ model: db.roles, through: { attributes: [] } }],
    });
    
    const before = current && current.roles ? current.roles.map((r) => r.role_name) : [];
    
    // Trouver les nouveaux rôles
    const roleRows = await db.roles.findAll({ 
      where: { role_name: { [Op.in]: roles } } 
    });
    
    // Mettre à jour les rôles dans une transaction
    const transaction = await db.sequelize.transaction();
    
    try {
      // Supprimer tous les rôles existants
      await db.user_roles.destroy({ 
        where: { user_id: id },
        transaction 
      });
      
      // Ajouter les nouveaux rôles
      for (const role of roleRows) {
        await db.user_roles.create({ 
          user_id: id, 
          role_id: role.role_id 
        }, { transaction });
      }
      
      await transaction.commit();
      
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
    
    // Récupérer l'utilisateur avec les nouveaux rôles
    const withRoles = await db.users.findOne({
      where: { user_id: id },
      include: [{ 
        model: db.roles, 
        through: { attributes: [] },
        attributes: ['role_id', 'role_name']
      }],
    });
    
    const after = withRoles && withRoles.roles 
      ? withRoles.roles.map((r) => r.role_name) 
      : [];
      
    // Journaliser l'audit
    await createAudit(
      req,
      'USER_SET_ROLES',
      'USER',
      id,
      { roles: before },
      { roles: after }
    );
    
    return res.json({
      success: true,
      message: 'Rôles mis à jour avec succès',
      data: withRoles
    });
    
  } catch (error) {
    console.error('Erreur lors de la mise à jour des rôles:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la mise à jour des rôles',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

async function exportUsers(req, res) {
  try {
    const { format = "csv", q, is_active, user_type, date_from, date_to } = req.query;
    const where = {};

    if (is_active !== undefined && is_active !== "") where.is_active = is_active === "true";
    if (user_type && user_type.trim() !== "") where.user_type = user_type.trim();

    if (date_from || date_to) {
      where.registration_date = {};
      if (date_from) where.registration_date[Op.gte] = new Date(date_from);
      if (date_to) where.registration_date[Op.lte] = new Date(date_to + "T23:59:59");
    }

    if (q && q.trim() !== "") {
      where[Op.or] = [
        { username: { [Op.like]: `%${q}%` } },
        { email: { [Op.like]: `%${q}%` } },
        { first_name: { [Op.like]: `%${q}%` } },
        { last_name: { [Op.like]: `%${q}%` } },
      ];
    }


    const users = await db.users.findAll({
      where,
      include: [{ model: db.roles, through: { attributes: [] } }],
      order: [["registration_date", "DESC"]],
    });


    if (!users || users.length === 0) {
      return res.status(204).send("Aucun utilisateur trouvé pour les filtres sélectionnés.");
    }
    // ✅ Génération du CSV
    if (format === "csv") {
      const csvRows = [];
      const headers = [
        "ID",
        "Username",
        "Email",
        "Prénom",
        "Nom",
        "Type",
        "Statut",
        "Date inscription",
        "Dernière connexion",
        "Rôles",
      ];
      csvRows.push(headers.join(","));

      users.forEach((user) => {
        const row = [
          user.user_id,
          user.username,
          user.email,
          user.first_name || "",
          user.last_name || "",
          user.user_type || "",
          user.is_active ? "Actif" : "Inactif",
          user.registration_date
            ? new Date(user.registration_date).toLocaleDateString("fr-FR")
            : "",
          user.last_login_date
            ? new Date(user.last_login_date).toLocaleDateString("fr-FR")
            : "",
          (user.roles || []).map((r) => r.role_name).join(";"),
        ]
          .map((f) => `"${String(f).replace(/"/g, '""')}"`)
          .join(",");

        csvRows.push(row);
      });

      const csvContent = csvRows.join("\n");
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", "attachment; filename=users.csv");

      return res.status(200).send(csvContent);
    } else {
      return res.status(400).json({ message: "Format non supporté" });
    }


  } catch (error) {
    console.error("Erreur export CSV :", error);
    return res.status(500).json({
      message: "Erreur lors de l’exportation CSV",
      error: error.message,
    });
  }
}

module.exports = {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  setUserRoles,
  exportUsers
};

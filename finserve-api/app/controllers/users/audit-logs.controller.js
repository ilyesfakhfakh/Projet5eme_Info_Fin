const db = require('../../models');
const { Op } = require('sequelize');

// Fonction utilitaire pour gérer les erreurs de requête
async function safeQuery(queryFn, defaultValue) {
  try {
    return await queryFn();
  } catch (error) {
    console.error('Erreur de requête audit-logs:', error.message);
    return defaultValue;
  }
}

exports.getUserAuditLogs = async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize) || 10, 100);
    const offset = (page - 1) * pageSize;

    console.log(`Récupération des logs d'audit pour l'utilisateur: ${id}`);

    // Vérifier si l'utilisateur existe
    const user = await db.users.findByPk(id);
    if (!user) {
      console.log('Utilisateur non trouvé pour les logs d\'audit:', id);
      return res.status(404).json({ 
        message: 'Utilisateur non trouvé',
        userId: id
      });
    }

    // Vérifier si la table audit_logs existe
    if (!db.audit_logs) {
      console.log('Table audit_logs non trouvée');
      return res.json({
        data: [],
        pagination: {
          total: 0,
          page,
          pageSize,
          totalPages: 0
        }
      });
    }

    // Récupérer les logs d'audit de manière sécurisée
    const result = await safeQuery(
      async () => {
        return await db.audit_logs.findAndCountAll({
          where: { user_id: id },
          order: [['created_at', 'DESC']],
          offset,
          limit: pageSize
        });
      },
      { count: 0, rows: [] }
    );

    const count = result.count || 0;
    const rows = result.rows || [];
    const totalPages = Math.ceil(count / pageSize);

    // Formater la réponse
    const response = {
      data: rows,
      pagination: {
        total: count,
        page,
        pageSize,
        totalPages
      }
    };

    console.log(`Logs d'audit récupérés avec succès pour l'utilisateur: ${id}`);
    return res.json(response);

  } catch (error) {
    console.error('Erreur critique dans getUserAuditLogs:', error);
    // En cas d'erreur, renvoyer une réponse vide mais valide
    return res.json({
      data: [],
      pagination: {
        total: 0,
        page: parseInt(req.query.page) || 1,
        pageSize: parseInt(req.query.pageSize) || 10,
        totalPages: 0
      }
    });
  }
};

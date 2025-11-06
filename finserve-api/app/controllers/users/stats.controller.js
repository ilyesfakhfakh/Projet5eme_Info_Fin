const db = require('../../models');
const { Op } = require('sequelize');

// Fonction utilitaire pour gérer les erreurs de requête
async function safeQuery(queryFn, defaultValue) {
  try {
    return await queryFn();
  } catch (error) {
    console.error('Erreur de requête:', error.message);
    return defaultValue;
  }
}

exports.getUserStats = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Récupération des stats pour l\'utilisateur:', id);
    
    // Vérifier si l'utilisateur existe
    const user = await db.users.findByPk(id);
    if (!user) {
      console.log('Utilisateur non trouvé avec l\'ID:', id);
      return res.status(404).json({ 
        message: 'Utilisateur non trouvé',
        userId: id
      });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Récupérer les actions récentes (via logs d'audit)
    const recentActions = await safeQuery(async () => {
      if (!db.audit_logs) return 0;
      return await db.audit_logs.count({
        where: {
          user_id: id,
          created_at: { [Op.gte]: thirtyDaysAgo }
        }
      });
    }, 0);

    // Récupérer le nombre de portefeuilles (si la table existe)
    const portfolioCount = await safeQuery(async () => {
      if (!db.portfolios) return 0;
      return await db.portfolios.count({
        where: { user_id: id }
      });
    }, 0);

    // Récupérer les sessions récentes (si la table existe)
    const sessions = await safeQuery(async () => {
      if (!db.user_sessions) return [];
      const sessionsData = await db.user_sessions.findAll({
        where: { user_id: id },
        order: [['created_at', 'DESC']],
        limit: 5
      });
      return sessionsData.map(s => ({
        id: s.session_id,
        ip_address: s.ip_address,
        created_at: s.created_at,
        is_active: s.is_active
      }));
    }, []);

    // Réponse avec des valeurs par défaut sécurisées
    const response = {
      activity: {
        recent_actions: recentActions || 0,
        total_portfolios: portfolioCount || 0
      },
      sessions: sessions || []
    };

    console.log('Statistiques récupérées avec succès pour l\'utilisateur:', id);
    return res.json(response);
    
  } catch (error) {
    console.error('Erreur critique dans getUserStats:', error);
    // En cas d'erreur critique, on renvoie une réponse vide mais valide
    return res.json({
      activity: {
        recent_actions: 0,
        total_portfolios: 0
      },
      sessions: []
    });
  }
}
;
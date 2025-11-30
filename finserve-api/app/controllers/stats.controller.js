const db = require('../models');
const { Op, Sequelize } = require('sequelize');

exports.getNewUsersByMonth = async (req, res) => {
  try {
    const stats = await db.User.findAll({
      attributes: [
        [Sequelize.fn('date_trunc', 'month', Sequelize.col('createdAt')), 'month'],
        [Sequelize.fn('count', '*'), 'count']
      ],
      where: {
        createdAt: {
          [Op.gte]: Sequelize.fn('date_trunc', 'month', Sequelize.fn('now'))
        }
      },
      group: [Sequelize.fn('date_trunc', 'month', Sequelize.col('createdAt'))],
      order: [[Sequelize.fn('date_trunc', 'month', Sequelize.col('createdAt')), 'DESC']],
      limit: 12
    });

    res.status(200).json({
      success: true,
      data: stats.map(stat => ({
        month: stat.dataValues.month,
        count: parseInt(stat.dataValues.count)
      }))
    });
  } catch (error) {
    console.error('Error fetching new users stats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
};

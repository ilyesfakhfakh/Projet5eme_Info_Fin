// ========================================
// Price Alert Controller
// Description: Manages price alerts for assets
// ========================================

const db = require('../../models');
const PriceAlert = db.price_alerts;

// Check if any alerts should be triggered
exports.checkAlerts = async (assetId, currentPrice) => {
  try {
    const alerts = await PriceAlert.findAll({
      where: {
        asset_id: assetId,
        is_active: true,
        is_triggered: false
      }
    });

    const triggeredAlerts = [];

    for (const alert of alerts) {
      let shouldTrigger = false;

      if (alert.alert_type === 'ABOVE' && currentPrice >= alert.target_price) {
        shouldTrigger = true;
      } else if (alert.alert_type === 'BELOW' && currentPrice <= alert.target_price) {
        shouldTrigger = true;
      }

      if (shouldTrigger) {
        await alert.update({
          is_triggered: true,
          triggered_at: new Date()
        });
        triggeredAlerts.push(alert);
      }
    }

    return triggeredAlerts;
  } catch (error) {
    console.error('Error checking alerts:', error);
    return [];
  }
};

// Create a new Price Alert
exports.create = (req, res) => {
  if (!req.body.asset_id || !req.body.target_price) {
    res.status(400).send({
      message: 'Asset ID and target price are required!'
    });
    return;
  }

  // Use authenticated user ID if available, otherwise use a default UUID
  // TODO: Replace with actual authenticated user from req.user.id when auth is implemented
  const userId = req.body.user_id || req.user?.id || '00000000-0000-0000-0000-000000000001';

  const alert = {
    user_id: userId,
    asset_id: req.body.asset_id,
    alert_type: req.body.alert_type || 'ABOVE',
    target_price: req.body.target_price,
    is_active: req.body.is_active !== undefined ? req.body.is_active : true,
    message: req.body.message
  };

  PriceAlert.create(alert)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || 'Some error occurred while creating the Price Alert.'
      });
    });
};

// Retrieve all Price Alerts
exports.findAll = (req, res) => {
  const userId = req.query.user_id;
  const assetId = req.query.asset_id;
  
  let condition = {};
  if (userId) condition.user_id = userId;
  if (assetId) condition.asset_id = assetId;

  PriceAlert.findAll({ where: condition })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || 'Some error occurred while retrieving price alerts.'
      });
    });
};

// Find a single Price Alert by id
exports.findOne = (req, res) => {
  const id = req.params.id;

  PriceAlert.findByPk(id)
    .then(data => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `Cannot find Price Alert with id=${id}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: 'Error retrieving Price Alert with id=' + id
      });
    });
};

// Update a Price Alert by id
exports.update = (req, res) => {
  const id = req.params.id;

  PriceAlert.update(req.body, {
    where: { alert_id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: 'Price Alert was updated successfully.'
        });
      } else {
        res.send({
          message: `Cannot update Price Alert with id=${id}. Maybe it was not found or req.body is empty!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: 'Error updating Price Alert with id=' + id
      });
    });
};

// Delete a Price Alert by id
exports.delete = (req, res) => {
  const id = req.params.id;

  PriceAlert.destroy({
    where: { alert_id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: 'Price Alert was deleted successfully!'
        });
      } else {
        res.send({
          message: `Cannot delete Price Alert with id=${id}. Maybe it was not found!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: 'Could not delete Price Alert with id=' + id
      });
    });
};

// Delete all Price Alerts
exports.deleteAll = (req, res) => {
  PriceAlert.destroy({
    where: {},
    truncate: false
  })
    .then(nums => {
      res.send({ message: `${nums} Price Alerts were deleted successfully!` });
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || 'Some error occurred while removing all price alerts.'
      });
    });
};

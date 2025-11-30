const db = require('../../models');
const RealTimeQuote = db.real_time_quotes;
const { checkAlerts } = require('./price-alert.controller');

// Function to emit real-time quote updates via WebSocket
const emitRealTimeQuote = (io, quote) => {
  if (io) {
    io.to(`asset_${quote.asset_id}`).emit('quoteUpdate', quote);
  }
};

// Create and Save a new RealTimeQuote
exports.create = (req, res) => {
  // Validate request
  if (!req.body.asset_id || !req.body.bid_price || !req.body.ask_price || !req.body.last_price || !req.body.volume) {
    res.status(400).send({
      message: 'Asset ID, bid_price, ask_price, last_price, and volume are required!'
    });
    return;
  }

  // Create a RealTimeQuote
  const realTimeQuote = {
    asset_id: req.body.asset_id,
    bid_price: req.body.bid_price,
    ask_price: req.body.ask_price,
    last_price: req.body.last_price,
    volume: req.body.volume,
    timestamp: req.body.timestamp || new Date(),
    market_status: req.body.market_status || 'CLOSED'
  };

  // Save RealTimeQuote in the database
  RealTimeQuote.create(realTimeQuote)
    .then(async data => {
      // Emit real-time update
      const io = req.app.get('io');
      emitRealTimeQuote(io, data);

      // Check for price alerts
      const triggeredAlerts = await checkAlerts(data);
      if (triggeredAlerts.length > 0) {
        // Emit alert notifications via WebSocket
        triggeredAlerts.forEach(alert => {
          io.to(`user_${alert.user_id}`).emit('priceAlert', alert);
        });
      }

      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || 'Some error occurred while creating the RealTimeQuote.'
      });
    });
};

// Retrieve all RealTimeQuotes from the database
exports.findAll = (req, res) => {
  const asset_id = req.query.asset_id;
  var condition = asset_id ? { asset_id: asset_id } : null;

  RealTimeQuote.findAll({ where: condition, include: [{ model: db.assets, as: 'asset' }] })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || 'Some error occurred while retrieving real time quotes.'
      });
    });
};

// Find a single RealTimeQuote with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  RealTimeQuote.findByPk(id, { include: [{ model: db.assets, as: 'asset' }] })
    .then(data => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `Cannot find RealTimeQuote with id=${id}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: 'Error retrieving RealTimeQuote with id=' + id
      });
    });
};

// Update a RealTimeQuote by the id in the request
exports.update = (req, res) => {
  const id = req.params.id;

  RealTimeQuote.update(req.body, {
    where: { quote_id: id }
  })
    .then(async num => {
      if (num == 1) {
        // Fetch updated quote to emit and check alerts
        const updatedQuote = await RealTimeQuote.findByPk(id);
        if (updatedQuote) {
          const io = req.app.get('io');
          emitRealTimeQuote(io, updatedQuote);

          // Check for price alerts
          const triggeredAlerts = await checkAlerts(updatedQuote);
          if (triggeredAlerts.length > 0) {
            // Emit alert notifications via WebSocket
            triggeredAlerts.forEach(alert => {
              io.to(`user_${alert.user_id}`).emit('priceAlert', alert);
            });
          }
        }
        res.send({
          message: 'RealTimeQuote was updated successfully.'
        });
      } else {
        res.send({
          message: `Cannot update RealTimeQuote with id=${id}. Maybe RealTimeQuote was not found or req.body is empty!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: 'Error updating RealTimeQuote with id=' + id
      });
    });
};

// Delete a RealTimeQuote with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;

  RealTimeQuote.destroy({
    where: { quote_id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: 'RealTimeQuote was deleted successfully!'
        });
      } else {
        res.send({
          message: `Cannot delete RealTimeQuote with id=${id}. Maybe RealTimeQuote was not found!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: 'Could not delete RealTimeQuote with id=' + id
      });
    });
};

// Delete all RealTimeQuotes from the database
exports.deleteAll = (req, res) => {
  RealTimeQuote.destroy({
    where: {},
    truncate: false
  })
    .then(nums => {
      res.send({ message: `${nums} RealTimeQuotes were deleted successfully!` });
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || 'Some error occurred while removing all real time quotes.'
      });
    });
};

// Find all RealTimeQuotes for a specific asset
exports.findByAsset = (req, res) => {
  const asset_id = req.params.asset_id;

  RealTimeQuote.findAll({
    where: { asset_id: asset_id },
    include: [{ model: db.assets, as: 'asset' }],
    order: [['timestamp', 'DESC']]
  })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || 'Some error occurred while retrieving real time quotes for asset.'
      });
    });
};

// Find the latest RealTimeQuote for a specific asset
exports.findLatestByAsset = (req, res) => {
  const asset_id = req.params.asset_id;

  RealTimeQuote.findOne({
    where: { asset_id: asset_id },
    include: [{ model: db.assets, as: 'asset' }],
    order: [['timestamp', 'DESC']]
  })
    .then(data => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `No RealTimeQuote found for asset with id=${asset_id}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || 'Some error occurred while retrieving latest real time quote for asset.'
      });
    });
};
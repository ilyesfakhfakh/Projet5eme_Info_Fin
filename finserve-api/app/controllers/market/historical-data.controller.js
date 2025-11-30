// ========================================
// MODULE 3: Financial Assets and Market Data
// Controller: HistoricalData
// Description: CRUD operations for historical market data
// ========================================

const db = require('../../models');
const HistoricalData = db.historical_data;
const Asset = db.assets;

// Create and Save new Historical Data
exports.create = (req, res) => {
  // Validate request
  if (!req.body.asset_id || !req.body.date) {
    res.status(400).send({
      message: 'Asset ID and date are required!'
    });
    return;
  }

  // Create Historical Data entry
  const historicalData = {
    asset_id: req.body.asset_id,
    date: req.body.date,
    open_price: req.body.open_price || 0,
    high_price: req.body.high_price || 0,
    low_price: req.body.low_price || 0,
    close_price: req.body.close_price || 0,
    adjusted_close: req.body.adjusted_close || 0,
    volume: req.body.volume || 0
  };

  // Save Historical Data in the database
  HistoricalData.create(historicalData)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || 'Some error occurred while creating Historical Data.'
      });
    });
};

// Retrieve all Historical Data from the database
exports.findAll = (req, res) => {
  const assetId = req.query.asset_id;
  const condition = assetId ? { asset_id: assetId } : null;

  HistoricalData.findAll({
    where: condition,
    include: [{
      model: Asset,
      as: 'asset',
      attributes: ['symbol', 'name', 'asset_type']
    }],
    order: [['date', 'DESC']]
  })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || 'Some error occurred while retrieving historical data.'
      });
    });
};

// Find a single Historical Data entry by id
exports.findOne = (req, res) => {
  const id = req.params.id;

  HistoricalData.findByPk(id, {
    include: [{
      model: Asset,
      as: 'asset',
      attributes: ['symbol', 'name', 'asset_type']
    }]
  })
    .then(data => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `Cannot find Historical Data with id=${id}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: 'Error retrieving Historical Data with id=' + id
      });
    });
};

// Get historical data for a specific asset
exports.findByAsset = (req, res) => {
  const assetId = req.params.assetId;
  const startDate = req.query.start_date;
  const endDate = req.query.end_date;
  const limit = req.query.limit ? parseInt(req.query.limit) : 100;

  let condition = { asset_id: assetId };

  // Add date range filter if provided
  if (startDate || endDate) {
    condition.date = {};
    if (startDate) condition.date[db.Sequelize.Op.gte] = startDate;
    if (endDate) condition.date[db.Sequelize.Op.lte] = endDate;
  }

  HistoricalData.findAll({
    where: condition,
    order: [['date', 'DESC']],
    limit: limit,
    include: [{
      model: Asset,
      as: 'asset',
      attributes: ['symbol', 'name']
    }]
  })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || 'Error retrieving historical data for asset.'
      });
    });
};

// Get historical data by date range
exports.findByDateRange = (req, res) => {
  const startDate = req.query.start_date;
  const endDate = req.query.end_date;

  if (!startDate || !endDate) {
    res.status(400).send({
      message: 'Start date and end date are required!'
    });
    return;
  }

  HistoricalData.findAll({
    where: {
      date: {
        [db.Sequelize.Op.between]: [startDate, endDate]
      }
    },
    order: [['date', 'DESC']],
    include: [{
      model: Asset,
      as: 'asset',
      attributes: ['symbol', 'name']
    }]
  })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || 'Error retrieving historical data by date range.'
      });
    });
};

// Get latest historical data for an asset
exports.findLatest = (req, res) => {
  const assetId = req.params.assetId;
  const limit = req.query.limit ? parseInt(req.query.limit) : 1;

  HistoricalData.findAll({
    where: { asset_id: assetId },
    order: [['date', 'DESC']],
    limit: limit,
    include: [{
      model: Asset,
      as: 'asset',
      attributes: ['symbol', 'name']
    }]
  })
    .then(data => {
      if (data && data.length > 0) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `No historical data found for asset ${assetId}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || 'Error retrieving latest historical data.'
      });
    });
};

// Update Historical Data by id
exports.update = (req, res) => {
  const id = req.params.id;

  HistoricalData.update(req.body, {
    where: { history_id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: 'Historical Data was updated successfully.'
        });
      } else {
        res.send({
          message: `Cannot update Historical Data with id=${id}. Maybe it was not found or req.body is empty!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: 'Error updating Historical Data with id=' + id
      });
    });
};

// Delete Historical Data by id
exports.delete = (req, res) => {
  const id = req.params.id;

  HistoricalData.destroy({
    where: { history_id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: 'Historical Data was deleted successfully!'
        });
      } else {
        res.send({
          message: `Cannot delete Historical Data with id=${id}. Maybe it was not found!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: 'Could not delete Historical Data with id=' + id
      });
    });
};

// Delete all Historical Data
exports.deleteAll = (req, res) => {
  HistoricalData.destroy({
    where: {},
    truncate: false
  })
    .then(nums => {
      res.send({ message: `${nums} Historical Data entries were deleted successfully!` });
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || 'Some error occurred while removing all historical data.'
      });
    });
};

// Bulk create historical data
exports.bulkCreate = (req, res) => {
  if (!req.body.data || !Array.isArray(req.body.data)) {
    res.status(400).send({
      message: 'Data array is required!'
    });
    return;
  }

  HistoricalData.bulkCreate(req.body.data, {
    updateOnDuplicate: ['open_price', 'high_price', 'low_price', 'close_price', 'adjusted_close', 'volume', 'updated_at']
  })
    .then(data => {
      res.send({
        message: `${data.length} historical data entries were created/updated successfully!`,
        data: data
      });
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || 'Error occurred while bulk creating historical data.'
      });
    });
};

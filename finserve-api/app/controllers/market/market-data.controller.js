const db = require('../../models');
const MarketData = db.market_data;

// Create and Save a new MarketData
exports.create = (req, res) => {
  // Validate request
  if (!req.body.asset_id || !req.body.timestamp) {
    res.status(400).send({
      message: 'Asset ID and timestamp are required!'
    });
    return;
  }

  // Create a MarketData - support both old and new field names
  const marketData = {
    asset_id: req.body.asset_id,
    timestamp: req.body.timestamp,
    open_price: req.body.open_price || req.body.price || 0,
    high_price: req.body.high_price || req.body.price || 0,
    low_price: req.body.low_price || req.body.price || 0,
    close_price: req.body.close_price || req.body.price || 0,
    volume: req.body.volume || 0,
    adjusted_close: req.body.adjusted_close || req.body.close_price || req.body.price || 0,
    change: req.body.change || req.body.change_amount || 0,
    change_percent: req.body.change_percent || req.body.change_percentage || 0
  };

  // Save MarketData in the database
  MarketData.create(marketData)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || 'Some error occurred while creating the MarketData.'
      });
    });
};

// Retrieve all MarketData from the database
exports.findAll = (req, res) => {
  const asset_id = req.query.asset_id;
  var condition = asset_id ? { asset_id: asset_id } : null;

  MarketData.findAll({ where: condition, include: [{ model: db.assets, as: 'asset' }] })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || 'Some error occurred while retrieving market data.'
      });
    });
};

// Find a single MarketData with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  MarketData.findByPk(id, { include: [{ model: db.assets, as: 'asset' }] })
    .then(data => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `Cannot find MarketData with id=${id}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: 'Error retrieving MarketData with id=' + id
      });
    });
};

// Update a MarketData by the id in the request
exports.update = (req, res) => {
  const id = req.params.id;

  // Prepare update data - support both old and new field names
  const updateData = {
    asset_id: req.body.asset_id,
    timestamp: req.body.timestamp,
    open_price: req.body.open_price || req.body.price,
    high_price: req.body.high_price || req.body.price,
    low_price: req.body.low_price || req.body.price,
    close_price: req.body.close_price || req.body.price,
    volume: req.body.volume,
    adjusted_close: req.body.adjusted_close || req.body.close_price || req.body.price,
    change: req.body.change || req.body.change_amount,
    change_percent: req.body.change_percent || req.body.change_percentage
  };

  // Remove undefined values
  Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

  MarketData.update(updateData, {
    where: { data_id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: 'MarketData was updated successfully.'
        });
      } else {
        res.send({
          message: `Cannot update MarketData with id=${id}. Maybe MarketData was not found or req.body is empty!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: 'Error updating MarketData with id=' + id
      });
    });
};

// Delete a MarketData with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;

  MarketData.destroy({
    where: { data_id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: 'MarketData was deleted successfully!'
        });
      } else {
        res.send({
          message: `Cannot delete MarketData with id=${id}. Maybe MarketData was not found!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: 'Could not delete MarketData with id=' + id
      });
    });
};

// Delete all MarketData from the database
exports.deleteAll = (req, res) => {
  MarketData.destroy({
    where: {},
    truncate: false
  })
    .then(nums => {
      res.send({ message: `${nums} MarketData were deleted successfully!` });
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || 'Some error occurred while removing all market data.'
      });
    });
};

// Find all MarketData for a specific asset
exports.findByAsset = (req, res) => {
  const asset_id = req.params.asset_id;

  MarketData.findAll({
    where: { asset_id: asset_id },
    include: [{ model: db.assets, as: 'asset' }],
    order: [['timestamp', 'DESC']]
  })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || 'Some error occurred while retrieving market data for asset.'
      });
    });
};

// Get market statistics for a specific asset over a date range
exports.getStatistics = (req, res) => {
  const asset_id = req.params.asset_id;
  const startDate = req.query.startDate;
  const endDate = req.query.endDate || new Date().toISOString();

  if (!startDate) {
    res.status(400).send({
      message: 'startDate query parameter is required!'
    });
    return;
  }

  MarketData.findAll({
    where: {
      asset_id: asset_id,
      timestamp: {
        [db.Sequelize.Op.between]: [new Date(startDate), new Date(endDate)]
      }
    },
    order: [['timestamp', 'ASC']]
  })
    .then(data => {
      if (data.length > 0) {
        const sortedData = data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        const open = parseFloat(sortedData[0].open_price);
        const close = parseFloat(sortedData[sortedData.length - 1].close_price);
        const high = Math.max(...sortedData.map(d => parseFloat(d.high_price)));
        const low = Math.min(...sortedData.map(d => parseFloat(d.low_price)));
        const volume = sortedData.reduce((sum, d) => sum + parseInt(d.volume), 0);
        const changePercent = ((close - open) / open) * 100;

        res.send({
          asset_id: asset_id,
          period: { startDate, endDate },
          statistics: {
            open: open,
            high: high,
            low: low,
            close: close,
            volume: volume,
            change_percent: changePercent.toFixed(4)
          }
        });
      } else {
        res.status(404).send({
          message: 'No market data found for the given asset and date range.'
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || 'Some error occurred while retrieving market statistics.'
      });
    });
};

// Compare performances of multiple assets
exports.compareAssets = (req, res) => {
  const assetIds = req.body.asset_ids;

  if (!assetIds || !Array.isArray(assetIds)) {
    res.status(400).send({
      message: 'asset_ids array is required in the request body!'
    });
    return;
  }

  const promises = assetIds.map(id =>
    MarketData.findOne({
      where: { asset_id: id },
      order: [['timestamp', 'DESC']],
      include: [{ model: db.assets, as: 'asset' }]
    })
  );

  Promise.all(promises)
    .then(results => {
      const comparison = results.map((data, index) => {
        if (data) {
          return {
            asset_id: assetIds[index],
            asset_name: data.asset ? data.asset.name : 'Unknown',
            close_price: parseFloat(data.close_price),
            change_percent: parseFloat(data.change_percent),
            volume: parseInt(data.volume),
            timestamp: data.timestamp
          };
        } else {
          return {
            asset_id: assetIds[index],
            message: 'No recent market data found'
          };
        }
      });
      res.send({
        comparison: comparison
      });
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || 'Some error occurred while comparing assets.'
      });
    });
};
const db = require('../../models');
const Asset = db.assets;

// Create and Save a new Asset
exports.create = (req, res) => {
  // Validate request
  if (!req.body.symbol || !req.body.name || !req.body.asset_type) {
    res.status(400).send({
      message: 'Symbol, name, and asset_type are required!'
    });
    return;
  }

  // Create an Asset
  const asset = {
    symbol: req.body.symbol,
    name: req.body.name,
    asset_type: req.body.asset_type,
    exchange: req.body.exchange,
    sector: req.body.sector,
    industry: req.body.industry,
    market_cap: req.body.market_cap,
    description: req.body.description,
    is_active: req.body.is_active !== undefined ? req.body.is_active : true,
    last_update_date: req.body.last_update_date
  };

  // Save Asset in the database
  Asset.create(asset)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || 'Some error occurred while creating the Asset.'
      });
    });
};

// Retrieve all Assets from the database
exports.findAll = (req, res) => {
  const search = req.query.search;
  var condition = search ? {
    [db.Sequelize.Op.or]: [
      { symbol: { [db.Sequelize.Op.like]: `%${search}%` } },
      { name: { [db.Sequelize.Op.like]: `%${search}%` } }
    ]
  } : null;

  Asset.findAll({ where: condition })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || 'Some error occurred while retrieving assets.'
      });
    });
};

// Find a single Asset with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  Asset.findByPk(id)
    .then(data => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `Cannot find Asset with id=${id}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: 'Error retrieving Asset with id=' + id
      });
    });
};

// Update an Asset by the id in the request
exports.update = (req, res) => {
  const id = req.params.id;

  Asset.update(req.body, {
    where: { asset_id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: 'Asset was updated successfully.'
        });
      } else {
        res.send({
          message: `Cannot update Asset with id=${id}. Maybe Asset was not found or req.body is empty!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: 'Error updating Asset with id=' + id
      });
    });
};

// Delete an Asset with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;

  Asset.destroy({
    where: { asset_id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: 'Asset was deleted successfully!'
        });
      } else {
        res.send({
          message: `Cannot delete Asset with id=${id}. Maybe Asset was not found!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: 'Could not delete Asset with id=' + id
      });
    });
};

// Delete all Assets from the database
exports.deleteAll = (req, res) => {
  Asset.destroy({
    where: {},
    truncate: false
  })
    .then(nums => {
      res.send({ message: `${nums} Assets were deleted successfully!` });
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || 'Some error occurred while removing all assets.'
      });
    });
};

// Find all active Assets
exports.findAllActive = (req, res) => {
  Asset.findAll({ where: { is_active: true } })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || 'Some error occurred while retrieving active assets.'
      });
    });
};

// Find assets by category (asset_type)
exports.findByCategory = (req, res) => {
  const category = req.params.category.toUpperCase();

  Asset.findAll({ where: { asset_type: category } })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || 'Some error occurred while retrieving assets by category.'
      });
    });
};

// Filter assets by sector
exports.findBySector = (req, res) => {
  const sector = req.query.sector;

  Asset.findAll({ where: { sector: { [db.Sequelize.Op.like]: `%${sector}%` } } })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || 'Some error occurred while retrieving assets by sector.'
      });
    });
};
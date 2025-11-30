const db = require('../../models');
const MarketNews = db.market_news;

// Create and Save a new MarketNews
exports.create = (req, res) => {
  // Validate request
  if (!req.body.headline || !req.body.content || !req.body.priority) {
    res.status(400).send({
      message: 'Headline, content, and priority are required!'
    });
    return;
  }

  // Create a MarketNews
  const marketNews = {
    headline: req.body.headline,
    content: req.body.content,
    timestamp: req.body.timestamp || new Date(),
    priority: req.body.priority,
    tags: req.body.tags || []
  };

  // Save MarketNews in the database
  MarketNews.create(marketNews)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || 'Some error occurred while creating the MarketNews.'
      });
    });
};

// Retrieve all MarketNews from the database
exports.findAll = (req, res) => {
  const priority = req.query.priority;
  var condition = priority ? { priority: priority } : null;

  MarketNews.findAll({ where: condition, order: [['timestamp', 'DESC']] })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || 'Some error occurred while retrieving market news.'
      });
    });
};

// Find a single MarketNews with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  MarketNews.findByPk(id)
    .then(data => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `Cannot find MarketNews with id=${id}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: 'Error retrieving MarketNews with id=' + id
      });
    });
};

// Update a MarketNews by the id in the request
exports.update = (req, res) => {
  const id = req.params.id;

  MarketNews.update(req.body, {
    where: { news_id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: 'MarketNews was updated successfully.'
        });
      } else {
        res.send({
          message: `Cannot update MarketNews with id=${id}. Maybe MarketNews was not found or req.body is empty!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: 'Error updating MarketNews with id=' + id
      });
    });
};

// Delete a MarketNews with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;

  MarketNews.destroy({
    where: { news_id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: 'MarketNews was deleted successfully!'
        });
      } else {
        res.send({
          message: `Cannot delete MarketNews with id=${id}. Maybe MarketNews was not found!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: 'Could not delete MarketNews with id=' + id
      });
    });
};

// Delete all MarketNews from the database
exports.deleteAll = (req, res) => {
  MarketNews.destroy({
    where: {},
    truncate: false
  })
    .then(nums => {
      res.send({ message: `${nums} MarketNews were deleted successfully!` });
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || 'Some error occurred while removing all market news.'
      });
    });
};

// Find all MarketNews by priority
exports.findByPriority = (req, res) => {
  const priority = req.params.priority;

  MarketNews.findAll({
    where: { priority: priority },
    order: [['timestamp', 'DESC']]
  })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || 'Some error occurred while retrieving market news by priority.'
      });
    });
};

// Find latest MarketNews
exports.findLatest = (req, res) => {
  const limit = parseInt(req.query.limit) || 10;

  MarketNews.findAll({
    order: [['timestamp', 'DESC']],
    limit: limit
  })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || 'Some error occurred while retrieving latest market news.'
      });
    });
};
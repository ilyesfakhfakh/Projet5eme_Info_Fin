const db = require('../../models');
const NewsArticle = db.news_articles;

// Create and Save a new NewsArticle
exports.create = (req, res) => {
  // Validate request
  if (!req.body.title || !req.body.content || !req.body.category) {
    res.status(400).send({
      message: 'Title, content, and category are required!'
    });
    return;
  }

  // Create a NewsArticle
  const newsArticle = {
    title: req.body.title,
    content: req.body.content,
    summary: req.body.summary,
    author: req.body.author,
    source: req.body.source,
    publish_date: req.body.publish_date || new Date(),
    category: req.body.category,
    related_assets: req.body.related_assets || [],
    sentiment: req.body.sentiment,
    impact_level: req.body.impact_level,
    tags: req.body.tags || []
  };

  // Save NewsArticle in the database
  NewsArticle.create(newsArticle)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || 'Some error occurred while creating the NewsArticle.'
      });
    });
};

// Retrieve all NewsArticles from the database with pagination and tag filtering
exports.findAll = (req, res) => {
  const category = req.query.category;
  const author = req.query.author;
  const tag = req.query.tag;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  var condition = {};

  if (category) condition.category = category;
  if (author) condition.author = { [db.Sequelize.Op.iLike]: `%${author}%` };
  if (tag) {
    condition.tags = { [db.Sequelize.Op.contains]: [tag] };
  }

  NewsArticle.findAndCountAll({
    where: condition,
    order: [['publish_date', 'DESC']],
    limit: limit,
    offset: offset
  })
    .then(result => {
      const response = {
        articles: result.rows,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(result.count / limit),
          totalItems: result.count,
          itemsPerPage: limit,
          hasNextPage: page * limit < result.count,
          hasPrevPage: page > 1
        }
      };
      res.send(response);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || 'Some error occurred while retrieving news articles.'
      });
    });
};

// Find a single NewsArticle with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  NewsArticle.findByPk(id)
    .then(data => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `Cannot find NewsArticle with id=${id}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: 'Error retrieving NewsArticle with id=' + id
      });
    });
};

// Update a NewsArticle by the id in the request
exports.update = (req, res) => {
  const id = req.params.id;

  NewsArticle.update(req.body, {
    where: { article_id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: 'NewsArticle was updated successfully.'
        });
      } else {
        res.send({
          message: `Cannot update NewsArticle with id=${id}. Maybe NewsArticle was not found or req.body is empty!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: 'Error updating NewsArticle with id=' + id
      });
    });
};

// Delete a NewsArticle with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;

  NewsArticle.destroy({
    where: { article_id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: 'NewsArticle was deleted successfully!'
        });
      } else {
        res.send({
          message: `Cannot delete NewsArticle with id=${id}. Maybe NewsArticle was not found!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: 'Could not delete NewsArticle with id=' + id
      });
    });
};

// Delete all NewsArticles from the database
exports.deleteAll = (req, res) => {
  NewsArticle.destroy({
    where: {},
    truncate: false
  })
    .then(nums => {
      res.send({ message: `${nums} NewsArticles were deleted successfully!` });
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || 'Some error occurred while removing all news articles.'
      });
    });
};

// Find all NewsArticles by category with pagination
exports.findByCategory = (req, res) => {
  const category = req.params.category;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  NewsArticle.findAndCountAll({
    where: { category: category },
    order: [['publish_date', 'DESC']],
    limit: limit,
    offset: offset
  })
    .then(result => {
      const response = {
        articles: result.rows,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(result.count / limit),
          totalItems: result.count,
          itemsPerPage: limit,
          hasNextPage: page * limit < result.count,
          hasPrevPage: page > 1
        }
      };
      res.send(response);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || 'Some error occurred while retrieving news articles by category.'
      });
    });
};

// Find latest NewsArticles with pagination
exports.findLatest = (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  NewsArticle.findAndCountAll({
    order: [['publish_date', 'DESC']],
    limit: limit,
    offset: offset
  })
    .then(result => {
      const response = {
        articles: result.rows,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(result.count / limit),
          totalItems: result.count,
          itemsPerPage: limit,
          hasNextPage: page * limit < result.count,
          hasPrevPage: page > 1
        }
      };
      res.send(response);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || 'Some error occurred while retrieving latest news articles.'
      });
    });
};

// Find NewsArticles by related asset with pagination
exports.findByAsset = (req, res) => {
  const asset_id = req.params.asset_id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  NewsArticle.findAndCountAll({
    where: {
      related_assets: {
        [db.Sequelize.Op.contains]: [asset_id]
      }
    },
    order: [['publish_date', 'DESC']],
    limit: limit,
    offset: offset
  })
    .then(result => {
      const response = {
        articles: result.rows,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(result.count / limit),
          totalItems: result.count,
          itemsPerPage: limit,
          hasNextPage: page * limit < result.count,
          hasPrevPage: page > 1
        }
      };
      res.send(response);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || 'Some error occurred while retrieving news articles by asset.'
      });
    });
};

// Find NewsArticles by tag with pagination
exports.findByTag = (req, res) => {
  const tag = req.params.tag;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  NewsArticle.findAndCountAll({
    where: {
      tags: {
        [db.Sequelize.Op.contains]: [tag]
      }
    },
    order: [['publish_date', 'DESC']],
    limit: limit,
    offset: offset
  })
    .then(result => {
      const response = {
        articles: result.rows,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(result.count / limit),
          totalItems: result.count,
          itemsPerPage: limit,
          hasNextPage: page * limit < result.count,
          hasPrevPage: page > 1
        }
      };
      res.send(response);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || 'Some error occurred while retrieving news articles by tag.'
      });
    });
};

// Get all unique tags
exports.getAllTags = (req, res) => {
  NewsArticle.findAll({
    attributes: ['tags']
  })
    .then(articles => {
      const allTags = new Set();
      articles.forEach(article => {
        if (article.tags && Array.isArray(article.tags)) {
          article.tags.forEach(tag => allTags.add(tag));
        }
      });
      res.send({ tags: Array.from(allTags).sort() });
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || 'Some error occurred while retrieving tags.'
      });
    });
};
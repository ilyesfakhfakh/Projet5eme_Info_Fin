module.exports = app => {
  const newsArticles = require('../../controllers/news/news-article.controller.js');

  var router = require('express').Router();

  // Create a new NewsArticle
  router.post('/', newsArticles.create);

  // Retrieve all NewsArticles
  router.get('/', newsArticles.findAll);

  // Retrieve latest NewsArticles
  router.get('/latest', newsArticles.findLatest);

  // Retrieve all NewsArticles by category
  router.get('/category/:category', newsArticles.findByCategory);

  // Retrieve all NewsArticles by related asset
  router.get('/asset/:asset_id', newsArticles.findByAsset);

  // Retrieve all NewsArticles by tag
  router.get('/tag/:tag', newsArticles.findByTag);

  // Retrieve all available tags
  router.get('/tags/all', newsArticles.getAllTags);

  // Retrieve a single NewsArticle with id
  router.get('/:id', newsArticles.findOne);

  // Update a NewsArticle with id
  router.put('/:id', newsArticles.update);

  // Delete a NewsArticle with id
  router.delete('/:id', newsArticles.delete);

  // Delete all NewsArticles
  router.delete('/', newsArticles.deleteAll);

  app.use('/api/news-articles', router);
};
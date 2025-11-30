const express = require('express');
const router = express.Router();
const db = require('../models');
const Assets = db.assets;

// Get all assets
router.get('/', async (req, res) => {
  try {
    const { asset_type, symbol } = req.query;
    const where = {};
    
    if (asset_type) where.asset_type = asset_type;
    if (symbol) where.symbol = symbol;

    const assets = await Assets.findAll({
      where,
      order: [['asset_name', 'ASC']]
    });
    
    return res.json(assets);
  } catch (error) {
    console.error('Error fetching assets:', error);
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) });
  }
});

// Get asset by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const asset = await Assets.findByPk(id);
    
    if (!asset) {
      return res.status(404).json({ message: 'Asset introuvable' });
    }
    
    return res.json(asset);
  } catch (error) {
    console.error('Error fetching asset:', error);
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) });
  }
});

// Create asset
router.post('/', async (req, res) => {
  try {
    const asset = await Assets.create(req.body);
    return res.status(201).json(asset);
  } catch (error) {
    console.error('Error creating asset:', error);
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) });
  }
});

// Update asset
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [count] = await Assets.update(req.body, { where: { asset_id: id } });
    
    if (count === 0) {
      return res.status(404).json({ message: 'Asset introuvable ou pas de modification' });
    }
    
    const updated = await Assets.findByPk(id);
    return res.json(updated);
  } catch (error) {
    console.error('Error updating asset:', error);
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) });
  }
});

// Delete asset
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const count = await Assets.destroy({ where: { asset_id: id } });
    
    if (count === 0) {
      return res.status(404).json({ message: 'Asset introuvable' });
    }
    
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting asset:', error);
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) });
  }
});

module.exports = router;

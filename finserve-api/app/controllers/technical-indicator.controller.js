const express = require('express')
const router = express.Router()

const db = require('../models')
const technicalIndicatorService = require('../services/technical-indicator.service')

// Créer un nouvel indicateur technique
//router.post('/technical-indicators', async (req, res) => {
// try {
//   const indicatorData = req.body
//    if (!indicatorData.asset_id || !indicatorData.indicator_type || !indicatorData.period) {
//      return res.status(400).json({ message: 'Champs requis manquants' })
//    }
//    const indicator = await technicalIndicatorService.createTechnicalIndicator(indicatorData)
//  return res.status(201).json(indicator)
//} catch (error) {
//   return res.status(500).json({ message: 'Erreur serveur', error: error.message })
//}
//})

router.post('/technical-indicators', async (req, res) => {
  try {
    console.log("🟢 Requête reçue :", req.body);

    const { asset_id, indicator_type, period, parameters = {} } = req.body;

    console.log("🔍 Vérification des champs requis:");
    console.log("- asset_id:", asset_id);
    console.log("- indicator_type:", indicator_type);

    if (!asset_id || !indicator_type) {
      console.log("❌ Champs manquants détectés");
      return res.status(400).json({ message: 'Champs requis manquants: asset_id et indicator_type' });
    }

    console.log("✅ Champs valides, création de l'indicateur...");

    const indicator = await db.technical_indicators.create({
      asset_id,
      indicator_type,
      period: period || parameters.period || 14,
      parameters,
      values: [],
      last_calculation_date: null
    });

    console.log("✅ Indicateur créé avec succès:", indicator.indicator_id);

    return res.status(201).json(indicator);
  } catch (error) {
    console.error("❌ Erreur serveur :", error);
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});



// Récupérer tous les indicateurs techniques
router.get('/technical-indicators', async (req, res) => {
  try {
    const options = req.query
    const indicators = await technicalIndicatorService.getTechnicalIndicators(options)
    return res.json(indicators)
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message })
  }
})

// Récupérer un indicateur technique par ID
router.get('/technical-indicators/:indicatorId', async (req, res) => {
  try {
    const { indicatorId } = req.params
    const indicator = await technicalIndicatorService.getTechnicalIndicatorById(indicatorId)
    return res.json(indicator)
  } catch (error) {
    return res.status(404).json({ message: 'Indicateur technique introuvable', error: error.message })
  }
})

// Mettre à jour un indicateur technique
router.put('/technical-indicators/:indicatorId', async (req, res) => {
  try {
    const { indicatorId } = req.params
    const updateData = req.body
    const indicator = await technicalIndicatorService.updateTechnicalIndicator(indicatorId, updateData)
    return res.json(indicator)
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message })
  }
})

// Supprimer un indicateur technique
router.delete('/technical-indicators/:indicatorId', async (req, res) => {
  try {
    const { indicatorId } = req.params
    const result = await technicalIndicatorService.deleteTechnicalIndicator(indicatorId)
    return res.json(result)
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message })
  }
})

// Récupérer les indicateurs techniques par asset ID
router.get('/technical-indicators/asset/:assetId', async (req, res) => {
  try {
    const { assetId } = req.params
    const indicators = await technicalIndicatorService.getTechnicalIndicatorsByAssetId(assetId)
    return res.json(indicators)
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message })
  }
})

// Récupérer les indicateurs techniques par type
router.get('/technical-indicators/type/:indicatorType', async (req, res) => {
  try {
    const { indicatorType } = req.params
    const indicators = await technicalIndicatorService.getTechnicalIndicatorsByType(indicatorType)
    return res.json(indicators)
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message })
  }
})

// Calculer un indicateur technique
router.post('/technical-indicators/:indicatorId/calculate', async (req, res) => {
  try {
    const { indicatorId } = req.params
    const result = await technicalIndicatorService.calculateTechnicalIndicator(indicatorId)
    return res.json(result)
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message })
  }
})

// Récupérer les valeurs d'un indicateur technique
router.get('/technical-indicators/:indicatorId/values', async (req, res) => {
  try {
    const { indicatorId } = req.params
    const { limit = 100 } = req.query
    const values = await technicalIndicatorService.getTechnicalIndicatorValues(indicatorId, parseInt(limit))
    return res.json(values)
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message })
  }
})


router.post('/', async (req, res) => {
  try {
    const {
      name,
      type,
      parameters,
      description,
      asset_id
    } = req.body;

    if (!name || !type || !parameters) {
      return res.status(400).json({ message: 'Champs requis manquants' });
    }

    const created = await db.technicalIndicators.create({
      name,
      type,
      parameters,
      description,
      asset_id
    });

    return res.status(201).json(created);
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) });
  }
});

router.get('/', async (req, res) => {
  try {
    const { asset_id, type } = req.query;
    const where = {};
    if (asset_id) where.asset_id = asset_id;
    if (type) where.type = type;

    const items = await db.technicalIndicators.findAll({ where, order: [['createdAt', 'DESC']] });
    return res.json(items);
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const item = await db.technicalIndicators.findByPk(id);
    if (!item) return res.status(404).json({ message: 'Indicateur technique introuvable' });
    return res.json(item);
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [count] = await db.technicalIndicators.update(req.body, { where: { id } });
    if (count === 0) return res.status(404).json({ message: 'Indicateur technique introuvable ou pas de modification' });
    const updated = await db.technicalIndicators.findByPk(id);
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const count = await db.technicalIndicators.destroy({ where: { id } });
    if (count === 0) return res.status(404).json({ message: 'Indicateur technique introuvable' });
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) });
  }
});

// Calculate indicator values
router.get('/:indicatorId/calculate/:assetId/:period', async (req, res) => {
  try {
    const { indicatorId, assetId, period } = req.params;
    const values = await technicalIndicatorService.calculateIndicator(
      parseInt(indicatorId),
      parseInt(assetId),
      period
    );
    return res.json({
      success: true,
      data: values,
      message: 'Indicateur calculé avec succès'
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) });
  }
});

// Update indicator values
router.post('/:indicatorId/update', async (req, res) => {
  try {
    const { indicatorId } = req.params;
    await technicalIndicatorService.updateIndicatorValues(parseInt(indicatorId));
    return res.json({
      success: true,
      message: 'Valeurs d\'indicateur mises à jour avec succès'
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) });
  }
});

// Batch recalculate all indicators
router.post('/batch-recalculate', async (req, res) => {
  try {
    await technicalIndicatorService.batchRecalculateIndicators();
    return res.json({
      success: true,
      message: 'Tous les indicateurs recalculés avec succès'
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) });
  }
});

// Generate trading signal
router.get('/signal/:indicatorValue/:indicatorType', async (req, res) => {
  try {
    const { indicatorValue, indicatorType } = req.params;
    const signal = technicalIndicatorService.generateSignal(parseFloat(indicatorValue), indicatorType);
    return res.json({
      success: true,
      data: { signal },
      message: 'Signal généré avec succès'
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) });
  }
});

// Detect trend for specific indicator and asset
router.get('/:indicatorId/trend/:assetId', async (req, res) => {
  try {
    const { indicatorId, assetId } = req.params;
    const trend = await technicalIndicatorService.detectTrend(parseInt(indicatorId), parseInt(assetId));
    return res.json({
      success: true,
      data: { trend },
      message: 'Tendance détectée avec succès'
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) });
  }
});

// Combine two indicators
router.get('/combine/:primaryId/:secondaryId/:assetId', async (req, res) => {
  try {
    const { primaryId, secondaryId, assetId } = req.params;
    const signal = await technicalIndicatorService.combineWith(
      parseInt(primaryId),
      parseInt(secondaryId),
      parseInt(assetId)
    );
    return res.json({
      success: true,
      data: { signal },
      message: 'Indicateurs combinés avec succès'
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) });
  }
});

// Optimize indicator parameters
router.post('/:indicatorId/optimize/:assetId', async (req, res) => {
  try {
    const { indicatorId, assetId } = req.params;
    const { parameterRanges } = req.body;
    const result = await technicalIndicatorService.optimizeParameters(
      parseInt(indicatorId),
      parseInt(assetId),
      parameterRanges
    );
    return res.json({
      success: true,
      data: result,
      message: 'Paramètres optimisés avec succès'
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) });
  }
});

// Get historical values
router.get('/:indicatorId/history/:assetId', async (req, res) => {
  try {
    const { indicatorId, assetId } = req.params;
    const { startDate, endDate } = req.query;
    const values = await technicalIndicatorService.getHistoricalValues(
      parseInt(indicatorId),
      parseInt(assetId),
      new Date(startDate),
      new Date(endDate)
    );
    return res.json({
      success: true,
      data: values,
      message: 'Valeurs historiques récupérées avec succès'
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) });
  }
});

// Evaluate indicator performance
router.get('/:indicatorId/performance/:assetId', async (req, res) => {
  try {
    const { indicatorId, assetId } = req.params;
    const { startDate, endDate } = req.query;
    const performance = await technicalIndicatorService.evaluatePerformance(
      parseInt(indicatorId),
      parseInt(assetId),
      new Date(startDate),
      new Date(endDate)
    );
    return res.json({
      success: true,
      data: performance,
      message: 'Performance évaluée avec succès'
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) });
  }
});

// Predict next signal
router.get('/:indicatorId/predict/:assetId', async (req, res) => {
  try {
    const { indicatorId, assetId } = req.params;
    const prediction = await technicalIndicatorService.predictNextSignal(
      parseInt(indicatorId),
      parseInt(assetId)
    );
    return res.json({
      success: true,
      data: { prediction },
      message: 'Prochain signal prédit avec succès'
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) });
  }
});

// Recalculate indicator completely
router.post('/:indicatorId/recalculate', async (req, res) => {
  try {
    const { indicatorId } = req.params;
    await technicalIndicatorService.recalculate(parseInt(indicatorId));
    return res.json({
      success: true,
      message: 'Indicateur recalculé avec succès'
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) });
  }
});

// Validate indicator parameters
router.post('/validate', async (req, res) => {
  try {
    const { indicatorType, parameters } = req.body;
    const isValid = technicalIndicatorService.validateParameters(indicatorType, parameters);
    return res.json({
      success: true,
      data: { isValid },
      message: isValid ? 'Paramètres valides' : 'Paramètres invalides'
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) });
  }
});

// Check for signal change alerts
router.get('/alert/:assetId', async (req, res) => {
  try {
    const { assetId } = req.params;
    const alert = await technicalIndicatorService.alertOnSignalChange(parseInt(assetId));
    if (alert) {
      return res.json({
        success: true,
        data: alert,
        message: 'Changement de signal détecté'
      });
    } else {
      return res.json({
        success: true,
        data: null,
        message: 'Aucun changement de signal détecté'
      });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) });
  }
});

module.exports = router
const express = require('express')
const router = express.Router()

const db = require('../models')
const indicatorValueService = require('../services/indicator-value.service')

// Créer une nouvelle valeur d'indicateur
router.post('/', async (req, res) => {
  try {
    const valueData = req.body
    if (!valueData.indicator_id || !valueData.timestamp || !valueData.value) {
      return res.status(400).json({ message: 'Champs requis manquants' })
    }
    const value = await indicatorValueService.createIndicatorValue(valueData)
    return res.status(201).json(value)
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message })
  }
})

// Créer plusieurs valeurs d'indicateur en bulk
router.post('/bulk', async (req, res) => {
  try {
    const valuesData = req.body
    if (!Array.isArray(valuesData) || valuesData.length === 0) {
      return res.status(400).json({ message: 'Données de valeurs requises sous forme de tableau' })
    }
    const values = await indicatorValueService.bulkCreateIndicatorValues(valuesData)
    return res.status(201).json(values)
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message })
  }
})

// Récupérer toutes les valeurs d'indicateur
router.get('/', async (req, res) => {
  try {
    const options = req.query
    const values = await indicatorValueService.getIndicatorValues(options)
    return res.json(values)
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message })
  }
})

// Récupérer une valeur d'indicateur par ID
router.get('/:valueId', async (req, res) => {
  try {
    const { valueId } = req.params
    const value = await indicatorValueService.getIndicatorValueById(valueId)
    return res.json(value)
  } catch (error) {
    return res.status(404).json({ message: 'Valeur d\'indicateur introuvable', error: error.message })
  }
})

// Mettre à jour une valeur d'indicateur
router.put('/:valueId', async (req, res) => {
  try {
    const { valueId } = req.params
    const updateData = req.body
    const value = await indicatorValueService.updateIndicatorValue(valueId, updateData)
    return res.json(value)
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message })
  }
})

// Supprimer une valeur d'indicateur
router.delete('/:valueId', async (req, res) => {
  try {
    const { valueId } = req.params
    const result = await indicatorValueService.deleteIndicatorValue(valueId)
    return res.json(result)
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message })
  }
})

// Récupérer les valeurs d'indicateur par indicateur ID
router.get('/indicator/:indicatorId', async (req, res) => {
  try {
    const { indicatorId } = req.params
    const values = await indicatorValueService.getIndicatorValuesByIndicatorId(indicatorId)
    return res.json(values)
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message })
  }
})

// Récupérer les valeurs d'indicateur par indicateur ID et plage de dates
router.get('/indicator/:indicatorId/range', async (req, res) => {
  try {
    const { indicatorId } = req.params
    const { startDate, endDate } = req.query
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'startDate et endDate requis' })
    }
    const values = await indicatorValueService.getIndicatorValuesByIndicatorIdAndDateRange(
      indicatorId,
      startDate,
      endDate
    )
    return res.json(values)
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message })
  }
})

// Récupérer la dernière valeur d'indicateur par indicateur ID
router.get('/indicator/:indicatorId/latest', async (req, res) => {
  try {
    const { indicatorId } = req.params
    const value = await indicatorValueService.getLatestIndicatorValueByIndicatorId(indicatorId)
    return res.json(value)
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message })
  }
})

// Récupérer les valeurs d'indicateur par signal
router.get('/signal/:signal', async (req, res) => {
  try {
    const { signal } = req.params
    if (!['BUY', 'SELL', 'HOLD'].includes(signal)) {
      return res.status(400).json({ message: 'Signal doit être BUY, SELL ou HOLD' })
    }
    const values = await indicatorValueService.getIndicatorValuesBySignal(signal)
    return res.json(values)
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message })
  }
})

// Supprimer toutes les valeurs d'indicateur par indicateur ID
router.delete('/indicator/:indicatorId', async (req, res) => {
  try {
    const { indicatorId } = req.params
    const result = await indicatorValueService.deleteIndicatorValuesByIndicatorId(indicatorId)
    return res.json(result)
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message })
  }

})




module.exports = router
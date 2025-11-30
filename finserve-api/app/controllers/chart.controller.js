const express = require('express')
const router = express.Router()

const db = require('../models')
const chartService = require('../services/chart.service')

// Créer un nouveau chart
router.post('/charts', async (req, res) => {
  try {
    const chartData = req.body
    if (!chartData.asset_id || !chartData.chart_type) {
      return res.status(400).json({ message: 'Champs requis manquants' })
    }
    const chart = await chartService.createChart(chartData)
    return res.status(201).json(chart)
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message })
  }
})

// Récupérer tous les charts
router.get('/charts', async (req, res) => {
  try {
    const options = req.query
    const charts = await chartService.getCharts(options)
    return res.json(charts)
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message })
  }
})

// Récupérer un chart par ID
router.get('/charts/:chartId', async (req, res) => {
  try {
    const { chartId } = req.params
    const chart = await chartService.getChartById(chartId)
    return res.json(chart)
  } catch (error) {
    return res.status(404).json({ message: 'Chart introuvable', error: error.message })
  }
})

// Mettre à jour un chart
router.put('/charts/:chartId', async (req, res) => {
  try {
    const { chartId } = req.params
    const updateData = req.body
    const chart = await chartService.updateChart(chartId, updateData)
    return res.json(chart)
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message })
  }
})

// Supprimer un chart
router.delete('/charts/:chartId', async (req, res) => {
  try {
    const { chartId } = req.params
    const result = await chartService.deleteChart(chartId)
    return res.json(result)
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message })
  }
})

// Récupérer les charts par asset ID
router.get('/charts/asset/:assetId', async (req, res) => {
  try {
    const { assetId } = req.params
    const charts = await chartService.getChartsByAssetId(assetId)
    return res.json(charts)
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message })
  }
})

// Récupérer les charts par type
router.get('/charts/type/:chartType', async (req, res) => {
  try {
    const { chartType } = req.params
    const charts = await chartService.getChartsByType(chartType)
    return res.json(charts)
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message })
  }
})

// Mettre à jour les annotations d'un chart
router.put('/charts/:chartId/annotations', async (req, res) => {
  try {
    const { chartId } = req.params
    const { annotations } = req.body
    if (!annotations) {
      return res.status(400).json({ message: 'Annotations requises' })
    }
    const chart = await chartService.updateChartAnnotations(chartId, annotations)
    return res.json(chart)
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message })
  }
})

// Récupérer un chart avec ses indicateurs
router.get('/charts/:chartId/with-indicators', async (req, res) => {
  try {
    const { chartId } = req.params
    const chart = await chartService.getChartWithIndicators(chartId)
    return res.json(chart)
  } catch (error) {
    return res.status(404).json({ message: 'Chart introuvable', error: error.message })
  }
})

module.exports = router
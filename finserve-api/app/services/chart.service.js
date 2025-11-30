const { Op } = require('sequelize')
const db = require('../models')

async function createChart(chartData) {
  try {
    const chart = await db.charts.create(chartData)
    return chart
  } catch (error) {
    throw new Error(`Error creating chart: ${error.message}`)
  }
}

async function getCharts(options = {}) {
  try {
    const charts = await db.charts.findAll(options)
    return charts
  } catch (error) {
    throw new Error(`Error finding charts: ${error.message}`)
  }
}

async function getChartById(chartId) {
  try {
    const chart = await db.charts.findByPk(chartId)
    if (!chart) {
      throw new Error('Chart not found')
    }
    return chart
  } catch (error) {
    throw new Error(`Error finding chart: ${error.message}`)
  }
}

async function updateChart(chartId, updateData) {
  try {
    const [updatedRowsCount] = await db.charts.update(updateData, {
      where: { chart_id: chartId },
    })
    if (updatedRowsCount === 0) {
      throw new Error('Chart not found or no changes made')
    }
    return await getChartById(chartId)
  } catch (error) {
    throw new Error(`Error updating chart: ${error.message}`)
  }
}

async function deleteChart(chartId) {
  try {
    const deletedRowsCount = await db.charts.destroy({
      where: { chart_id: chartId },
    })
    if (deletedRowsCount === 0) {
      throw new Error('Chart not found')
    }
    return { message: 'Chart deleted successfully' }
  } catch (error) {
    throw new Error(`Error deleting chart: ${error.message}`)
  }
}

async function getChartsByAssetId(assetId) {
  try {
    const charts = await db.charts.findAll({
      where: { asset_id: assetId },
    })
    return charts
  } catch (error) {
    throw new Error(`Error finding charts by asset ID: ${error.message}`)
  }
}

async function getChartsByType(chartType) {
  try {
    const charts = await db.charts.findAll({
      where: { chart_type: chartType },
    })
    return charts
  } catch (error) {
    throw new Error(`Error finding charts by type: ${error.message}`)
  }
}

async function updateChartAnnotations(chartId, annotations) {
  try {
    const [updatedRowsCount] = await db.charts.update(
      { annotations: annotations },
      { where: { chart_id: chartId } }
    )
    if (updatedRowsCount === 0) {
      throw new Error('Chart not found')
    }
    return await getChartById(chartId)
  } catch (error) {
    throw new Error(`Error updating chart annotations: ${error.message}`)
  }
}

async function getChartWithIndicators(chartId) {
  try {
    const chart = await db.charts.findByPk(chartId, {
      include: [
        {
          model: db.assets,
          as: 'asset',
          attributes: ['asset_id', 'symbol', 'name'],
        },
        {
          model: db.technical_indicators,
          as: 'technical_indicators',
          where: { asset_id: db.sequelize.col('charts.asset_id') },
          required: false,
        },
      ],
    })
    if (!chart) {
      throw new Error('Chart not found')
    }
    return chart
  } catch (error) {
    throw new Error(`Error getting chart with indicators: ${error.message}`)
  }
}

module.exports = {
  createChart,
  getCharts,
  getChartById,
  updateChart,
  deleteChart,
  getChartsByAssetId,
  getChartsByType,
  updateChartAnnotations,
  getChartWithIndicators,
}
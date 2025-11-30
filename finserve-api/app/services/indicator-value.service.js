const { Op } = require('sequelize')
const db = require('../models')

async function createIndicatorValue(valueData) {
  try {
    const value = await db.indicator_values.create(valueData)
    return value
  } catch (error) {
    throw new Error(`Error creating indicator value: ${error.message}`)
  }
}

async function getIndicatorValues(options = {}) {
  try {
    const values = await db.indicator_values.findAll(options)
    return values
  } catch (error) {
    throw new Error(`Error finding indicator values: ${error.message}`)
  }
}

async function getIndicatorValueById(valueId) {
  try {
    const value = await db.indicator_values.findByPk(valueId)
    if (!value) {
      throw new Error('Indicator value not found')
    }
    return value
  } catch (error) {
    throw new Error(`Error finding indicator value: ${error.message}`)
  }
}

async function updateIndicatorValue(valueId, updateData) {
  try {
    const [updatedRowsCount] = await db.indicator_values.update(updateData, {
      where: { value_id: valueId },
    })
    if (updatedRowsCount === 0) {
      throw new Error('Indicator value not found or no changes made')
    }
    return await getIndicatorValueById(valueId)
  } catch (error) {
    throw new Error(`Error updating indicator value: ${error.message}`)
  }
}

async function deleteIndicatorValue(valueId) {
  try {
    const deletedRowsCount = await db.indicator_values.destroy({
      where: { value_id: valueId },
    })
    if (deletedRowsCount === 0) {
      throw new Error('Indicator value not found')
    }
    return { message: 'Indicator value deleted successfully' }
  } catch (error) {
    throw new Error(`Error deleting indicator value: ${error.message}`)
  }
}

async function getIndicatorValuesByIndicatorId(indicatorId) {
  try {
    const values = await db.indicator_values.findAll({
      where: { indicator_id: indicatorId },
      order: [['timestamp', 'ASC']],
    })
    return values
  } catch (error) {
    throw new Error(`Error finding indicator values by indicator ID: ${error.message}`)
  }
}

async function getIndicatorValuesByIndicatorIdAndDateRange(indicatorId, startDate, endDate) {
  try {
    const values = await db.indicator_values.findAll({
      where: {
        indicator_id: indicatorId,
        timestamp: {
          [Op.between]: [startDate, endDate],
        },
      },
      order: [['timestamp', 'ASC']],
    })
    return values
  } catch (error) {
    throw new Error(`Error finding indicator values by date range: ${error.message}`)
  }
}

async function getLatestIndicatorValueByIndicatorId(indicatorId) {
  try {
    const value = await db.indicator_values.findOne({
      where: { indicator_id: indicatorId },
      order: [['timestamp', 'DESC']],
    })
    return value
  } catch (error) {
    throw new Error(`Error finding latest indicator value: ${error.message}`)
  }
}

async function getIndicatorValuesBySignal(signal) {
  try {
    const values = await db.indicator_values.findAll({
      where: { signal: signal },
      order: [['timestamp', 'DESC']],
    })
    return values
  } catch (error) {
    throw new Error(`Error finding indicator values by signal: ${error.message}`)
  }
}

async function bulkCreateIndicatorValues(valuesData) {
  try {
    const values = await db.indicator_values.bulkCreate(valuesData)
    return values
  } catch (error) {
    throw new Error(`Error bulk creating indicator values: ${error.message}`)
  }
}

async function deleteIndicatorValuesByIndicatorId(indicatorId) {
  try {
    const deletedRowsCount = await db.indicator_values.destroy({
      where: { indicator_id: indicatorId },
    })
    return { message: `${deletedRowsCount} indicator values deleted successfully` }
  } catch (error) {
    throw new Error(`Error deleting indicator values by indicator ID: ${error.message}`)
  }
}

module.exports = {
  createIndicatorValue,
  getIndicatorValues,
  getIndicatorValueById,
  updateIndicatorValue,
  deleteIndicatorValue,
  getIndicatorValuesByIndicatorId,
  getIndicatorValuesByIndicatorIdAndDateRange,
  getLatestIndicatorValueByIndicatorId,
  getIndicatorValuesBySignal,
  bulkCreateIndicatorValues,
  deleteIndicatorValuesByIndicatorId,
}
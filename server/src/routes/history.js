const express = require('express')
const router = express.Router()
const DataManager = require('../services/DataManager')
const { validateQuery, commonSchemas } = require('../middleware/validation')
const { asyncHandler } = require('../middleware/errorHandler')

const dataManager = new DataManager()

// GET /api/history - Get history entries
router.get('/', 
  validateQuery(commonSchemas.pagination, { allowUnknown: true }),
  asyncHandler(async (req, res) => {
    const { limit } = req.query
    const history = await dataManager.getHistory(limit)
    
    res.json({
      history,
      total: history.length,
      limit
    })
  })
)

// GET /api/history/search - Search history
router.get('/search',
  validateQuery(commonSchemas.search),
  asyncHandler(async (req, res) => {
    const { q, limit } = req.query
    const results = await dataManager.searchHistory(q, limit)
    
    res.json({
      results,
      query: q,
      total: results.length,
      limit
    })
  })
)

module.exports = router
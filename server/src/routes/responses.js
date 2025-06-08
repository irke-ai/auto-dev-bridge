const express = require('express')
const router = express.Router()
const DataManager = require('../services/DataManager')
const { validate, validateParams, validateQuery, commonSchemas } = require('../middleware/validation')
const { responseSchema } = require('../schemas/responseSchema')
const { asyncHandler } = require('../middleware/errorHandler')

const dataManager = new DataManager()

// GET /api/responses - Get all responses
router.get('/', 
  validateQuery(commonSchemas.pagination, { allowUnknown: true }),
  asyncHandler(async (req, res) => {
    const responses = await dataManager.getResponses()
    
    // Apply pagination
    const { limit, offset, sort, order } = req.query
    
    // Sort responses
    const sortedResponses = responses.sort((a, b) => {
      const aValue = a[sort] || a.timestamp
      const bValue = b[sort] || b.timestamp
      
      if (order === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })
    
    const paginatedResponses = sortedResponses.slice(offset, offset + limit)
    
    res.json({
      responses: paginatedResponses,
      pagination: {
        total: responses.length,
        limit,
        offset,
        hasMore: offset + limit < responses.length
      }
    })
  })
)

// POST /api/responses - Create new response
router.post('/',
  validate(responseSchema),
  asyncHandler(async (req, res) => {
    const response = await dataManager.createResponse(req.body)
    
    // Add to history
    await dataManager.addToHistory('response_created', response)
    
    res.status(201).json({
      message: 'Response created successfully',
      response
    })
  })
)

// GET /api/responses/latest - Get latest responses
router.get('/latest',
  validateQuery(commonSchemas.pagination, { allowUnknown: true }),
  asyncHandler(async (req, res) => {
    const responses = await dataManager.getResponses()
    const { limit } = req.query
    
    const latestResponses = responses.slice(0, limit)
    
    res.json({
      responses: latestResponses,
      total: responses.length
    })
  })
)

// GET /api/responses/:id - Get specific response
router.get('/:id',
  validateParams(commonSchemas.id),
  asyncHandler(async (req, res) => {
    const response = await dataManager.getResponse(req.params.id)
    
    if (!response) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Response with id ${req.params.id} not found`
      })
    }
    
    res.json({ response })
  })
)

// GET /api/responses/request/:requestId - Get responses for specific request
router.get('/request/:requestId',
  validateParams({
    requestId: require('joi').string().required()
  }),
  asyncHandler(async (req, res) => {
    const responses = await dataManager.getResponsesByRequestId(req.params.requestId)
    
    res.json({
      responses,
      request_id: req.params.requestId,
      total: responses.length
    })
  })
)

module.exports = router
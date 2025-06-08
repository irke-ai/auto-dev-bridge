const express = require('express')
const router = express.Router()
const DataManager = require('../services/DataManager')
const { validate, validateParams, validateQuery, commonSchemas } = require('../middleware/validation')
const { requestSchema, updateRequestSchema } = require('../schemas/requestSchema')
const { asyncHandler } = require('../middleware/errorHandler')

const dataManager = new DataManager()

// GET /api/requests - Get all requests
router.get('/', 
  validateQuery(commonSchemas.pagination, { allowUnknown: true }),
  asyncHandler(async (req, res) => {
    const requests = await dataManager.getRequests()
    
    // Apply pagination
    const { limit, offset, sort, order } = req.query
    
    // Sort requests
    const sortedRequests = requests.sort((a, b) => {
      const aValue = a[sort] || a.timestamp
      const bValue = b[sort] || b.timestamp
      
      if (order === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })
    
    const paginatedRequests = sortedRequests.slice(offset, offset + limit)
    
    res.json({
      requests: paginatedRequests,
      pagination: {
        total: requests.length,
        limit,
        offset,
        hasMore: offset + limit < requests.length
      }
    })
  })
)

// POST /api/requests - Create new request
router.post('/',
  validate(requestSchema),
  asyncHandler(async (req, res) => {
    const request = await dataManager.createRequest(req.body)
    
    // Add to history
    await dataManager.addToHistory('request_created', request)
    
    // Queue for Claude processing
    const claudeResponder = req.app.get('claudeResponder')
    if (claudeResponder) {
      // Add to Claude's queue
      setImmediate(() => {
        claudeResponder.addRequest(request)
      })
    }
    
    res.status(201).json({
      message: 'Request created successfully',
      request
    })
  })
)

// GET /api/requests/:id - Get specific request
router.get('/:id',
  validateParams(commonSchemas.id),
  asyncHandler(async (req, res) => {
    const request = await dataManager.getRequest(req.params.id)
    
    if (!request) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Request with id ${req.params.id} not found`
      })
    }
    
    res.json({ request })
  })
)

// PUT /api/requests/:id - Update request
router.put('/:id',
  validateParams(commonSchemas.id),
  validate(updateRequestSchema),
  asyncHandler(async (req, res) => {
    try {
      const updatedRequest = await dataManager.updateRequest(req.params.id, req.body)
      
      // Add to history
      await dataManager.addToHistory('request_updated', updatedRequest)
      
      res.json({
        message: 'Request updated successfully',
        request: updatedRequest
      })
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: 'Not Found',
          message: error.message
        })
      }
      throw error
    }
  })
)

// DELETE /api/requests/:id - Delete request
router.delete('/:id',
  validateParams(commonSchemas.id),
  asyncHandler(async (req, res) => {
    try {
      const deletedRequest = await dataManager.deleteRequest(req.params.id)
      
      // Add to history
      await dataManager.addToHistory('request_deleted', deletedRequest)
      
      res.json({
        message: 'Request deleted successfully',
        request: deletedRequest
      })
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: 'Not Found',
          message: error.message
        })
      }
      throw error
    }
  })
)

module.exports = router
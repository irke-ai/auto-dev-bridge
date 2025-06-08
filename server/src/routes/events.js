const express = require('express')
const router = express.Router()
const SSEManager = require('../services/SSEManager')
const { v4: uuidv4 } = require('uuid')

// Single SSE manager instance
const sseManager = new SSEManager()

// GET /api/events - SSE endpoint
router.get('/', (req, res) => {
  const clientId = req.query.clientId || uuidv4()
  
  // Add client to SSE manager
  sseManager.addClient(clientId, res)
  
  // Log connection
  console.log(`New SSE connection established: ${clientId}`)
})

// POST /api/events/broadcast - Broadcast message to all clients (for testing)
router.post('/broadcast', (req, res) => {
  const { eventType, data } = req.body
  
  if (!eventType) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'eventType is required'
    })
  }

  const successCount = sseManager.broadcast(eventType, data)
  
  res.json({
    message: 'Broadcast sent',
    eventType,
    clientCount: successCount
  })
})

// GET /api/events/clients - Get connected clients info
router.get('/clients', (req, res) => {
  const clientsInfo = sseManager.getAllClientsInfo()
  
  res.json({
    clientCount: sseManager.getClientCount(),
    clients: clientsInfo
  })
})

// POST /api/events/send/:clientId - Send message to specific client
router.post('/send/:clientId', (req, res) => {
  const { clientId } = req.params
  const { eventType, data } = req.body
  
  if (!eventType) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'eventType is required'
    })
  }

  const client = sseManager.getClientInfo(clientId)
  if (!client) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Client ${clientId} not found`
    })
  }

  const success = sseManager.sendToClient(clientId, eventType, data)
  
  res.json({
    message: success ? 'Message sent' : 'Message queued',
    eventType,
    clientId,
    delivered: success
  })
})

// Export SSE manager for use in other modules
router.sseManager = sseManager

module.exports = router
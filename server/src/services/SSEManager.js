const EventEmitter = require('events')

class SSEManager extends EventEmitter {
  constructor() {
    super()
    this.clients = new Map()
    this.messageQueue = new Map()
    this.heartbeatInterval = 30000 // 30 seconds
    this.heartbeatTimer = null
    
    this.setupHeartbeat()
  }

  addClient(clientId, res) {
    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
      'Access-Control-Allow-Methods': 'GET, OPTIONS'
    })

    // Store client connection
    this.clients.set(clientId, {
      id: clientId,
      response: res,
      connected: true,
      connectedAt: new Date()
    })

    console.log(`SSE client connected: ${clientId}`)
    
    // Send initial connection message
    this.sendToClient(clientId, 'connected', {
      message: 'Connected to AUTO-DEV Bridge',
      timestamp: new Date().toISOString(),
      clientId
    })

    // Send any queued messages
    this.sendQueuedMessages(clientId)

    // Handle client disconnect
    res.on('close', () => {
      this.removeClient(clientId)
    })

    res.on('error', (error) => {
      console.error(`SSE client error for ${clientId}:`, error)
      this.removeClient(clientId)
    })

    this.emit('clientConnected', clientId)
  }

  removeClient(clientId) {
    const client = this.clients.get(clientId)
    if (client) {
      client.connected = false
      this.clients.delete(clientId)
      console.log(`SSE client disconnected: ${clientId}`)
      this.emit('clientDisconnected', clientId)
    }
  }

  sendToClient(clientId, eventType, data) {
    const client = this.clients.get(clientId)
    if (!client || !client.connected) {
      // Queue message for later delivery
      this.queueMessage(clientId, eventType, data)
      return false
    }

    try {
      const sseData = this.formatSSEMessage(eventType, data)
      client.response.write(sseData)
      return true
    } catch (error) {
      console.error(`Failed to send SSE message to ${clientId}:`, error)
      this.removeClient(clientId)
      return false
    }
  }

  broadcast(eventType, data, excludeClient = null) {
    let successCount = 0
    
    for (const [clientId, client] of this.clients) {
      if (excludeClient && clientId === excludeClient) {
        continue
      }
      
      if (this.sendToClient(clientId, eventType, data)) {
        successCount++
      }
    }

    console.log(`Broadcasted ${eventType} to ${successCount} clients`)
    return successCount
  }

  formatSSEMessage(eventType, data) {
    const timestamp = new Date().toISOString()
    const messageData = {
      type: eventType,
      data,
      timestamp
    }

    let sseMessage = `event: ${eventType}\n`
    sseMessage += `data: ${JSON.stringify(messageData)}\n`
    sseMessage += `id: ${Date.now()}\n\n`
    
    return sseMessage
  }

  queueMessage(clientId, eventType, data) {
    if (!this.messageQueue.has(clientId)) {
      this.messageQueue.set(clientId, [])
    }
    
    const queue = this.messageQueue.get(clientId)
    queue.push({ eventType, data, timestamp: new Date() })
    
    // Keep only latest 50 messages per client
    if (queue.length > 50) {
      queue.splice(0, queue.length - 50)
    }
  }

  sendQueuedMessages(clientId) {
    const queue = this.messageQueue.get(clientId)
    if (!queue || queue.length === 0) {
      return
    }

    console.log(`Sending ${queue.length} queued messages to ${clientId}`)
    
    queue.forEach(({ eventType, data }) => {
      this.sendToClient(clientId, eventType, data)
    })

    // Clear the queue
    this.messageQueue.delete(clientId)
  }

  setupHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      this.broadcast('heartbeat', {
        message: 'ping',
        timestamp: new Date().toISOString(),
        connectedClients: this.clients.size
      })
    }, this.heartbeatInterval)
  }

  getClientCount() {
    return this.clients.size
  }

  getConnectedClients() {
    return Array.from(this.clients.keys())
  }

  getClientInfo(clientId) {
    return this.clients.get(clientId)
  }

  getAllClientsInfo() {
    const info = {}
    for (const [clientId, client] of this.clients) {
      info[clientId] = {
        id: client.id,
        connected: client.connected,
        connectedAt: client.connectedAt
      }
    }
    return info
  }

  shutdown() {
    console.log('Shutting down SSE Manager...')
    
    // Clear heartbeat
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }

    // Notify all clients of shutdown
    this.broadcast('shutdown', {
      message: 'Server is shutting down',
      timestamp: new Date().toISOString()
    })

    // Close all client connections
    for (const [clientId, client] of this.clients) {
      if (client.response && client.connected) {
        client.response.end()
      }
    }

    this.clients.clear()
    this.messageQueue.clear()
  }
}

module.exports = SSEManager
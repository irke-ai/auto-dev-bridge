class SSEClient {
  constructor(url, options = {}) {
    this.url = url
    this.options = {
      reconnectInterval: 3000,
      maxReconnectAttempts: 10,
      ...options
    }
    
    this.eventSource = null
    this.reconnectAttempts = 0
    this.reconnectTimer = null
    this.listeners = new Map()
    this.isConnected = false
    this.shouldReconnect = true
  }

  connect() {
    if (this.eventSource) {
      this.disconnect()
    }

    try {
      this.eventSource = new EventSource(this.url)
      
      this.eventSource.onopen = (event) => {
        console.log('SSE connection established')
        this.isConnected = true
        this.reconnectAttempts = 0
        this.emit('connect', event)
      }

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.emit('message', data)
        } catch (error) {
          console.error('Failed to parse SSE message:', error)
          this.emit('error', error)
        }
      }

      this.eventSource.onerror = (event) => {
        console.error('SSE connection error:', event)
        this.isConnected = false
        this.emit('error', event)
        
        if (this.shouldReconnect && this.reconnectAttempts < this.options.maxReconnectAttempts) {
          this.scheduleReconnect()
        }
      }

      // Custom event listeners
      this.listeners.forEach((callback, eventType) => {
        this.eventSource.addEventListener(eventType, callback)
      })

    } catch (error) {
      console.error('Failed to create SSE connection:', error)
      this.emit('error', error)
      
      if (this.shouldReconnect) {
        this.scheduleReconnect()
      }
    }
  }

  disconnect() {
    this.shouldReconnect = false
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }

    this.isConnected = false
    this.emit('disconnect')
  }

  scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }

    const delay = Math.min(
      this.options.reconnectInterval * Math.pow(2, this.reconnectAttempts),
      30000 // Max 30 seconds
    )

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`)
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++
      this.emit('reconnecting', { attempt: this.reconnectAttempts })
      this.connect()
    }, delay)
  }

  on(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, [])
    }
    this.listeners.get(eventType).push(callback)

    // If already connected, add listener to existing EventSource
    if (this.eventSource && eventType !== 'connect' && eventType !== 'disconnect' && eventType !== 'error' && eventType !== 'message' && eventType !== 'reconnecting') {
      this.eventSource.addEventListener(eventType, callback)
    }
  }

  off(eventType, callback) {
    const listeners = this.listeners.get(eventType)
    if (listeners) {
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
      
      if (this.eventSource) {
        this.eventSource.removeEventListener(eventType, callback)
      }
    }
  }

  emit(eventType, data) {
    const listeners = this.listeners.get(eventType)
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in SSE event listener for ${eventType}:`, error)
        }
      })
    }
  }

  getConnectionStatus() {
    if (!this.eventSource) return 'disconnected'
    
    switch (this.eventSource.readyState) {
      case EventSource.CONNECTING: return 'connecting'
      case EventSource.OPEN: return 'connected'
      case EventSource.CLOSED: return 'disconnected'
      default: return 'unknown'
    }
  }
}

export default SSEClient
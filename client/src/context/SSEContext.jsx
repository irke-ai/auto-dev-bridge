import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import SSEClient from '../utils/sse'

export const SSEContext = createContext(null)

export const useSSEContext = () => {
  const context = useContext(SSEContext)
  if (!context) {
    throw new Error('useSSEContext must be used within an SSEProvider')
  }
  return context
}

export const SSEProvider = ({ children, url = 'http://localhost:3001/api/events' }) => {
  const [messages, setMessages] = useState([])
  const [notifications, setNotifications] = useState([])
  const [sseStatus, setSSEStatus] = useState('disconnected')
  const [lastEvent, setLastEvent] = useState(null)
  const sseClientRef = useRef(null)
  
  useEffect(() => {
    const client = new SSEClient(url)
    sseClientRef.current = client
    
    // Set up event listeners
    client.on('connect', () => {
      setSSEStatus('connected')
      console.log('SSE connected')
    })
    
    client.on('disconnect', () => {
      setSSEStatus('disconnected')
      console.log('SSE disconnected')
    })
    
    client.on('error', (error) => {
      setSSEStatus('error')
      console.error('SSE error:', error)
    })
    
    client.on('reconnecting', ({ attempt }) => {
      setSSEStatus('reconnecting')
      console.log(`SSE reconnecting (attempt ${attempt})`)
    })
    
    client.on('message', (data) => {
      setLastEvent(data)
      setMessages(prev => [data, ...prev.slice(0, 49)])
    })
    
    // Connect
    client.connect()
    
    // Cleanup
    return () => {
      client.disconnect()
    }
  }, [url])
  
  const addEventListener = useCallback((eventType, callback) => {
    if (sseClientRef.current) {
      sseClientRef.current.on(eventType, callback)
      return () => sseClientRef.current.off(eventType, callback)
    }
    return () => {}
  }, [])

  // Handle different message types
  useEffect(() => {
    const cleanup = []

    // Handle request updates
    cleanup.push(addEventListener('request_updated', (data) => {
      console.log('Request updated:', data)
      setNotifications(prev => [{
        id: Date.now(),
        type: 'request_updated',
        message: 'Request file updated',
        data,
        timestamp: new Date()
      }, ...prev.slice(0, 9)]) // Keep only 10 notifications
    }))

    // Handle response updates
    cleanup.push(addEventListener('response_updated', (data) => {
      console.log('Response updated:', data)
      setNotifications(prev => [{
        id: Date.now(),
        type: 'response_updated',
        message: 'Response file updated',
        data,
        timestamp: new Date()
      }, ...prev.slice(0, 9)])
    }))

    // Handle connection events
    cleanup.push(addEventListener('connected', (data) => {
      console.log('SSE connection established:', data)
      setNotifications(prev => [{
        id: Date.now(),
        type: 'connected',
        message: 'Connected to server',
        data,
        timestamp: new Date()
      }, ...prev.slice(0, 9)])
    }))

    // Handle heartbeat
    cleanup.push(addEventListener('heartbeat', (data) => {
      // Don't show heartbeat as notification, just log
      console.log('Heartbeat received:', data.connectedClients, 'clients')
    }))

    // Handle response created
    cleanup.push(addEventListener('response_created', (data) => {
      console.log('Response created:', data)
      setNotifications(prev => [{
        id: Date.now(),
        type: 'response_created',
        message: 'New response received',
        data,
        timestamp: new Date()
      }, ...prev.slice(0, 9)])
    }))

    // Handle Claude pending requests
    cleanup.push(addEventListener('claude_pending_requests', (data) => {
      console.log('Claude pending requests:', data)
      setNotifications(prev => [{
        id: Date.now(),
        type: 'claude_pending',
        message: data.notification,
        data,
        timestamp: new Date()
      }, ...prev.slice(0, 9)])
    }))

    // Handle generic messages
    cleanup.push(addEventListener('*', (message) => {
      setMessages(prev => [message, ...prev.slice(0, 49)]) // Keep only 50 messages
    }))

    return () => {
      cleanup.forEach(cleanupFn => cleanupFn())
    }
  }, [addEventListener])

  const clearNotifications = () => {
    setNotifications([])
  }

  const clearMessages = () => {
    setMessages([])
  }

  const value = {
    // Connection state
    sseStatus,
    lastEvent,
    
    // Messages and notifications
    messages,
    notifications,
    
    // Actions
    addEventListener,
    clearNotifications,
    clearMessages
  }

  return (
    <SSEContext.Provider value={value}>
      {children}
    </SSEContext.Provider>
  )
}
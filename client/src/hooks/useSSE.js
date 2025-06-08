import { useState, useEffect, useRef, useCallback } from 'react'
import SSEClient from '../utils/sse'

const useSSE = (url = null, options = {}) => {
  const defaultUrl = import.meta.env.VITE_API_BASE_URL 
    ? `${import.meta.env.VITE_API_BASE_URL}/events`
    : '/api/events'
  const sseUrl = url || defaultUrl
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const [lastMessage, setLastMessage] = useState(null)
  const [error, setError] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  
  const sseClientRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  
  const eventHandlers = useRef(new Map())

  const connect = useCallback(() => {
    if (sseClientRef.current) {
      sseClientRef.current.disconnect()
    }

    const sseClient = new SSEClient(sseUrl, {
      reconnectInterval: 3000,
      maxReconnectAttempts: 10,
      ...options
    })

    // Connection events
    sseClient.on('connect', () => {
      setConnectionStatus('connected')
      setIsConnected(true)
      setError(null)
      console.log('SSE connected')
    })

    sseClient.on('disconnect', () => {
      setConnectionStatus('disconnected')
      setIsConnected(false)
      console.log('SSE disconnected')
    })

    sseClient.on('reconnecting', ({ attempt }) => {
      setConnectionStatus('reconnecting')
      setIsConnected(false)
      console.log(`SSE reconnecting (attempt ${attempt})`)
    })

    sseClient.on('error', (error) => {
      setError(error)
      setConnectionStatus('error')
      setIsConnected(false)
      console.error('SSE error:', error)
    })

    // Message events
    sseClient.on('message', (data) => {
      setLastMessage(data)
      
      // Call registered event handlers
      const handler = eventHandlers.current.get(data.type)
      if (handler) {
        handler(data.data)
      }
      
      // Call generic message handler
      const messageHandler = eventHandlers.current.get('*')
      if (messageHandler) {
        messageHandler(data)
      }
    })

    sseClientRef.current = sseClient
    sseClient.connect()
  }, [sseUrl, options])

  const disconnect = useCallback(() => {
    if (sseClientRef.current) {
      sseClientRef.current.disconnect()
      sseClientRef.current = null
    }
    setConnectionStatus('disconnected')
    setIsConnected(false)
  }, [])

  const addEventListener = useCallback((eventType, handler) => {
    eventHandlers.current.set(eventType, handler)
    
    // Return cleanup function
    return () => {
      eventHandlers.current.delete(eventType)
    }
  }, [])

  const removeEventListener = useCallback((eventType) => {
    eventHandlers.current.delete(eventType)
  }, [])

  // Auto-connect on mount
  useEffect(() => {
    connect()
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      disconnect()
    }
  }, [connect, disconnect])

  // Handle window focus/blur for connection management
  useEffect(() => {
    const handleFocus = () => {
      if (!isConnected && sseClientRef.current) {
        connect()
      }
    }

    const handleBeforeUnload = () => {
      disconnect()
    }

    window.addEventListener('focus', handleFocus)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isConnected, connect, disconnect])

  return {
    connectionStatus,
    isConnected,
    lastMessage,
    error,
    connect,
    disconnect,
    addEventListener,
    removeEventListener
  }
}

export default useSSE
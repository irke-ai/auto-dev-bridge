import React from 'react'
import { useSSEContext } from '../context/SSEContext.jsx'

function StatusIndicator() {
  const { connectionStatus, isConnected, error } = useSSEContext()

  const getStatusInfo = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          color: 'text-green-600 bg-green-100',
          icon: '●',
          text: 'Connected (SSE)'
        }
      case 'connecting':
        return {
          color: 'text-yellow-600 bg-yellow-100 animate-pulse',
          icon: '●',
          text: 'Connecting...'
        }
      case 'disconnected':
        return {
          color: 'text-red-600 bg-red-100',
          icon: '●',
          text: 'Disconnected'
        }
      case 'reconnecting':
        return {
          color: 'text-blue-600 bg-blue-100 animate-pulse',
          icon: '●',
          text: 'Reconnecting...'
        }
      case 'error':
        return {
          color: 'text-red-600 bg-red-100',
          icon: '●',
          text: 'Connection Error'
        }
      default:
        return {
          color: 'text-gray-600 bg-gray-100',
          icon: '●',
          text: 'Unknown'
        }
    }
  }

  const statusInfo = getStatusInfo()

  return (
    <div className="flex items-center justify-center mt-4">
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
        <span className="mr-2">{statusInfo.icon}</span>
        <span>{statusInfo.text}</span>
        {error && (
          <span className="ml-2 text-xs opacity-75" title={error.message || error}>
            (Error)
          </span>
        )}
      </div>
    </div>
  )
}

export default StatusIndicator
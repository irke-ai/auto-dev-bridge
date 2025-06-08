import React, { useState, useEffect } from 'react'
import { useSSEContext } from '../context/SSEContext.jsx'
import api from '../utils/api'

function ResponseDisplay() {
  const [responses, setResponses] = useState([])
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState([])
  
  const { notifications, isConnected } = useSSEContext()

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [responsesData, requestsData] = await Promise.all([
          api.getResponses(),
          api.getRequests()
        ])
        setResponses(responsesData.responses || [])
        setRequests(requestsData.requests || [])
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Update data when SSE notifications arrive
  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications[0]
      
      if (latestNotification.type === 'request_updated') {
        // Reload requests when request files change
        api.getRequests().then(data => {
          setRequests(data.requests || [])
        }).catch(console.error)
      }
      
      if (latestNotification.type === 'response_updated') {
        // Reload responses when response files change
        api.getResponses().then(data => {
          setResponses(data.responses || [])
        }).catch(console.error)
      }
    }
  }, [notifications])

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString()
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100'
      case 'error': return 'text-red-600 bg-red-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Responses
        </h2>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Requests Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Recent Requests
          </h2>
          {!isConnected && (
            <span className="text-sm text-yellow-600">Offline</span>
          )}
        </div>
        
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        ) : requests.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
            No requests yet.
          </p>
        ) : (
          <div className="space-y-3">
            {requests.slice(0, 3).map((request) => (
              <div key={request.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status || 'pending')}`}>
                    {request.priority} priority
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {formatTimestamp(request.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                  {request.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Responses Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Responses
        </h2>
        
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        ) : responses.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No responses yet. Submit a request to see responses here.
          </p>
        ) : (
          <div className="space-y-4">
            {responses.map((response) => (
              <div key={response.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(response.status)}`}>
                    {response.status}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {formatTimestamp(response.timestamp)}
                  </span>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-900 rounded p-3">
                  <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                    {JSON.stringify(response.content, null, 2)}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Real-time Notifications */}
      {notifications.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900 rounded-lg shadow-md p-4">
          <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">
            Real-time Updates
          </h3>
          <div className="space-y-2">
            {notifications.slice(0, 3).map((notification) => (
              <div key={notification.id} className="text-sm text-blue-800 dark:text-blue-200">
                <span className="font-medium">{notification.message}</span>
                <span className="ml-2 text-xs opacity-75">
                  {formatTimestamp(notification.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ResponseDisplay
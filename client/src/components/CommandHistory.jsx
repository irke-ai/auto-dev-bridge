import React, { useState, useEffect } from 'react'

export default function CommandHistory() {
  const [history, setHistory] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [expandedItems, setExpandedItems] = useState(new Set())

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('http://localhost:3001/api/history?limit=20&sort=timestamp&order=desc')
      const data = await response.json()
      if (data.history) {
        setHistory(data.history)
      }
    } catch (error) {
      console.error('Failed to fetch history:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleExpanded = (id) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedItems(newExpanded)
  }

  const getEventTypeColor = (eventType) => {
    if (eventType.includes('created')) return 'text-green-600'
    if (eventType.includes('updated')) return 'text-blue-600'
    if (eventType.includes('deleted')) return 'text-red-600'
    if (eventType.includes('error')) return 'text-red-600'
    return 'text-gray-600'
  }

  const getEventTypeIcon = (eventType) => {
    if (eventType.includes('created')) return '+'
    if (eventType.includes('updated')) return '~'
    if (eventType.includes('deleted')) return '-'
    if (eventType.includes('error')) return '!'
    return '•'
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Command History
          </h2>
          <button
            onClick={fetchHistory}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>

        {history.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No history available</p>
        ) : (
          <div className="space-y-2">
            {history.map((item) => (
              <div
                key={item.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleExpanded(item.id)}
                >
                  <div className="flex items-center space-x-3">
                    <span className={`font-mono text-lg ${getEventTypeColor(item.event_type)}`}>
                      {getEventTypeIcon(item.event_type)}
                    </span>
                    <div>
                      <span className={`font-medium ${getEventTypeColor(item.event_type)}`}>
                        {item.event_type}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                        {new Date(item.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-400 transform transition-transform ${
                      expandedItems.has(item.id) ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>

                {expandedItems.has(item.id) && item.data && (
                  <div className="mt-3 pl-8 text-sm">
                    <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded overflow-x-auto">
                      {JSON.stringify(item.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
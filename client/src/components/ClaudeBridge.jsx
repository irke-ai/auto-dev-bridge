import React, { useState, useEffect } from 'react'
import { useSSE } from '../hooks/useSSE'

export default function ClaudeBridge() {
  const [command, setCommand] = useState('')
  const [responses, setResponses] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [commandHistory, setCommandHistory] = useState([])
  const { sseStatus, lastEvent } = useSSE()

  // Load command history on mount
  useEffect(() => {
    fetchCommandHistory()
  }, [])

  // Handle SSE events
  useEffect(() => {
    if (lastEvent?.type === 'claude_request_queued') {
      console.log('Request queued:', lastEvent.data)
    }
  }, [lastEvent])

  const fetchCommandHistory = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/history?limit=10&sort=timestamp&order=desc')
      const data = await response.json()
      if (data.history) {
        setCommandHistory(data.history)
      }
    } catch (error) {
      console.error('Failed to fetch command history:', error)
    }
  }

  const sendCommand = async () => {
    if (!command.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch('http://localhost:3001/api/claude-bridge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: command
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        console.log('Command sent:', data)
        
        // Add to responses
        setResponses(prev => [{
          id: data.commandId,
          command: command,
          status: 'pending',
          timestamp: new Date().toISOString()
        }, ...prev])
        
        // Clear input
        setCommand('')
        
        // Refresh history
        setTimeout(fetchCommandHistory, 1000)
      } else {
        console.error('Failed to send command:', data)
        alert(`Error: ${data.message || 'Failed to send command'}`)
      }
    } catch (error) {
      console.error('Error sending command:', error)
      alert('Failed to send command. Please check if the server is running.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendCommand()
    }
  }

  return (
    <div className="bg-gray-900 text-gray-100 p-6 rounded-lg shadow-xl max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2 text-blue-400">Claude Bridge</h2>
        <p className="text-gray-400">Send commands to VSCode Claude Code</p>
        
        {/* Connection Status */}
        <div className="mt-2 flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${
            sseStatus === 'connected' ? 'bg-green-500' : 
            sseStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 
            'bg-red-500'
          }`} />
          <span className="text-sm text-gray-400">
            SSE: {sseStatus}
          </span>
        </div>
      </div>

      {/* Command Input */}
      <div className="mb-6">
        <textarea
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter command for Claude Code..."
          className="w-full p-4 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows="3"
          disabled={isLoading}
        />
        <button
          onClick={sendCommand}
          disabled={isLoading || !command.trim()}
          className="mt-3 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors duration-200"
        >
          {isLoading ? 'Sending...' : 'Send Command'}
        </button>
      </div>

      {/* Recent Commands */}
      {responses.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-300">Current Session</h3>
          <div className="space-y-2">
            {responses.map(response => (
              <div key={response.id} className="p-3 bg-gray-800 rounded-lg border border-gray-700">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-sm font-medium text-gray-400">ID: {response.id}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    response.status === 'pending' ? 'bg-yellow-600' : 'bg-green-600'
                  }`}>
                    {response.status}
                  </span>
                </div>
                <p className="text-gray-200">{response.command}</p>
                <span className="text-xs text-gray-500">
                  {new Date(response.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Command History */}
      {commandHistory.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-300">Command History</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {commandHistory.map(item => (
              <div key={item.id} className="p-2 bg-gray-800 rounded border border-gray-700 text-sm">
                <div className="flex justify-between items-start">
                  <span className="text-gray-400">{item.event_type}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(item.timestamp).toLocaleString()}
                  </span>
                </div>
                {item.data?.message && (
                  <p className="text-gray-300 mt-1">{item.data.message}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
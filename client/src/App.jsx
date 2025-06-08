import React from 'react'
import { SSEProvider } from './context/SSEContext.jsx'
import RequestForm from './components/RequestForm'
import ResponseDisplay from './components/ResponseDisplay'
import StatusIndicator from './components/StatusIndicator'

function App() {
  return (
    <SSEProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <header className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              AUTO-DEV Bridge
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Web interface for Claude Code communication
            </p>
            <StatusIndicator />
          </header>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <RequestForm />
            </div>
            
            <div className="space-y-6">
              <ResponseDisplay />
            </div>
          </div>
        </div>
      </div>
    </SSEProvider>
  )
}

export default App
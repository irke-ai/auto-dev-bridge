import React, { useState } from 'react'
import { useSSEContext } from '../context/SSEContext.jsx'
import api from '../utils/api'

function RequestForm() {
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState('medium')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState(null)
  
  const { isConnected } = useSSEContext()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus(null)
    
    try {
      const requestData = { message, priority }
      const response = await api.createRequest(requestData)
      
      console.log('Request created:', response)
      setSubmitStatus({ type: 'success', message: 'Request submitted successfully!' })
      
      // Clear form on success
      setMessage('')
      setPriority('medium')
    } catch (error) {
      console.error('Failed to submit request:', error)
      setSubmitStatus({ 
        type: 'error', 
        message: error.message || 'Failed to submit request'
      })
    } finally {
      setIsSubmitting(false)
      
      // Clear status after 3 seconds
      setTimeout(() => setSubmitStatus(null), 3000)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Submit Request
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Message
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
            rows={4}
            placeholder="Enter your request message..."
            required
          />
        </div>
        
        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Priority
          </label>
          <select
            id="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting || !message.trim() || !isConnected}
          className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Request'}
        </button>
        
        {!isConnected && (
          <p className="text-sm text-yellow-600 mt-2">
            ⚠️ Not connected to server. Please wait for connection.
          </p>
        )}
        
        {submitStatus && (
          <div className={`mt-2 p-2 rounded text-sm ${
            submitStatus.type === 'success' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {submitStatus.message}
          </div>
        )}
      </form>
    </div>
  )
}

export default RequestForm
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

class ApiClient {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL
    this.timeout = 10000
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const config = {
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout')
      }
      throw error
    }
  }

  // Health check
  async checkHealth() {
    return this.request('/health')
  }

  // Request operations
  async createRequest(data) {
    return this.request('/requests', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async getRequests() {
    return this.request('/requests')
  }

  async getRequest(id) {
    return this.request(`/requests/${id}`)
  }

  // Response operations
  async getResponses() {
    return this.request('/responses')
  }

  async getLatestResponses() {
    return this.request('/responses/latest')
  }

  async getResponse(id) {
    return this.request(`/responses/${id}`)
  }

  // History operations
  async getHistory() {
    return this.request('/history')
  }

  async searchHistory(query) {
    return this.request(`/history/search?q=${encodeURIComponent(query)}`)
  }
}

export default new ApiClient()
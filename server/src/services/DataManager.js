const fs = require('fs').promises
const path = require('path')
const { v4: uuidv4 } = require('uuid')

class DataManager {
  constructor(dataPath = path.join(process.cwd(), 'data')) {
    this.dataPath = dataPath
  }

  async ensureDirectory(dirPath) {
    try {
      await fs.access(dirPath)
    } catch {
      await fs.mkdir(dirPath, { recursive: true })
    }
  }

  async readJSON(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8')
      return JSON.parse(content)
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null
      }
      throw error
    }
  }

  async writeJSON(filePath, data) {
    await this.ensureDirectory(path.dirname(filePath))
    const content = JSON.stringify(data, null, 2)
    await fs.writeFile(filePath, content, 'utf8')
  }

  async updateMetadata(data) {
    const now = new Date().toISOString()
    return {
      ...data,
      metadata: {
        ...data.metadata,
        last_updated: now
      }
    }
  }

  // Request operations
  async createRequest(requestData) {
    const id = uuidv4()
    const timestamp = new Date().toISOString()
    
    const request = {
      id,
      ...requestData,
      timestamp,
      status: 'pending'
    }

    const activeFilePath = path.join(this.dataPath, 'requests', 'active.json')
    let activeData = await this.readJSON(activeFilePath) || {
      requests: [],
      metadata: { created: timestamp, version: '1.0.0' }
    }

    activeData.requests.push(request)
    activeData = await this.updateMetadata(activeData)
    
    await this.writeJSON(activeFilePath, activeData)
    
    return request
  }

  async getRequests() {
    const activeFilePath = path.join(this.dataPath, 'requests', 'active.json')
    const data = await this.readJSON(activeFilePath)
    return data ? data.requests : []
  }

  async getRequest(id) {
    const requests = await this.getRequests()
    return requests.find(req => req.id === id)
  }

  async updateRequest(id, updates) {
    const activeFilePath = path.join(this.dataPath, 'requests', 'active.json')
    let activeData = await this.readJSON(activeFilePath)
    
    if (!activeData) {
      throw new Error('No active requests file found')
    }

    const requestIndex = activeData.requests.findIndex(req => req.id === id)
    if (requestIndex === -1) {
      throw new Error(`Request with id ${id} not found`)
    }

    activeData.requests[requestIndex] = {
      ...activeData.requests[requestIndex],
      ...updates,
      updated_at: new Date().toISOString()
    }

    activeData = await this.updateMetadata(activeData)
    await this.writeJSON(activeFilePath, activeData)
    
    return activeData.requests[requestIndex]
  }

  async deleteRequest(id) {
    const activeFilePath = path.join(this.dataPath, 'requests', 'active.json')
    let activeData = await this.readJSON(activeFilePath)
    
    if (!activeData) {
      throw new Error('No active requests file found')
    }

    const requestIndex = activeData.requests.findIndex(req => req.id === id)
    if (requestIndex === -1) {
      throw new Error(`Request with id ${id} not found`)
    }

    const deletedRequest = activeData.requests.splice(requestIndex, 1)[0]
    activeData = await this.updateMetadata(activeData)
    
    await this.writeJSON(activeFilePath, activeData)
    
    return deletedRequest
  }

  // Response operations
  async createResponse(responseData) {
    const id = uuidv4()
    const timestamp = new Date().toISOString()
    
    const response = {
      id,
      ...responseData,
      timestamp
    }

    const latestFilePath = path.join(this.dataPath, 'responses', 'latest.json')
    let latestData = await this.readJSON(latestFilePath) || {
      responses: [],
      metadata: { created: timestamp, version: '1.0.0' }
    }

    latestData.responses.unshift(response) // Add to beginning
    
    // Keep only latest 50 responses
    if (latestData.responses.length > 50) {
      latestData.responses = latestData.responses.slice(0, 50)
    }

    latestData = await this.updateMetadata(latestData)
    await this.writeJSON(latestFilePath, latestData)
    
    return response
  }

  async getResponses() {
    const latestFilePath = path.join(this.dataPath, 'responses', 'latest.json')
    const data = await this.readJSON(latestFilePath)
    return data ? data.responses : []
  }

  async getResponse(id) {
    const responses = await this.getResponses()
    return responses.find(res => res.id === id)
  }

  async getResponsesByRequestId(requestId) {
    const responses = await this.getResponses()
    return responses.filter(res => res.request_id === requestId)
  }

  // History operations
  async addToHistory(type, data) {
    const historyFilePath = path.join(this.dataPath, 'history', 'log.json')
    let historyData = await this.readJSON(historyFilePath) || {
      entries: [],
      metadata: { created: new Date().toISOString(), version: '1.0.0' }
    }

    const entry = {
      id: uuidv4(),
      type,
      data,
      timestamp: new Date().toISOString()
    }

    historyData.entries.unshift(entry)
    
    // Keep only latest 1000 entries
    if (historyData.entries.length > 1000) {
      historyData.entries = historyData.entries.slice(0, 1000)
    }

    historyData = await this.updateMetadata(historyData)
    await this.writeJSON(historyFilePath, historyData)
    
    return entry
  }

  async getHistory(limit = 100) {
    const historyFilePath = path.join(this.dataPath, 'history', 'log.json')
    const data = await this.readJSON(historyFilePath)
    
    if (!data) return []
    
    return data.entries.slice(0, limit)
  }

  async searchHistory(query, limit = 50) {
    const history = await this.getHistory(1000) // Search in more entries
    
    const results = history.filter(entry => {
      const searchText = JSON.stringify(entry.data).toLowerCase()
      return searchText.includes(query.toLowerCase())
    })

    return results.slice(0, limit)
  }
}

module.exports = DataManager
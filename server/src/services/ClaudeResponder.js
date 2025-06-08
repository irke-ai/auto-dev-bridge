const EventEmitter = require('events')
const fs = require('fs').promises
const path = require('path')
const CommandFileWriter = require('./CommandFileWriter')

class ClaudeResponder extends EventEmitter {
  constructor(dataManager, sseManager) {
    super()
    this.dataManager = dataManager
    this.sseManager = sseManager
    this.commandWriter = new CommandFileWriter()
    this.isRunning = false
    this.requestQueue = []
    this.processing = false
  }

  start() {
    if (this.isRunning) return
    this.isRunning = true
    console.log('ClaudeResponder started - Requests will be saved for Claude Code to process')
    
    // Start queue processor
    this.processQueueInterval = setInterval(() => {
      this.checkPendingRequests()
    }, 5000) // Check every 5 seconds
  }

  stop() {
    this.isRunning = false
    if (this.processQueueInterval) {
      clearInterval(this.processQueueInterval)
    }
    console.log('ClaudeResponder stopped')
  }

  async addRequest(request) {
    if (!this.isRunning) return

    console.log(`New request queued for Claude: ${request.id}`)
    
    try {
      // Write command file for AutoHotkey to process
      await this.commandWriter.writeCommand(request.id, request.message)
      
      // Also save to tracking file
      const claudeRequestsPath = path.join(process.env.DATA_PATH || '/app/data', 'claude_requests.json')
      
      let claudeRequests = []
      try {
        const content = await fs.readFile(claudeRequestsPath, 'utf8')
        claudeRequests = JSON.parse(content)
      } catch (e) {
        // File doesn't exist yet
      }
      
      claudeRequests.push({
        request,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      
      await fs.writeFile(claudeRequestsPath, JSON.stringify(claudeRequests, null, 2))
      
      // Notify via SSE
      this.sseManager.broadcast('claude_request_queued', {
        request_id: request.id,
        message: 'Request queued for Claude Code processing',
        queue_length: claudeRequests.length
      })
      
    } catch (error) {
      console.error('Failed to queue request for Claude:', error)
    }
  }
  
  async checkPendingRequests() {
    const claudeRequestsPath = path.join(process.env.DATA_PATH || '/app/data', 'claude_requests.json')
    
    try {
      const content = await fs.readFile(claudeRequestsPath, 'utf8')
      const claudeRequests = JSON.parse(content)
      
      const pendingCount = claudeRequests.filter(r => r.status === 'pending').length
      
      if (pendingCount > 0) {
        console.log(`${pendingCount} requests waiting for Claude Code to process`)
        
        // Broadcast reminder
        this.sseManager.broadcast('claude_requests_pending', {
          count: pendingCount,
          message: `${pendingCount} requests are waiting for Claude Code to process`
        })
      }
    } catch (e) {
      // No requests file yet
    }
  }
  
  async markRequestProcessed(requestId) {
    const claudeRequestsPath = path.join(process.env.DATA_PATH || '/app/data', 'claude_requests.json')
    
    try {
      const content = await fs.readFile(claudeRequestsPath, 'utf8')
      const claudeRequests = JSON.parse(content)
      
      const index = claudeRequests.findIndex(r => r.request.id === requestId)
      if (index !== -1) {
        claudeRequests[index].status = 'processed'
        claudeRequests[index].processed_at = new Date().toISOString()
        
        await fs.writeFile(claudeRequestsPath, JSON.stringify(claudeRequests, null, 2))
      }
    } catch (e) {
      console.error('Failed to mark request as processed:', e)
    }
  }
}

module.exports = ClaudeResponder
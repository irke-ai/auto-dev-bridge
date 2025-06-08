const fs = require('fs').promises
const path = require('path')
const EventEmitter = require('events')

class ClaudeFileWatcher extends EventEmitter {
  constructor(filePath, checkInterval = 2000) {
    super()
    this.filePath = filePath
    this.checkInterval = checkInterval
    this.lastContent = null
    this.watchTimer = null
    this.isWatching = false
    this.knownRequestIds = new Set()
  }

  async start() {
    if (this.isWatching) return
    
    this.isWatching = true
    console.log(`[ClaudeFileWatcher] Started watching: ${this.filePath}`)
    
    // Initial content load
    await this.loadInitialContent()
    
    // Start periodic checking
    this.watchTimer = setInterval(() => {
      this.checkForChanges()
    }, this.checkInterval)
  }

  stop() {
    if (this.watchTimer) {
      clearInterval(this.watchTimer)
      this.watchTimer = null
    }
    this.isWatching = false
    console.log(`[ClaudeFileWatcher] Stopped watching: ${this.filePath}`)
  }

  async loadInitialContent() {
    try {
      const content = await fs.readFile(this.filePath, 'utf8')
      this.lastContent = content
      
      // Load existing request IDs to avoid re-notifying
      const requests = JSON.parse(content)
      requests.forEach(req => {
        if (req.request && req.request.id) {
          this.knownRequestIds.add(req.request.id)
        }
      })
      console.log(`[ClaudeFileWatcher] Loaded ${this.knownRequestIds.size} known requests`)
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error(`[ClaudeFileWatcher] Error loading initial content:`, error)
      }
      this.lastContent = null
    }
  }

  async checkForChanges() {
    try {
      const currentContent = await fs.readFile(this.filePath, 'utf8')
      
      if (currentContent !== this.lastContent) {
        console.log(`[ClaudeFileWatcher] File changed, checking for new requests...`)
        
        // Parse and check for new pending requests
        const requests = JSON.parse(currentContent)
        const newPendingRequests = []
        
        requests.forEach(req => {
          if (req.status === 'pending' && req.request && req.request.id) {
            if (!this.knownRequestIds.has(req.request.id)) {
              newPendingRequests.push(req)
              this.knownRequestIds.add(req.request.id)
            }
          }
        })
        
        if (newPendingRequests.length > 0) {
          console.log(`[ClaudeFileWatcher] Found ${newPendingRequests.length} NEW pending requests`)
          this.emit('pending_requests', newPendingRequests)
        }
        
        this.lastContent = currentContent
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist yet
        if (this.lastContent !== null) {
          this.lastContent = null
          this.knownRequestIds.clear()
        }
      } else {
        console.error(`[ClaudeFileWatcher] Error checking file:`, error)
      }
    }
  }
}

module.exports = ClaudeFileWatcher
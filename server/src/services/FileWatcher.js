const chokidar = require('chokidar')
const path = require('path')
const EventEmitter = require('events')

class FileWatcher extends EventEmitter {
  constructor(watchPaths = [], options = {}) {
    super()
    
    this.watchPaths = watchPaths
    this.options = {
      debounce: 100,
      ignoreInitial: true,
      ...options
    }
    
    this.watcher = null
    this.debounceTimers = new Map()
  }

  start() {
    if (this.watcher) {
      this.stop()
    }

    const watchOptions = {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true,
      ignoreInitial: this.options.ignoreInitial
    }

    this.watcher = chokidar.watch(this.watchPaths, watchOptions)

    this.watcher
      .on('add', (filePath) => this.handleFileEvent('add', filePath))
      .on('change', (filePath) => this.handleFileEvent('change', filePath))
      .on('unlink', (filePath) => this.handleFileEvent('unlink', filePath))
      .on('error', (error) => this.emit('error', error))
      .on('ready', () => {
        console.log('File watcher ready. Watching:', this.watchPaths)
        this.emit('ready')
      })

    return this
  }

  stop() {
    if (this.watcher) {
      this.watcher.close()
      this.watcher = null
    }

    // Clear all debounce timers
    this.debounceTimers.forEach(timer => clearTimeout(timer))
    this.debounceTimers.clear()

    this.emit('stopped')
    return this
  }

  handleFileEvent(eventType, filePath) {
    const relativePath = path.relative(process.cwd(), filePath)
    
    // Debounce events for the same file
    const debounceKey = `${eventType}:${filePath}`
    
    if (this.debounceTimers.has(debounceKey)) {
      clearTimeout(this.debounceTimers.get(debounceKey))
    }

    const timer = setTimeout(() => {
      this.debounceTimers.delete(debounceKey)
      
      const eventData = {
        type: eventType,
        path: filePath,
        relativePath,
        timestamp: new Date().toISOString()
      }

      console.log(`File ${eventType}: ${relativePath}`)
      
      // Emit specific event type
      this.emit(eventType, eventData)
      
      // Emit general file event
      this.emit('file', eventData)

      // Map to SSE event types
      this.mapToSSEEvent(eventType, eventData)
      
    }, this.options.debounce)

    this.debounceTimers.set(debounceKey, timer)
  }

  mapToSSEEvent(eventType, eventData) {
    let sseEventType = null
    
    // Determine SSE event type based on file path and event type
    if (eventData.relativePath.includes('requests')) {
      switch (eventType) {
        case 'add':
        case 'change':
          sseEventType = 'request_updated'
          break
        case 'unlink':
          sseEventType = 'request_deleted'
          break
      }
    } else if (eventData.relativePath.includes('responses')) {
      switch (eventType) {
        case 'add':
        case 'change':
          sseEventType = 'response_updated'
          break
        case 'unlink':
          sseEventType = 'response_deleted'
          break
      }
    }

    if (sseEventType) {
      this.emit('sse_event', {
        type: sseEventType,
        data: eventData
      })
    }
  }

  addPath(newPath) {
    if (this.watcher) {
      this.watcher.add(newPath)
    }
    this.watchPaths.push(newPath)
  }

  removePath(pathToRemove) {
    if (this.watcher) {
      this.watcher.unwatch(pathToRemove)
    }
    this.watchPaths = this.watchPaths.filter(p => p !== pathToRemove)
  }

  isWatching() {
    return this.watcher !== null
  }

  getWatchedPaths() {
    return [...this.watchPaths]
  }
}

module.exports = FileWatcher
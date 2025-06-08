const fs = require('fs').promises
const path = require('path')

class CommandFileWriter {
  constructor() {
    this.commandsPath = path.join(process.env.DATA_PATH || '/app/data', 'claude_commands')
    console.log(`[CommandFileWriter] Initialized with path: ${this.commandsPath}`)
  }

  async writeCommand(id, message) {
    console.log(`[CommandFileWriter] Writing command ${id} with message: ${message}`)
    
    try {
      // Ensure directory exists
      console.log(`[CommandFileWriter] Ensuring directory exists: ${this.commandsPath}`)
      await fs.mkdir(this.commandsPath, { recursive: true })
      
      // Create command file with the expected format
      const fileName = `command_${id}.txt`
      const filePath = path.join(this.commandsPath, fileName)
      console.log(`[CommandFileWriter] Full file path: ${filePath}`)
      
      // Create command content
      const commandContent = {
        id: id,
        command: message,
        message: message, // Include both for compatibility
        timestamp: new Date().toISOString()
      }
      
      console.log('[CommandFileWriter] Writing content:', JSON.stringify(commandContent))
      
      // Write as JSON string
      await fs.writeFile(filePath, JSON.stringify(commandContent, null, 2), 'utf8')
      
      // Verify file was created
      const exists = await fs.access(filePath).then(() => true).catch(() => false)
      console.log(`[CommandFileWriter] File created successfully: ${exists}`)
      
      if (exists) {
        const stats = await fs.stat(filePath)
        console.log(`[CommandFileWriter] File size: ${stats.size} bytes`)
      }
      
      return filePath
    } catch (error) {
      console.error('[CommandFileWriter] Failed to write command file:', error)
      console.error('[CommandFileWriter] Error stack:', error.stack)
      throw error
    }
  }
}

module.exports = CommandFileWriter
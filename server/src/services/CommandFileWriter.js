const fs = require('fs').promises
const path = require('path')

class CommandFileWriter {
  constructor() {
    this.commandsPath = path.join(process.env.DATA_PATH || '/app/data', 'claude_commands')
  }

  async writeCommand(id, message) {
    try {
      // Ensure directory exists
      await fs.mkdir(this.commandsPath, { recursive: true })
      
      // Create command file with the expected format
      const fileName = `command_${id}.txt`
      const filePath = path.join(this.commandsPath, fileName)
      
      // Create command content
      const commandContent = {
        id: id,
        command: message,
        message: message, // Include both for compatibility
        timestamp: new Date().toISOString()
      }
      
      // Write as JSON string
      await fs.writeFile(filePath, JSON.stringify(commandContent, null, 2), 'utf8')
      
      console.log(`Command file created: ${fileName}`)
      return filePath
    } catch (error) {
      console.error('Failed to write command file:', error)
      throw error
    }
  }
}

module.exports = CommandFileWriter
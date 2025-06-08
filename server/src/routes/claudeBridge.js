const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// POST /api/claude-bridge - Create command file for AutoHotkey
router.post('/', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Message is required'
      });
    }

    // Generate command ID with the expected format
    const timestamp = Date.now();
    const commandId = `cmd_${timestamp}`;
    const fileName = `command_${commandId}.txt`;
    
    // Prepare command content
    const commandContent = {
      id: commandId,
      command: message,
      message: message, // Include both for compatibility
      timestamp: new Date().toISOString()
    };

    // Write command file
    const commandsPath = path.join(process.env.DATA_PATH || '/app/data', 'claude_commands');
    await fs.mkdir(commandsPath, { recursive: true });
    
    const filePath = path.join(commandsPath, fileName);
    await fs.writeFile(filePath, JSON.stringify(commandContent, null, 2), 'utf8');
    
    console.log(`[claude-bridge] Command file created: ${fileName}`);
    
    res.status(201).json({
      success: true,
      commandId: commandId,
      fileName: fileName,
      message: 'Command queued for Claude Code'
    });
    
  } catch (error) {
    console.error('[claude-bridge] Error creating command:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// GET /api/claude-bridge/status - Check status and list pending commands
router.get('/status', async (req, res) => {
  try {
    const commandsPath = path.join(process.env.DATA_PATH || '/app/data', 'claude_commands');
    
    // Check if directory exists
    const dirExists = await fs.access(commandsPath).then(() => true).catch(() => false);
    
    if (!dirExists) {
      return res.json({
        status: 'ready',
        pendingCommands: 0,
        commands: []
      });
    }
    
    // List command files
    const files = await fs.readdir(commandsPath);
    const commandFiles = files.filter(f => f.startsWith('command_') && f.endsWith('.txt'));
    
    res.json({
      status: 'ready',
      pendingCommands: commandFiles.length,
      commands: commandFiles
    });
    
  } catch (error) {
    console.error('[claude-bridge] Error checking status:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

module.exports = router;
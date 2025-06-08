const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// 명령 디렉토리 - Docker 환경에서는 /app/data 사용
const COMMAND_DIR = process.env.NODE_ENV === 'production' 
  ? '/app/data/claude_commands'
  : path.join(process.cwd(), 'data/claude_commands');
const RESPONSE_DIR = process.env.NODE_ENV === 'production'
  ? '/app/data/claude_responses'
  : path.join(process.cwd(), 'data/claude_responses');

// 디렉토리 생성
const ensureDirectories = async () => {
  await fs.mkdir(COMMAND_DIR, { recursive: true });
  await fs.mkdir(RESPONSE_DIR, { recursive: true });
};

// POST /api/claude-bridge/execute - Claude Code에 명령 전송
router.post('/execute', async (req, res) => {
  try {
    console.log('[Claude Bridge] Ensuring directories...');
    await ensureDirectories();
    
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    const commandId = `cmd_${Date.now()}`;
    const commandContent = `ID: ${commandId}
Time: ${new Date().toISOString()}
Priority: normal

Command:
${message}

Instructions for Claude Code:
1. Process this request
2. Save response to file`;
    
    // 고유한 파일명으로 저장 (타임스탬프 사용)
    const fileName = `command_${commandId}.txt`;
    const commandFile = path.join(COMMAND_DIR, fileName);
    console.log(`[Claude Bridge] Writing to file: ${commandFile}`);
    await fs.writeFile(commandFile, commandContent, 'utf8');
    console.log(`[Claude Bridge] File written successfully`);
    
    // 파일이 실제로 존재하는지 확인
    try {
      const stats = await fs.stat(commandFile);
      console.log(`[Claude Bridge] File exists: ${stats.size} bytes`);
    } catch (e) {
      console.error(`[Claude Bridge] File check failed:`, e);
    }
    
    res.json({
      success: true,
      commandId,
      message: 'Command saved for processing'
    });
    
  } catch (error) {
    console.error('Failed to save command:', error);
    res.status(500).json({ error: 'Failed to save command' });
  }
});

// GET /api/claude-bridge/response/:id - 응답 확인
router.get('/response/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const responseFile = path.join(RESPONSE_DIR, `${id}_response.json`);
    
    try {
      const content = await fs.readFile(responseFile, 'utf8');
      const response = JSON.parse(content);
      res.json(response);
    } catch (error) {
      if (error.code === 'ENOENT') {
        res.status(404).json({ error: 'Response not found' });
      } else {
        throw error;
      }
    }
    
  } catch (error) {
    console.error('Failed to read response:', error);
    res.status(500).json({ error: 'Failed to read response' });
  }
});

// POST /api/claude-bridge/notify - AutoHotkey에서 알림 수신
router.post('/notify', async (req, res) => {
  try {
    const { event, data } = req.body;
    console.log(`Notification received: ${event} - ${data}`);
    
    // SSE를 통해 클라이언트에 알림 전달 (필요시)
    if (req.app.locals.sseManager) {
      req.app.locals.sseManager.broadcast({
        type: 'claude_bridge_notification',
        event,
        data
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to process notification:', error);
    res.status(500).json({ error: 'Failed to process notification' });
  }
});

module.exports = router;
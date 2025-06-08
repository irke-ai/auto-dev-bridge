const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// GET /api/claude-history - Claude Bridge 히스토리 조회
router.get('/', async (req, res) => {
  try {
    const commandDir = path.join(__dirname, '../../../data/claude_commands');
    const responseDir = path.join(__dirname, '../../../data/claude_responses');
    
    // 응답 파일들 읽기
    let responseFiles = [];
    try {
      responseFiles = await fs.readdir(responseDir);
    } catch (e) {
      await fs.mkdir(responseDir, { recursive: true });
    }
    
    const history = [];
    
    // 각 응답 파일 읽기
    for (const file of responseFiles) {
      if (file.endsWith('_response.json')) {
        try {
          const content = await fs.readFile(path.join(responseDir, file), 'utf8');
          const response = JSON.parse(content);
          
          // 명령 ID 추출
          const commandId = file.replace('_response.json', '');
          
          history.push({
            id: commandId,
            timestamp: response.timestamp || new Date().toISOString(),
            message: response.request || '(요청 내용 없음)',
            response: response,
            status: response.status || 'success'
          });
        } catch (e) {
          console.error('Error reading response file:', file, e);
        }
      }
    }
    
    // 최신순 정렬
    history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // 최근 20개만 반환
    res.json({ 
      history: history.slice(0, 20),
      total: history.length 
    });
    
  } catch (error) {
    console.error('Failed to get history:', error);
    res.status(500).json({ 
      error: 'Failed to get history',
      history: [] 
    });
  }
});

module.exports = router;
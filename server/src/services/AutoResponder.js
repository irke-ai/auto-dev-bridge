const EventEmitter = require('events')

class AutoResponder extends EventEmitter {
  constructor(dataManager, sseManager) {
    super()
    this.dataManager = dataManager
    this.sseManager = sseManager
    this.isRunning = false
  }

  start() {
    if (this.isRunning) return
    this.isRunning = true
    console.log('AutoResponder started')
  }

  stop() {
    this.isRunning = false
    console.log('AutoResponder stopped')
  }

  async processRequest(request) {
    if (!this.isRunning) return

    console.log(`Processing request: ${request.id}`)
    
    try {
      // Generate automatic response based on request
      const responseContent = this.generateResponse(request)
      
      // Create response
      const response = await this.dataManager.createResponse({
        request_id: request.id,
        content: responseContent,
        status: 'success',
        metadata: {
          auto_generated: true,
          processed_at: new Date().toISOString()
        }
      })

      // Update request status
      await this.dataManager.updateRequest(request.id, {
        status: 'processed'
      })

      // Broadcast response via SSE
      this.sseManager.broadcast('response_created', response)
      
      // Broadcast request update
      this.sseManager.broadcast('request_updated', {
        id: request.id,
        status: 'processed'
      })

      console.log(`Response sent for request: ${request.id}`)
      this.emit('response_sent', { request, response })
      
    } catch (error) {
      console.error(`Failed to process request ${request.id}:`, error)
      this.emit('error', { request, error })
    }
  }

  generateResponse(request) {
    const message = request.message.toLowerCase()
    
    // Simple response logic - can be enhanced with AI integration
    let responseMessage = ''
    let responseType = 'general'
    
    if (message.includes('안녕') || message.includes('hello') || message.includes('hi')) {
      responseMessage = '안녕하세요! AUTO-DEV Bridge입니다. 무엇을 도와드릴까요? 😊'
      responseType = 'greeting'
    } else if (message.includes('감사') || message.includes('thank')) {
      responseMessage = '천만에요! 도움이 되어 기쁩니다. 😄'
      responseType = 'thanks'
    } else if (message.includes('도움') || message.includes('help')) {
      responseMessage = '제가 도와드릴 수 있는 것들:\n- 프로젝트 관리\n- 코드 생성\n- 문서 작성\n- 테스트 지원\n무엇을 도와드릴까요?'
      responseType = 'help'
    } else if (message.includes('시간') || message.includes('time')) {
      responseMessage = `현재 시간은 ${new Date().toLocaleString('ko-KR')}입니다.`
      responseType = 'time'
    } else {
      responseMessage = `"${request.message}"에 대한 요청을 받았습니다. 처리 중입니다...`
      responseType = 'acknowledgment'
    }
    
    return {
      message: responseMessage,
      type: responseType,
      request_summary: request.message.substring(0, 100)
    }
  }
}

module.exports = AutoResponder
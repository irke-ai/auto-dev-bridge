; Response Handler - 응답 처리를 위한 더미 스크립트
; 실제로는 Claude Code의 응답을 캡처하는 것이 어려우므로
; 테스트용 응답을 생성합니다

ResponseDir := "C:\DEV\projects\auto-dev-bridge\data\claude_responses"

; F12: 테스트 응답 생성
F12:: {
    ; 가장 최근 명령 ID 찾기 (실제로는 자동화해야 함)
    commandId := "cmd_" . A_TickCount
    
    ; 테스트 응답 생성
    response := '{'
    response .= '"commandId": "' . commandId . '",'
    response .= '"timestamp": "' . FormatTime(A_Now, "yyyy-MM-dd'T'HH:mm:ss") . '",'
    response .= '"response": "안녕하세요! 저는 Claude Code입니다. 명령을 받았습니다.",'
    response .= '"status": "success"'
    response .= '}'
    
    ; 응답 파일 저장
    responseFile := ResponseDir . "\" . commandId . "_response.json"
    FileAppend(response, responseFile, "UTF-8")
    
    MsgBox("Test response created!`nFile: " . responseFile, "Success", "Iconi")
}

Esc::ExitApp()
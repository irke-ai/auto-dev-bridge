; Simple Test - AutoHotkey v2
; 가장 기본적인 파일 감시 테스트

CommandDir := "C:\DEV\projects\auto-dev-bridge\data\claude_commands"

; 시작 메시지
MsgBox("AutoHotkey v2 Test Started`n`nWatching: " . CommandDir . "\pending.txt`n`nPress F9 to check manually", "Test Started")

; 2초마다 확인
SetTimer(CheckFile, 2000)

CheckFile() {
    pendingFile := CommandDir . "\pending.txt"
    
    if FileExist(pendingFile) {
        ; 파일 발견!
        MsgBox("Found pending.txt!", "File Detected!", "Iconi")
        
        try {
            ; 파일 읽기
            content := FileRead(pendingFile, "UTF-8")
            
            ; 파일 삭제
            FileDelete(pendingFile)
            
            ; 내용 표시
            MsgBox("File Content:`n`n" . SubStr(content, 1, 200), "Content", "Iconi")
            
        } catch as err {
            MsgBox("Error: " . err.Message, "Error", "Iconx")
        }
    }
}

; F9: 수동 확인
F9:: {
    pendingFile := CommandDir . "\pending.txt"
    
    if FileExist(pendingFile) {
        MsgBox("pending.txt EXISTS!", "Manual Check", "Iconi")
    } else {
        MsgBox("pending.txt not found", "Manual Check", "Icon!")
    }
}

; F10: 테스트 파일 생성
F10:: {
    testContent := "Test file created at " . A_Now
    FileAppend(testContent, CommandDir . "\pending.txt", "UTF-8")
    MsgBox("Test file created!", "Test", "Iconi")
}

; Esc: 종료
Esc::ExitApp()
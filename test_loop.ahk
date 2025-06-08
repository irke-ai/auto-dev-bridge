; Loop Test - AutoHotkey v2
; Loop를 사용한 파일 감시

CommandDir := "C:\DEV\projects\auto-dev-bridge\data\claude_commands"

MsgBox("Loop Test Started`n`nPress OK to start watching", "Start")

; 무한 루프로 파일 감시
Loop {
    pendingFile := CommandDir . "\pending.txt"
    
    if FileExist(pendingFile) {
        ; 파일 발견!
        SoundBeep(1000, 200)  ; 비프음
        
        try {
            ; 파일 읽기
            content := FileRead(pendingFile, "UTF-8")
            
            ; 파일 삭제
            FileDelete(pendingFile)
            
            ; 내용 표시
            MsgBox("Found and deleted pending.txt!`n`nContent:`n" . SubStr(content, 1, 200), "Success!", "Iconi")
            
        } catch as err {
            MsgBox("Error: " . err.Message, "Error", "Iconx")
        }
    }
    
    ; 2초 대기
    Sleep(2000)
}

; F9: 파일 확인
F9:: {
    pendingFile := CommandDir . "\pending.txt"
    MsgBox("File exists: " . (FileExist(pendingFile) ? "YES" : "NO"), "Check")
}

; F10: 테스트 파일 생성
F10:: {
    FileAppend("Test from F10 at " . A_Now, CommandDir . "\pending.txt", "UTF-8")
    MsgBox("Created test file", "Test")
}

; Esc: 종료
Esc::ExitApp()
; Auto Claude Input - AutoHotkey v2
; 자동으로 VSCode Claude Code에 입력

CommandDir := "C:\DEV\projects\auto-dev-bridge\data\claude_commands"
LogFile := A_ScriptDir . "\auto_claude_input.log"

WriteLog("=== Auto Claude Input Started ===")

; 타이머 설정
SetTimer(CheckCommandFiles, 1000)  ; 1초마다 확인

; 명령 파일 확인
CheckCommandFiles() {
    static processedFiles := Map()
    
    Loop Files, CommandDir . "\command_*.txt"
    {
        fileName := A_LoopFileName
        
        ; 이미 처리한 파일은 건너뛰기
        if processedFiles.Has(fileName)
            continue
            
        WriteLog("New command file: " . fileName)
        processedFiles[fileName] := true
        
        ; 파일 경로 저장
        fullPath := A_LoopFileFullPath
        
        ; 약간의 지연 후 처리 (파일 쓰기 완료 대기)
        SetTimer(() => ProcessCommandFile(fullPath, fileName), -500)
    }
}

; 명령 파일 처리
ProcessCommandFile(filePath, fileName) {
    WriteLog("Processing: " . fileName)
    WriteLog("File path: " . filePath)
    
    ; 파일 존재 확인
    if !FileExist(filePath) {
        WriteLog("ERROR: File not found - " . filePath)
        return
    }
    
    try {
        ; 파일 읽기
        content := FileRead(filePath, "UTF-8")
        
        ; 명령 추출
        cmd := ParseCommand(content)
        WriteLog("Command ID: " . cmd.id)
        WriteLog("Command text: " . SubStr(cmd.command, 1, 50) . "...")
        
        ; 파일 삭제
        FileDelete(filePath)
        WriteLog("File deleted")
        
        ; VSCode 찾기 및 활성화
        if !WinExist("ahk_exe Code.exe") {
            WriteLog("ERROR: VSCode not found!")
            MsgBox("VSCode를 찾을 수 없습니다!", "Error", "Iconx T3")
            return
        }
        
        ; VSCode 활성화
        WriteLog("Activating VSCode...")
        WinActivate("ahk_exe Code.exe")
        WinWaitActive("ahk_exe Code.exe",, 3)
        
        ; Claude Code 입력 필드로 포커스 이동
        ; 충분한 대기 시간
        Sleep(1000)
        
        ; 기존 텍스트 선택 및 삭제 (선택사항)
        ; Send("^a")
        ; Sleep(100)
        
        ; 명령 입력
        WriteLog("Sending text...")
        SendText(cmd.command)
        Sleep(300)
        
        ; Enter 전송
        WriteLog("Sending Enter...")
        Send("{Enter}")
        
        WriteLog("Command sent successfully!")
        
        ; 성공 알림
        ToolTip("✓ Command sent: " . cmd.id)
        SetTimer(() => ToolTip(), -3000)
        
    } catch as err {
        WriteLog("ERROR: " . err.Message)
        MsgBox("Error: " . err.Message, "Error", "Iconx")
    }
}

; 명령 파싱
ParseCommand(content) {
    cmd := {id: "", command: ""}
    
    ; ID 추출
    if RegExMatch(content, "ID:\s*([^\n]+)", &match) {
        cmd.id := Trim(match[1])
    }
    
    ; Command 추출 - 더 간단한 방법
    pos := InStr(content, "Command:")
    if (pos > 0) {
        ; Command: 다음 줄부터 시작
        startPos := InStr(content, "`n", , pos) + 1
        ; Instructions 전까지 추출
        endPos := InStr(content, "`n`nInstructions")
        if (endPos > 0) {
            cmd.command := Trim(SubStr(content, startPos, endPos - startPos))
        } else {
            ; Instructions가 없으면 끝까지
            cmd.command := Trim(SubStr(content, startPos))
        }
    }
    
    return cmd
}

; 로그 작성
WriteLog(message) {
    timestamp := FormatTime(A_Now, "yyyy-MM-dd HH:mm:ss.fff")
    logEntry := timestamp . " | " . message . "`n"
    
    try {
        FileAppend(logEntry, LogFile, "UTF-8")
    } catch {
        ; 무시
    }
}

; 핫키
F9:: {
    ; 상태 확인
    fileCount := 0
    Loop Files, CommandDir . "\command_*.txt"
        fileCount++
    
    status := "=== Auto Claude Input Status ===`n`n"
    status .= "Directory: " . CommandDir . "`n"
    status .= "Command files waiting: " . fileCount . "`n"
    status .= "VSCode running: " . (WinExist("ahk_exe Code.exe") ? "YES" : "NO") . "`n"
    
    if WinExist("ahk_exe Code.exe") {
        status .= "VSCode window: " . WinGetTitle("ahk_exe Code.exe")
    }
    
    MsgBox(status, "Status", "Iconi")
    
    ; 로그 파일의 마지막 10줄 표시
    if FileExist(LogFile) {
        log := FileRead(LogFile, "UTF-8")
        lines := StrSplit(log, "`n")
        lastLines := ""
        
        Loop Min(10, lines.Length) {
            idx := lines.Length - A_Index + 1
            if (lines[idx] != "")
                lastLines .= lines[idx] . "`n"
        }
        
        if (lastLines != "")
            MsgBox("Recent log entries:`n`n" . lastLines, "Log", "Iconi")
    }
}

F10:: {
    ; VSCode로 수동 전환
    if WinExist("ahk_exe Code.exe") {
        WinActivate()
        MsgBox("VSCode activated!", "Success", "Iconi T1")
    } else {
        MsgBox("VSCode not found!", "Error", "Iconx")
    }
}

F11:: {
    ; 테스트 명령 생성
    testId := "test_" . A_TickCount
    testContent := 'ID: ' . testId . '`n'
    testContent .= 'Time: ' . FormatTime(A_Now, "yyyy-MM-dd HH:mm:ss") . '`n'
    testContent .= 'Priority: normal`n`n'
    testContent .= 'Command:`n'
    testContent .= 'Hello from AutoHotkey test!`n`n'
    testContent .= 'Instructions for Claude Code:`n'
    testContent .= '1. Process this request`n'
    testContent .= '2. Save response to file'
    
    testFile := CommandDir . "\command_" . testId . ".txt"
    FileAppend(testContent, testFile, "UTF-8")
    
    MsgBox("Test command created!`nID: " . testId, "Test", "Iconi T2")
}

; Ctrl+F9: 로그 파일 열기
^F9:: {
    if FileExist(LogFile)
        Run(LogFile)
    else
        MsgBox("Log file not found", "Info", "Iconi")
}

Esc:: {
    WriteLog("=== Auto Claude Input Stopped ===")
    ExitApp()
}
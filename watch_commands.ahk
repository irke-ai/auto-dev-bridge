; Watch Commands - AutoHotkey v2
; command_*.txt 파일들을 감시하는 스크립트

CommandDir := "C:\DEV\projects\auto-dev-bridge\data\claude_commands"
LogFile := A_ScriptDir . "\watch_commands.log"

WriteLog("Watch Commands started - monitoring: " . CommandDir)
MsgBox("Monitoring command files in:`n" . CommandDir, "Started", "T3")

; 타이머 설정
SetTimer(CheckCommandFiles, 2000)

; 명령 파일들 확인
CheckCommandFiles() {
    ; command_*.txt 패턴의 파일들 찾기
    Loop Files, CommandDir . "\command_*.txt"
    {
        WriteLog("Found command file: " . A_LoopFileName)
        ProcessCommandFile(A_LoopFileFullPath, A_LoopFileName)
    }
}

; 명령 파일 처리
ProcessCommandFile(filePath, fileName) {
    WriteLog("Processing: " . fileName)
    
    try {
        ; 파일 읽기
        content := FileRead(filePath, "UTF-8")
        
        ; 파일 삭제 (처리 완료)
        FileDelete(filePath)
        WriteLog("Deleted: " . fileName)
        
        ; 명령 추출
        cmd := ParseCommand(content)
        
        ; VSCode 활성화 확인
        if WinExist("ahk_exe Code.exe") {
            WinActivate()
            Sleep(500)
            
            ; 텍스트 입력
            SendText(cmd.command)
            Sleep(200)
            Send("{Enter}")
            
            WriteLog("Command sent: " . cmd.id)
            
            ; 성공 알림
            ToolTip("Command sent: " . cmd.id)
            SetTimer(() => ToolTip(), -2000)
        } else {
            WriteLog("VSCode not found")
        }
        
    } catch as err {
        WriteLog("Error: " . err.Message)
    }
}

; 명령 파싱
ParseCommand(content) {
    cmd := {id: "", command: ""}
    
    ; ID 추출
    if RegExMatch(content, "ID:\s*([^\n]+)", &match) {
        cmd.id := Trim(match[1])
    }
    
    ; Command 추출
    if RegExMatch(content, "Command:\s*\n([^]*?)(?=\n\nInstructions|$)", &match) {
        cmd.command := Trim(match[1])
    }
    
    return cmd
}

; 로그 작성
WriteLog(message) {
    timestamp := FormatTime(A_Now, "yyyy-MM-dd HH:mm:ss")
    logEntry := timestamp . " - " . message . "`n"
    
    try {
        FileAppend(logEntry, LogFile, "UTF-8")
    } catch {
        ; 무시
    }
}

; 핫키
F9:: {
    ; 현재 상태 확인
    fileCount := 0
    Loop Files, CommandDir . "\command_*.txt"
        fileCount++
    
    status := "Watch Commands Status`n`n"
    status .= "Directory: " . CommandDir . "`n"
    status .= "Command files: " . fileCount . "`n"
    status .= "VSCode running: " . (WinExist("ahk_exe Code.exe") ? "YES" : "NO")
    
    MsgBox(status, "Status", "Iconi")
}

F10:: {
    ; 수동으로 파일 목록 확인
    files := ""
    Loop Files, CommandDir . "\command_*.txt"
        files .= A_LoopFileName . "`n"
    
    if (files = "")
        files := "No command files found"
        
    MsgBox(files, "Command Files", "Iconi")
}

Esc:: {
    WriteLog("Watch Commands stopped")
    ExitApp()
}
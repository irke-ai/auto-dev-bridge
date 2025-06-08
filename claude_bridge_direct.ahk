; Claude Bridge Direct Input - AutoHotkey v2
; VSCode의 현재 활성 입력 필드에 직접 텍스트 입력

; Configuration
CommandDir := "C:\DEV\projects\auto-dev-bridge\data\claude_commands"
ResponseDir := "C:\DEV\projects\auto-dev-bridge\data\claude_responses"
LogFile := A_ScriptDir . "\claude_bridge_direct.log"

; Create directories
DirCreate(CommandDir)
DirCreate(ResponseDir)

; Initialize
WriteLog("Claude Bridge Direct Input started")

; Main timer
SetTimer(CheckCommands, 2000)

; Check for pending commands
CheckCommands() {
    pendingFile := CommandDir . "\pending.txt"
    
    if FileExist(pendingFile) {
        try {
            ; Read command file
            content := FileRead(pendingFile, "UTF-8")
            FileDelete(pendingFile)
            WriteLog("Found command file")
            
            ; Parse command
            cmd := ParseCommand(content)
            if (cmd.command != "") {
                ProcessCommand(cmd)
            }
        } catch as err {
            WriteLog("Error: " . err.Message)
        }
    }
}

; Parse command from file
ParseCommand(content) {
    cmd := {id: "", command: "", priority: "normal"}
    
    ; Extract ID
    if RegExMatch(content, "ID:\s*([^\n]+)", &match) {
        cmd.id := Trim(match[1])
    }
    
    ; Extract command
    if RegExMatch(content, "Command:\s*\n([^]*?)(?=\n\nInstructions|$)", &match) {
        cmd.command := Trim(match[1])
    }
    
    return cmd
}

; Process command - 현재 활성 필드에 직접 입력
ProcessCommand(cmd) {
    WriteLog("Processing command: " . cmd.id)
    
    ; VSCode가 활성화되어 있는지 확인
    if WinActive("ahk_exe Code.exe") {
        WriteLog("VSCode is active")
        
        ; 현재 포커스된 입력 필드에 직접 텍스트 입력
        ; 기존 텍스트를 지우지 않고 바로 입력
        SendText(cmd.command)
        Sleep(200)
        
        ; Enter 키로 전송
        Send("{Enter}")
        
        WriteLog("Command sent directly to active field")
        
        ; 응답 모니터링 시작
        SetTimer(() => CheckResponse(cmd.id), 3000)
    } else {
        ; VSCode가 활성화되어 있지 않으면 활성화 시도
        if WinExist("ahk_exe Code.exe") {
            WinActivate()
            Sleep(500)
            
            ; 다시 시도
            SendText(cmd.command)
            Sleep(200)
            Send("{Enter}")
            
            WriteLog("Activated VSCode and sent command")
        } else {
            WriteLog("VSCode not found")
            SaveErrorResponse(cmd.id, "VSCode not found")
        }
    }
}

; Check for response (placeholder)
CheckResponse(commandId) {
    static checkCount := Map()
    
    if !checkCount.Has(commandId) {
        checkCount[commandId] := 0
    }
    
    checkCount[commandId]++
    
    ; 30회 시도 후 타임아웃
    if checkCount[commandId] > 30 {
        WriteLog("Response timeout: " . commandId)
        checkCount.Delete(commandId)
        SetTimer(() => CheckResponse(commandId), 0)
    }
}

; Save error response
SaveErrorResponse(commandId, errorMsg) {
    responseFile := ResponseDir . "\" . commandId . "_response.json"
    
    responseData := '{'
    responseData .= '"commandId": "' . commandId . '",'
    responseData .= '"timestamp": "' . FormatTime(A_Now, "yyyy-MM-dd HH:mm:ss") . '",'
    responseData .= '"error": "' . errorMsg . '",'
    responseData .= '"status": "error"'
    responseData .= '}'
    
    FileAppend(responseData, responseFile, "UTF-8")
}

; Write log
WriteLog(message) {
    timestamp := FormatTime(A_Now, "yyyy-MM-dd HH:mm:ss")
    logEntry := timestamp . " - " . message . "`n"
    
    try {
        FileAppend(logEntry, LogFile, "UTF-8")
    } catch {
        ; Ignore log errors
    }
}

; Hotkeys
F9:: {
    status := "Claude Bridge Direct Input`n`n"
    status .= "Status: Running`n"
    status .= "VSCode Active: " . (WinActive("ahk_exe Code.exe") ? "YES" : "NO") . "`n"
    status .= "Command Dir: " . CommandDir
    
    MsgBox(status, "Status", "Iconi")
}

F10:: {
    ; 현재 활성 창 정보
    activeWin := WinGetTitle("A")
    activeProcess := WinGetProcessName("A")
    
    info := "Active Window Info:`n`n"
    info .= "Title: " . activeWin . "`n"
    info .= "Process: " . activeProcess . "`n"
    info .= "Is VSCode: " . (activeProcess = "Code.exe" ? "YES" : "NO")
    
    MsgBox(info, "Active Window", "Iconi")
}

F11:: {
    ; 테스트 - 현재 위치에 바로 텍스트 입력
    SendText("Test direct input from F11")
    MsgBox("Text sent to current position!", "Test", "Iconi T1")
}

F12:: {
    ; 테스트 명령 파일 생성
    testCmd := 'ID: test_' . A_TickCount . '`nTime: ' . FormatTime(A_Now, "yyyy-MM-dd HH:mm:ss") . '`nPriority: normal`n`nCommand:`nHello from Claude Bridge Direct!`n`nInstructions for Claude Code:`n1. Process this request`n2. Save response to file'
    
    FileAppend(testCmd, CommandDir . "\pending.txt", "UTF-8")
    MsgBox("Test command created!", "Test", "Iconi")
}

Esc:: {
    WriteLog("Claude Bridge Direct Input stopped")
    ExitApp()
}
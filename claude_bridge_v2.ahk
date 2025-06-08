; Claude Bridge - AutoHotkey v2 Version
; Complete automation system for Claude Code interaction

; Configuration
CommandDir := "C:\DEV\projects\auto-dev-bridge\data\claude_commands"
ResponseDir := "C:\DEV\projects\auto-dev-bridge\data\claude_responses"
LogFile := A_ScriptDir . "\claude_bridge.log"

; Create directories
DirCreate(CommandDir)
DirCreate(ResponseDir)

; Initialize log
WriteLog("Claude Bridge v2 started")

; Main timer for checking commands
SetTimer(CheckCommands, 2000)

; Check for pending commands
CheckCommands() {
    pendingFile := CommandDir . "\pending.txt"
    
    if FileExist(pendingFile) {
        try {
            ; Read command file
            content := FileRead(pendingFile)
            FileDelete(pendingFile)
            WriteLog("Found pending command")
            
            ; Parse command
            cmd := ParseCommand(content)
            if (cmd.command != "") {
                ; Process the command
                ProcessCommand(cmd)
            }
        } catch as err {
            WriteLog("Error processing command: " . err.Message)
        }
    }
}

; Parse command from file content
ParseCommand(content) {
    cmd := {id: "", command: "", priority: "normal"}
    
    ; Extract ID
    if RegExMatch(content, "ID:\s*([^\n]+)", &match) {
        cmd.id := Trim(match[1])
    }
    
    ; Extract priority
    if RegExMatch(content, "Priority:\s*([^\n]+)", &match) {
        cmd.priority := Trim(match[1])
    }
    
    ; Extract command
    if RegExMatch(content, "Command:\s*([^]*?)(?=Instructions|$)", &match) {
        cmd.command := Trim(match[1])
    }
    
    return cmd
}

; Process command by sending to Claude
ProcessCommand(cmd) {
    WriteLog("Processing command: " . cmd.id)
    
    ; Find VSCode window
    if WinExist("ahk_exe Code.exe") {
        ; Activate VSCode
        WinActivate()
        WinWaitActive("ahk_exe Code.exe",, 3)
        Sleep(500)
        
        ; Open Claude Code chat (Ctrl+L)
        Send("^l")
        Sleep(1000)
        
        ; Clear existing text
        Send("^a")
        Sleep(100)
        
        ; Type command
        SendText(cmd.command)
        Sleep(200)
        
        ; Send command (Enter)
        Send("{Enter}")
        WriteLog("Command sent to Claude Code: " . cmd.id)
        
        ; Start monitoring for response
        SetTimer(() => CheckResponse(cmd.id), 3000)
    } else {
        WriteLog("VSCode not found")
        SaveErrorResponse(cmd.id, "VSCode not found")
    }
}

; Check for Claude's response
CheckResponse(commandId) {
    static checkCount := Map()
    
    if !checkCount.Has(commandId) {
        checkCount[commandId] := 0
    }
    
    checkCount[commandId]++
    
    ; Stop checking after 30 attempts (90 seconds)
    if checkCount[commandId] > 30 {
        WriteLog("Response timeout for: " . commandId)
        SaveErrorResponse(commandId, "Response timeout")
        checkCount.Delete(commandId)
        SetTimer(() => CheckResponse(commandId), 0)
        return
    }
    
    ; Try to capture response (placeholder - implement actual capture)
    response := CaptureClaudeResponse()
    if (response != "") {
        SaveResponse(commandId, response)
        checkCount.Delete(commandId)
        SetTimer(() => CheckResponse(commandId), 0)
    }
}

; Capture Claude's response (placeholder implementation)
CaptureClaudeResponse() {
    ; This would need actual implementation based on:
    ; - OCR
    ; - Accessibility APIs
    ; - Browser automation
    ; For now, return empty
    return ""
}

; Save response to file
SaveResponse(commandId, response) {
    responseFile := ResponseDir . "\" . commandId . "_response.json"
    
    responseData := '{'
    responseData .= '"commandId": "' . commandId . '",'
    responseData .= '"timestamp": "' . FormatTime(A_Now, "yyyy-MM-dd HH:mm:ss") . '",'
    responseData .= '"response": "' . StrReplace(response, '"', '\"') . '",'
    responseData .= '"status": "success"'
    responseData .= '}'
    
    try {
        FileAppend(responseData, responseFile, "UTF-8")
        WriteLog("Response saved: " . commandId)
    } catch as err {
        WriteLog("Error saving response: " . err.Message)
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

; Write to log file
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
    MsgBox("Claude Bridge v2 Status`n`nRunning: Yes`nCommand Dir: " . CommandDir . "`nResponse Dir: " . ResponseDir, "Status", "Iconi")
}

F10:: {
    if WinExist("ahk_exe Code.exe") {
        WinActivate()
        MsgBox("VSCode found and activated!", "Success", "Iconi")
    } else {
        MsgBox("VSCode not found.`nPlease open VSCode.", "Not Found", "Iconx")
    }
}

F11:: {
    ; Test command
    testCmd := 'ID: test_' . A_TickCount . '`nTime: ' . FormatTime(A_Now, "yyyy-MM-dd HH:mm:ss") . '`nPriority: normal`n`nCommand:`nHello from AutoHotkey v2!`n`nInstructions for Claude Code:`n1. Process this request`n2. Save response to file'
    
    FileAppend(testCmd, CommandDir . "\pending.txt", "UTF-8")
    MsgBox("Test command created!", "Test", "Iconi")
}

Esc:: {
    WriteLog("Claude Bridge v2 stopped")
    ExitApp()
}
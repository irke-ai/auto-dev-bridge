; AUTO-DEV Bridge AutoHotkey Script
; Version: 2.0
; Purpose: Monitor file changes and input commands to VSCode Claude Code

#Requires AutoHotkey v2.0
#SingleInstance Force

; Configuration
global CommandDir := "C:\DEV\projects\auto-dev-bridge\data\claude_commands"
global ResponseDir := "C:\DEV\projects\auto-dev-bridge\data\claude_responses"
global LogFile := A_ScriptDir . "\auto_claude.log"
global CheckedFiles := Map()

; Create directories if they don't exist
DirCreate(CommandDir)
DirCreate(ResponseDir)

; Initialize
WriteLog("=== AUTO-DEV Bridge AutoHotkey Started ===")
WriteLog("Command Directory: " . CommandDir)
WriteLog("Response Directory: " . ResponseDir)

; Set up file monitoring timer
SetTimer(CheckForCommands, 2000)

; Monitor for command files
CheckForCommands() {
    try {
        ; Look for command_*.txt files
        Loop Files, CommandDir . "\command_*.txt" {
            filePath := A_LoopFileFullPath
            fileName := A_LoopFileName
            
            ; Skip if we've already processed this file
            if (CheckedFiles.Has(filePath)) {
                continue
            }
            
            ; Mark as checked
            CheckedFiles[filePath] := true
            
            ; Process the command file
            ProcessCommandFile(filePath, fileName)
        }
        
        ; Clean up old entries from CheckedFiles
        CleanupCheckedFiles()
    } catch as err {
        WriteLog("Error in CheckForCommands: " . err.Message)
    }
}

; Process a command file
ProcessCommandFile(filePath, fileName) {
    try {
        WriteLog("Processing command file: " . fileName)
        
        ; Read the file content
        content := FileRead(filePath, "UTF-8")
        
        ; Delete the file immediately
        FileDelete(filePath)
        WriteLog("Deleted command file: " . fileName)
        
        ; Parse the command
        cmd := ParseCommand(content)
        
        if (cmd.command == "") {
            WriteLog("Empty command in file: " . fileName)
            return
        }
        
        WriteLog("Command ID: " . cmd.id)
        WriteLog("Command: " . cmd.command)
        
        ; Send to VSCode
        if WinExist("ahk_exe Code.exe") {
            WinActivate()
            WinWaitActive("ahk_exe Code.exe", , 3)
            
            ; Add small delay to ensure window is ready
            Sleep(1000)
            
            ; Send the command
            SendText(cmd.command)
            Sleep(200)
            Send("{Enter}")
            
            WriteLog("Command sent to VSCode: " . cmd.id)
            
            ; Create response file
            CreateResponse(cmd.id, "Command sent successfully")
        } else {
            WriteLog("VSCode not found")
            CreateResponse(cmd.id, "Error: VSCode not found", "error")
        }
    } catch as err {
        WriteLog("Error processing file: " . err.Message)
    }
}

; Parse command from content
ParseCommand(content) {
    cmd := {id: "", command: "", priority: "normal"}
    
    ; Try to parse as JSON first
    try {
        ; Simple JSON parsing for command structure
        if RegExMatch(content, '"id":\s*"([^"]+)"', &match) {
            cmd.id := match[1]
        }
        if RegExMatch(content, '"command":\s*"([^"]+)"', &match) {
            cmd.command := match[1]
        }
        if RegExMatch(content, '"message":\s*"([^"]+)"', &match) {
            cmd.command := match[1]  ; Also check for 'message' field
        }
    } catch {
        ; Fallback to simple text parsing
        cmd.id := "cmd_" . A_TickCount
        cmd.command := Trim(content)
    }
    
    ; Ensure we have an ID
    if (cmd.id == "") {
        cmd.id := "cmd_" . A_TickCount
    }
    
    return cmd
}

; Create response file
CreateResponse(commandId, message, status := "success") {
    try {
        responseFile := ResponseDir . "\" . commandId . "_response.json"
        
        timestamp := FormatTime(A_Now, "yyyy-MM-dd'T'HH:mm:ss.000'Z'")
        
        response := '{'
        response .= '"commandId": "' . commandId . '",'
        response .= '"timestamp": "' . timestamp . '",'
        response .= '"response": "' . message . '",'
        response .= '"status": "' . status . '"'
        response .= '}'
        
        FileAppend(response, responseFile, "UTF-8")
        WriteLog("Response created: " . responseFile)
    } catch as err {
        WriteLog("Error creating response: " . err.Message)
    }
}

; Cleanup old entries from CheckedFiles map
CleanupCheckedFiles() {
    for filePath in CheckedFiles {
        if (!FileExist(filePath)) {
            CheckedFiles.Delete(filePath)
        }
    }
}

; Write to log file
WriteLog(message) {
    try {
        timestamp := FormatTime(A_Now, "yyyy-MM-dd HH:mm:ss")
        logEntry := timestamp . " - " . message . "`n"
        FileAppend(logEntry, LogFile, "UTF-8")
    } catch {
        ; Silently fail if can't write to log
    }
}

; Hotkeys
F9:: {
    msg := "AUTO-DEV Bridge Status`n`n"
    msg .= "Running: Yes`n"
    msg .= "Command Dir: " . CommandDir . "`n"
    msg .= "Files Processed: " . CheckedFiles.Count . "`n"
    
    if FileExist(LogFile) {
        msg .= "`nLog file: " . LogFile
    }
    
    MsgBox(msg, "Status", "Iconi")
}

F10:: {
    ; Test VSCode detection
    if WinExist("ahk_exe Code.exe") {
        WinActivate()
        MsgBox("VSCode found and activated!", "Success", "Iconi")
    } else {
        MsgBox("VSCode not found.`nPlease open VSCode with Claude Code.", "Not Found", "Iconx")
    }
}

F11:: {
    ; Create test command
    testId := "test_" . A_TickCount
    testCmd := '{"id": "' . testId . '", "command": "Hello from AutoHotkey!", "timestamp": "' . FormatTime(A_Now, "yyyy-MM-dd HH:mm:ss") . '"}'
    
    testFile := CommandDir . "\command_" . testId . ".txt"
    FileAppend(testCmd, testFile, "UTF-8")
    
    MsgBox("Test command created!`nFile: " . testFile, "Test", "Iconi")
}

Esc:: {
    WriteLog("=== AUTO-DEV Bridge AutoHotkey Stopped ===")
    ExitApp()
}
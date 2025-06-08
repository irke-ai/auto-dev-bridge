; Claude Bridge Debug Version - AutoHotkey v2
; 디버깅을 위한 상세 로그 버전

; Configuration
CommandDir := "C:\DEV\projects\auto-dev-bridge\data\claude_commands"
ResponseDir := "C:\DEV\projects\auto-dev-bridge\data\claude_responses"
LogFile := A_ScriptDir . "\claude_bridge_debug.log"

; Create directories
DirCreate(CommandDir)
DirCreate(ResponseDir)

; Initialize log
WriteLog("=== Claude Bridge Debug Started ===")
WriteLog("Command Dir: " . CommandDir)
WriteLog("Script Dir: " . A_ScriptDir)

; Main timer
SetTimer(CheckCommands, 2000)

; Check for pending commands
CheckCommands() {
    pendingFile := CommandDir . "\pending.txt"
    WriteLog("Checking for: " . pendingFile)
    
    if FileExist(pendingFile) {
        WriteLog("Found pending.txt!")
        
        try {
            ; Read content
            content := FileRead(pendingFile, "UTF-8")
            WriteLog("File content length: " . StrLen(content))
            WriteLog("First 100 chars: " . SubStr(content, 1, 100))
            
            ; Delete file
            FileDelete(pendingFile)
            WriteLog("File deleted")
            
            ; Parse command
            cmd := ParseCommand(content)
            WriteLog("Parsed command ID: " . cmd.id)
            WriteLog("Command text: " . cmd.command)
            
            ; Show debug message
            MsgBox("Command received!`n`nID: " . cmd.id . "`nCommand: " . cmd.command, "Debug", "Iconi T3")
            
            ; Process command
            ProcessCommand(cmd)
            
        } catch as err {
            WriteLog("ERROR: " . err.Message)
            MsgBox("Error: " . err.Message, "Error", "Iconx")
        }
    }
}

; Parse command
ParseCommand(content) {
    cmd := {id: "", command: "", priority: "normal"}
    
    ; Extract ID
    if RegExMatch(content, "ID:\s*([^\n]+)", &match) {
        cmd.id := Trim(match[1])
    }
    
    ; Extract command - fixed regex
    if RegExMatch(content, "Command:\s*\n([^]*?)(?=\n\nInstructions|$)", &match) {
        cmd.command := Trim(match[1])
    }
    
    WriteLog("ParseCommand result - ID: " . cmd.id . ", Command: " . cmd.command)
    return cmd
}

; Process command
ProcessCommand(cmd) {
    WriteLog("ProcessCommand started")
    
    ; Check VSCode
    if WinExist("ahk_exe Code.exe") {
        WriteLog("VSCode found!")
        
        ; Show what we're about to do
        MsgBox("Will activate VSCode and send:`n" . cmd.command, "About to send", "Iconi T2")
        
        ; Activate VSCode
        WinActivate()
        WinWaitActive("ahk_exe Code.exe",, 3)
        WriteLog("VSCode activated")
        Sleep(500)
        
        ; Open Claude Code chat (Ctrl+L)
        WriteLog("Sending Ctrl+L")
        Send("^l")
        Sleep(1000)
        
        ; Clear and type
        WriteLog("Clearing and typing command")
        Send("^a")
        Sleep(100)
        SendText(cmd.command)
        Sleep(200)
        
        ; Send
        WriteLog("Sending Enter")
        Send("{Enter}")
        
        WriteLog("Command sent successfully!")
        MsgBox("Command sent!", "Success", "Iconi T2")
        
    } else {
        WriteLog("VSCode NOT found!")
        MsgBox("VSCode not found!`nPlease make sure VSCode is running.", "Error", "Iconx")
    }
}

; Write log
WriteLog(message) {
    timestamp := FormatTime(A_Now, "yyyy-MM-dd HH:mm:ss")
    logEntry := timestamp . " - " . message . "`n"
    
    ; Also show in tooltip
    ToolTip(message)
    SetTimer(() => ToolTip(), -2000)
    
    try {
        FileAppend(logEntry, LogFile, "UTF-8")
    } catch {
        ; Ignore
    }
}

; Hotkeys
F9:: {
    status := "Claude Bridge Debug Status`n`n"
    status .= "Command Dir: " . CommandDir . "`n"
    status .= "Pending exists: " . (FileExist(CommandDir . "\pending.txt") ? "YES" : "NO") . "`n"
    status .= "VSCode running: " . (WinExist("ahk_exe Code.exe") ? "YES" : "NO")
    
    MsgBox(status, "Status", "Iconi")
}

F10:: {
    ; List all windows
    windows := ""
    for hwnd in WinGetList() {
        try {
            title := WinGetTitle(hwnd)
            process := WinGetProcessName(hwnd)
            if (title != "") {
                windows .= process . " - " . title . "`n"
            }
        }
    }
    
    MsgBox(SubStr(windows, 1, 1000), "Window List", "Iconi")
}

F11:: {
    ; Create test file
    testCmd := 'ID: test_' . A_TickCount . '`nTime: ' . FormatTime(A_Now, "yyyy-MM-dd HH:mm:ss") . '`nPriority: normal`n`nCommand:`nTest from F11 key`n`nInstructions for Claude Code:`n1. Process this request`n2. Save response to file'
    
    FileAppend(testCmd, CommandDir . "\pending.txt", "UTF-8")
    MsgBox("Test file created!", "Test", "Iconi")
}

Esc:: {
    WriteLog("=== Claude Bridge Debug Stopped ===")
    ExitApp()
}
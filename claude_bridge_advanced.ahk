; Claude Bridge Advanced - AutoHotkey v2
; Advanced automation system with Chrome integration

#Requires AutoHotkey v2.0

; Configuration
class Config {
    static CommandDir := "C:\DEV\projects\auto-dev-bridge\data\claude_commands"
    static ResponseDir := "C:\DEV\projects\auto-dev-bridge\data\claude_responses"
    static LogFile := A_ScriptDir . "\claude_bridge.log"
    static ApiUrl := "http://localhost:3001/api/claude-bridge"
    static ChromeTitle := "Claude"
    static CheckInterval := 2000
    static ResponseTimeout := 90000  ; 90 seconds
}

; Main application class
class ClaudeBridge {
    static pendingChecks := Map()
    static isRunning := false
    
    static Start() {
        ; Initialize directories
        DirCreate(Config.CommandDir)
        DirCreate(Config.ResponseDir)
        
        ; Start main timer
        this.isRunning := true
        SetTimer(() => this.CheckCommands(), Config.CheckInterval)
        
        this.Log("Claude Bridge Advanced started")
        
        ; Show tray menu
        this.SetupTrayMenu()
    }
    
    static Stop() {
        this.isRunning := false
        SetTimer(() => this.CheckCommands(), 0)
        this.Log("Claude Bridge Advanced stopped")
    }
    
    static CheckCommands() {
        if !this.isRunning
            return
            
        pendingFile := Config.CommandDir . "\pending.txt"
        
        if FileExist(pendingFile) {
            try {
                content := FileRead(pendingFile, "UTF-8")
                FileDelete(pendingFile)
                
                cmd := this.ParseCommand(content)
                if cmd.command {
                    this.ProcessCommand(cmd)
                }
            } catch as err {
                this.Log("Error in CheckCommands: " . err.Message)
            }
        }
    }
    
    static ParseCommand(content) {
        cmd := {
            id: "",
            command: "",
            priority: "normal",
            timestamp: ""
        }
        
        ; Use regex to parse fields
        patterns := {
            id: "ID:\s*([^\n]+)",
            timestamp: "Time:\s*([^\n]+)",
            priority: "Priority:\s*([^\n]+)",
            command: "Command:\s*\n([^]*?)(?=\n\nInstructions|$)"
        }
        
        for field, pattern in patterns.ObjOwnProps() {
            if RegExMatch(content, pattern, &match) {
                cmd.%field% := Trim(match[1])
            }
        }
        
        return cmd
    }
    
    static ProcessCommand(cmd) {
        this.Log("Processing command: " . cmd.id)
        
        ; Try VSCode automation
        if this.SendToVSCode(cmd) {
            ; Start monitoring for response
            this.MonitorResponse(cmd.id)
        } else {
            this.SaveErrorResponse(cmd.id, "Could not find VSCode")
        }
    }
    
    static SendToVSCode(cmd) {
        ; Find VSCode window
        if WinExist("ahk_exe Code.exe") {
            try {
                WinActivate()
                WinWaitActive("ahk_exe Code.exe",, 2)
                Sleep(500)
                
                ; Open Claude Code chat (Ctrl+L)
                Send("^l")
                Sleep(1000)
                
                ; Clear existing text
                Send("^a")
                Sleep(100)
                
                ; Send new command
                SendText(cmd.command)
                Sleep(200)
                Send("{Enter}")
                
                this.Log("Command sent to Claude Code: " . cmd.id)
                return true
            } catch as err {
                this.Log("Error sending to VSCode: " . err.Message)
            }
        }
        
        return false
    }
    
    static SendToWindow(cmd) {
        ; Generic window approach
        if WinExist(Config.ChromeTitle) {
            try {
                WinActivate()
                WinWaitActive(,, 2)
                Sleep(300)
                
                Send("^a")
                Sleep(100)
                SendText(cmd.command)
                Sleep(200)
                Send("{Enter}")
                
                this.Log("Command sent to window: " . cmd.id)
                return true
            } catch as err {
                this.Log("Error sending to window: " . err.Message)
            }
        }
        
        return false
    }
    
    static MonitorResponse(commandId) {
        ; Set up response monitoring
        this.pendingChecks[commandId] := {
            startTime: A_TickCount,
            checkCount: 0
        }
        
        ; Start checking for response
        SetTimer(() => this.CheckForResponse(commandId), 3000)
    }
    
    static CheckForResponse(commandId) {
        if !this.pendingChecks.Has(commandId)
            return
            
        check := this.pendingChecks[commandId]
        check.checkCount++
        
        ; Check timeout
        if (A_TickCount - check.startTime) > Config.ResponseTimeout {
            this.Log("Response timeout: " . commandId)
            this.SaveErrorResponse(commandId, "Response timeout after " . Config.ResponseTimeout . "ms")
            this.pendingChecks.Delete(commandId)
            SetTimer(() => this.CheckForResponse(commandId), 0)
            return
        }
        
        ; Try to get response via HTTP
        this.CheckHttpResponse(commandId)
    }
    
    static CheckHttpResponse(commandId) {
        try {
            ; Create HTTP request
            whr := ComObject("WinHttp.WinHttpRequest.5.1")
            whr.Open("GET", Config.ApiUrl . "/response/" . commandId, true)
            whr.SetRequestHeader("Content-Type", "application/json")
            whr.Send()
            whr.WaitForResponse(5)
            
            if (whr.Status = 200) {
                response := whr.ResponseText
                this.SaveResponse(commandId, response)
                this.pendingChecks.Delete(commandId)
                SetTimer(() => this.CheckForResponse(commandId), 0)
                this.Log("Response received via HTTP: " . commandId)
            }
        } catch {
            ; Continue checking
        }
    }
    
    static SaveResponse(commandId, response) {
        responseFile := Config.ResponseDir . "\" . commandId . "_response.json"
        
        ; Parse response if it's already JSON
        try {
            ; If response is already valid JSON, save as-is
            FileAppend(response, responseFile, "UTF-8")
        } catch {
            ; Otherwise create JSON response
            jsonResponse := '{'
            jsonResponse .= '"commandId": "' . commandId . '",'
            jsonResponse .= '"timestamp": "' . FormatTime(A_Now, "yyyy-MM-dd'T'HH:mm:ss") . '",'
            jsonResponse .= '"response": ' . this.EscapeJson(response) . ','
            jsonResponse .= '"status": "success"'
            jsonResponse .= '}'
            
            FileAppend(jsonResponse, responseFile, "UTF-8")
        }
        
        this.Log("Response saved: " . commandId)
        
        ; Notify web server
        this.NotifyServer("response_saved", commandId)
    }
    
    static SaveErrorResponse(commandId, errorMsg) {
        responseFile := Config.ResponseDir . "\" . commandId . "_response.json"
        
        jsonResponse := '{'
        jsonResponse .= '"commandId": "' . commandId . '",'
        jsonResponse .= '"timestamp": "' . FormatTime(A_Now, "yyyy-MM-dd'T'HH:mm:ss") . '",'
        jsonResponse .= '"error": "' . StrReplace(errorMsg, '"', '\"') . '",'
        jsonResponse .= '"status": "error"'
        jsonResponse .= '}'
        
        FileAppend(jsonResponse, responseFile, "UTF-8")
        this.Log("Error response saved: " . commandId . " - " . errorMsg)
    }
    
    static NotifyServer(event, data) {
        try {
            whr := ComObject("WinHttp.WinHttpRequest.5.1")
            whr.Open("POST", Config.ApiUrl . "/notify", true)
            whr.SetRequestHeader("Content-Type", "application/json")
            
            payload := '{"event": "' . event . '", "data": "' . data . '"}'
            whr.Send(payload)
        } catch {
            ; Ignore notification errors
        }
    }
    
    static EscapeJson(str) {
        str := StrReplace(str, "\", "\\")
        str := StrReplace(str, '"', '\"')
        str := StrReplace(str, "`n", "\n")
        str := StrReplace(str, "`r", "\r")
        str := StrReplace(str, "`t", "\t")
        return '"' . str . '"'
    }
    
    static Log(message) {
        timestamp := FormatTime(A_Now, "yyyy-MM-dd HH:mm:ss")
        logEntry := timestamp . " - " . message . "`n"
        
        try {
            FileAppend(logEntry, Config.LogFile, "UTF-8")
        } catch {
            ; Ignore log errors
        }
    }
    
    static SetupTrayMenu() {
        A_TrayMenu.Delete()
        A_TrayMenu.Add("&Status", (*) => this.ShowStatus())
        A_TrayMenu.Add("&Test Command", (*) => this.CreateTestCommand())
        A_TrayMenu.Add()
        A_TrayMenu.Add("&Pause", (*) => this.TogglePause())
        A_TrayMenu.Add()
        A_TrayMenu.Add("&Open Log", (*) => Run(Config.LogFile))
        A_TrayMenu.Add("&Open Command Dir", (*) => Run(Config.CommandDir))
        A_TrayMenu.Add()
        A_TrayMenu.Add("E&xit", (*) => ExitApp())
        
        A_TrayMenu.Default := "&Status"
    }
    
    static ShowStatus() {
        status := "Claude Bridge Advanced`n`n"
        status .= "Status: " . (this.isRunning ? "Running" : "Paused") . "`n"
        status .= "Command Dir: " . Config.CommandDir . "`n"
        status .= "Response Dir: " . Config.ResponseDir . "`n"
        status .= "Pending Checks: " . this.pendingChecks.Count . "`n"
        
        MsgBox(status, "Status", "Iconi")
    }
    
    static TogglePause() {
        if this.isRunning {
            this.Stop()
            A_TrayMenu.Rename("&Pause", "&Resume")
        } else {
            this.Start()
            A_TrayMenu.Rename("&Resume", "&Pause")
        }
    }
    
    static CreateTestCommand() {
        testId := "test_" . A_TickCount
        testCmd := 'ID: ' . testId . '`n'
        testCmd .= 'Time: ' . FormatTime(A_Now, "yyyy-MM-dd'T'HH:mm:ss") . '`n'
        testCmd .= 'Priority: high`n`n'
        testCmd .= 'Command:`n'
        testCmd .= 'Hello from Claude Bridge Advanced! This is a test message.`n`n'
        testCmd .= 'Instructions for Claude Code:`n'
        testCmd .= '1. Process this request`n'
        testCmd .= '2. Save response to file'
        
        FileAppend(testCmd, Config.CommandDir . "\pending.txt", "UTF-8")
        MsgBox("Test command created!`nID: " . testId, "Test", "Iconi 64")
    }
}

; Hotkeys
F9:: ClaudeBridge.ShowStatus()
F10:: {
    if WinExist("ahk_exe Code.exe") {
        WinActivate()
        MsgBox("VSCode activated!", "Success", "Iconi 64")
    } else {
        MsgBox("VSCode not found.", "Not Found", "Iconx")
    }
}
F11:: ClaudeBridge.CreateTestCommand()
^Esc:: {
    if MsgBox("Exit Claude Bridge?", "Confirm", "YN Icon?") = "Yes" {
        ClaudeBridge.Log("User requested exit")
        ExitApp()
    }
}

; Start the application
ClaudeBridge.Start()

; Keep script running
Persistent()
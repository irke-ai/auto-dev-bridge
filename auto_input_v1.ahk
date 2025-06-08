#NoEnv
SendMode Input
SetWorkingDir %A_ScriptDir%

; Configuration
CommandDir := "C:\DEV\projects\auto-dev-bridge\data\claude_commands"

; Start message
MsgBox, Auto Input v1 Started`n`nWatching: %CommandDir%

; Timer
SetTimer, CheckFiles, 1000
return

CheckFiles:
    ; Find command files
    Loop, %CommandDir%\command_*.txt
    {
        ; Process each file
        FilePath := A_LoopFileLongPath
        FileName := A_LoopFileName
        
        ; Read file
        FileRead, content, %FilePath%
        if ErrorLevel
            continue
            
        ; Delete file
        FileDelete, %FilePath%
        
        ; Extract command
        RegExMatch(content, "Command:\s*\n(.*?)(?=\n\nInstructions|$)", match)
        command := match1
        
        ; Activate VSCode
        IfWinExist, ahk_exe Code.exe
        {
            WinActivate
            Sleep, 1000
            
            ; Send text
            SendRaw, %command%
            Sleep, 300
            Send, {Enter}
            
            ; Tooltip
            ToolTip, Command sent!
            SetTimer, RemoveTooltip, -2000
        }
    }
return

RemoveTooltip:
    ToolTip
return

F9::
    MsgBox, Status Check`n`nVSCode: %WinExist("ahk_exe Code.exe")%`nDir: %CommandDir%
return

F11::
    ; Test
    FileAppend, ID: test`nCommand:`nTest message`n`nInstructions:, %CommandDir%\command_test.txt
    MsgBox, Test file created
return

Esc::ExitApp
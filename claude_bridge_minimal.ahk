; Claude Bridge - Minimal Version
#NoEnv
SendMode Input
SetWorkingDir %A_ScriptDir%

; Configuration
CommandDir := "C:\DEV\projects\auto-dev-bridge\data\claude_commands"
ResponseDir := "C:\DEV\projects\auto-dev-bridge\data\claude_responses"

; Create directories
FileCreateDir, %CommandDir%
FileCreateDir, %ResponseDir%

; Check for commands every 2 seconds
SetTimer, CheckCommands, 2000
return

CheckCommands:
    pendingFile := CommandDir . "\pending.txt"
    IfExist, %pendingFile%
    {
        ; Read and delete file
        FileRead, content, %pendingFile%
        FileDelete, %pendingFile%
        
        ; Extract command
        StringGetPos, pos, content, Command:
        if (pos >= 0)
        {
            StringMid, cmd, content, pos + 10
            StringGetPos, pos2, cmd, Instructions
            if (pos2 > 0)
                StringLeft, cmd, cmd, pos2
            cmd := Trim(cmd)
            
            ; Find and activate Claude browser tab
            IfWinExist, Claude
            {
                WinActivate
                Sleep, 500
                
                ; Type command and press Enter
                SendRaw, %cmd%
                Sleep, 100
                Send, {Enter}
            }
        }
    }
return

; F9: Status
F9::
    MsgBox, Claude Bridge is running
return

; F10: Test Claude window
F10::
    IfWinExist, Claude
    {
        MsgBox, Claude window found!
        WinActivate
    }
    else
        MsgBox, Claude window not found
return

; Esc: Exit
Esc::ExitApp
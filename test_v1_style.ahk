#NoEnv
SendMode Input
SetWorkingDir %A_ScriptDir%

; Simple v1 style test
CommandDir := "C:\DEV\projects\auto-dev-bridge\data\claude_commands"

MsgBox, AutoHotkey v1 Style Test Started

; Timer
SetTimer, CheckFile, 2000
return

CheckFile:
    pendingFile := CommandDir . "\pending.txt"
    
    IfExist, %pendingFile%
    {
        MsgBox, Found pending.txt!
        
        FileRead, content, %pendingFile%
        FileDelete, %pendingFile%
        
        MsgBox, Content: %content%
    }
return

F9::
    pendingFile := CommandDir . "\pending.txt"
    IfExist, %pendingFile%
        MsgBox, File EXISTS
    else
        MsgBox, File not found
return

F10::
    FileAppend, Test from F10, %CommandDir%\pending.txt
    MsgBox, Test file created
return

Esc::ExitApp
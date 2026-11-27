' Copyright (c) 2026 FooZzee. All Rights Reserved. Licensed under Proprietary Freeware License.
Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")
baseDir = fso.GetParentFolderName(WScript.ScriptFullName)
psScript = fso.BuildPath(baseDir, "scripts\configurator.ps1")
cmd = "powershell.exe -NoProfile -ExecutionPolicy Bypass -STA -WindowStyle Hidden -File """ & psScript & """"
shell.Run cmd, 0, False

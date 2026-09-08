' Auto-start the dirNodews static web server with no visible console window.
' Launched by the "DirNodewsServer" Windows scheduled task at logon.
' server.mjs lives here in dirMcshmgr and serves its parent (C:\dirNodews) as web root.
Dim oShell
Set oShell = CreateObject("WScript.Shell")
' Run node hidden (window style 0), do not wait for it to exit.
oShell.Run """C:\Program Files\nodejs\node.exe"" ""C:\dirNodews\dirMcshmgr\server.mjs""", 0, False

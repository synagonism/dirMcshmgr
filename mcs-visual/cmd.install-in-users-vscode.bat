@echo off
REM ===========================================================================
REM cmd.install-in-users-vscode.bat
REM Reinstall the Mcs-Visual extension into THIS user's VS Code.
REM The destination folder name is DERIVED from package.json
REM (publisher.name-version), so it always matches VS Code's own convention.
REM Any previously-installed copies (old name or version) are removed first.
REM Native Windows commands only (rmdir / xcopy) + node to read package.json.
REM After it finishes, reload VS Code: Ctrl+Shift+P -> Developer: Reload Window.
REM ===========================================================================
setlocal

set "SRC=%~dp0"
set "EXTDIR=%USERPROFILE%\.vscode\extensions"

REM Derive <publisher>.<name>-<version> from package.json via node.
pushd "%SRC%"
for /f "usebackq delims=" %%v in (`node -p "const p=require('./package.json');p.publisher+'.'+p.name+'-'+p.version"`) do set "ID=%%v"
popd
if not defined ID (
  echo ERROR: could not read package.json ^(is node on PATH?^).
  pause
  exit /b 1
)
set "DST=%EXTDIR%\%ID%"

REM Remove any previously-installed copies of this extension (old name + version).
for /d %%d in ("%EXTDIR%\synagonism.mcsh-visual-*") do rmdir /s /q "%%d"
for /d %%d in ("%EXTDIR%\synagonism.mcs-visual-*")  do rmdir /s /q "%%d"

xcopy "%SRC%*" "%DST%\" /e /i /y /q

REM Drop items not wanted in the installed extension (dev-only files).
del /q "%DST%\cmd.copy-to-Mcsmgr.bat" 2>nul
del /q "%DST%\cmd.install-in-users-vscode.bat" 2>nul
del /q "%DST%\*.vsix" 2>nul
if exist "%DST%\.vscode" rmdir /s /q "%DST%\.vscode"

echo.
echo Installed to %DST%
echo Done. Now reload VS Code (Developer: Reload Window).
echo pause

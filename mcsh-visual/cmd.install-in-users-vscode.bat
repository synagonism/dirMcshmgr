@echo off
REM ===========================================================================
REM cmd.install-in-users-vscode.bat
REM Package the Mcsh-visual-manager extension as a .vsix (vsce package) and
REM install it into THIS user's VS Code (code --install-extension --force).
REM The install goes through VS Code itself, so its registry
REM (%USERPROFILE%\.vscode\extensions\extensions.json) always points to the
REM installed version: a-plain folder copy left it pointing to a-deleted one
REM ("invalid extension").
REM The .vsix name is DERIVED from package.json (<name>-<version>.vsix).
REM After it finishes, reload VS Code: Ctrl+Shift+P -> Developer: Reload Window.
REM ===========================================================================
setlocal

set "SRC=%~dp0"
pushd "%SRC%"

REM Derive <name>-<version>.vsix from package.json via node.
for /f "usebackq delims=" %%v in (`node -p "const p=require('./package.json');p.name+'-'+p.version+'.vsix'"`) do set "VSIX=%%v"
if not defined VSIX (
  echo ERROR: could not read package.json ^(is node on PATH?^).
  popd
  pause
  exit /b 1
)

REM 1. package: vsce is a .cmd, so CALL it (else this script ends with it)
call vsce package
if errorlevel 1 (
  echo ERROR: vsce package failed.
  popd
  pause
  exit /b 1
)
if not exist "%VSIX%" (
  echo ERROR: %VSIX% was not made.
  popd
  pause
  exit /b 1
)

REM 2. install: VS Code removes the older version itself
call code --install-extension "%VSIX%" --force
if errorlevel 1 (
  echo ERROR: code --install-extension failed.
  popd
  pause
  exit /b 1
)

REM copies of the old extension name, from the earlier folder installs
for /d %%d in ("%USERPROFILE%\.vscode\extensions\synagonism.mcs-visual-*") do rmdir /s /q "%%d"

popd
echo.
echo Installed %VSIX%
echo Done. Now reload VS Code (Developer: Reload Window).
pause

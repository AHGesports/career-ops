@echo off
REM Launch Chrome with remote debugging for chrome-devtools-mcp.
REM Run this BEFORE starting Claude Code. Keep window open while working.
REM Sign into Google here — no automation flag = login works.

set PROFILE=%~dp0.chrome-profile
set PORT=9222

echo Launching Chrome with debug port %PORT%, profile: %PROFILE%
echo Keep this Chrome window open. Close = MCP loses connection.
echo.

"C:\Program Files\Google\Chrome\Application\chrome.exe" ^
  --remote-debugging-port=%PORT% ^
  --user-data-dir="%PROFILE%" ^
  --no-first-run ^
  --no-default-browser-check

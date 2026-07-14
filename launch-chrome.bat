@echo off
setlocal

REM Launch a dedicated Chrome profile for Career-Ops CDP automation.
REM The profile lives outside Git and is unique to the current Windows user.

if defined CAREER_OPS_CHROME_PROFILE (
  set "PROFILE=%CAREER_OPS_CHROME_PROFILE%"
) else (
  set "PROFILE=%LOCALAPPDATA%\career-ops\chrome-profile"
)

if defined CAREER_OPS_CHROME_PORT (
  set "PORT=%CAREER_OPS_CHROME_PORT%"
) else (
  set "PORT=9222"
)

if defined CAREER_OPS_CHROME_PATH (
  set "CHROME=%CAREER_OPS_CHROME_PATH%"
) else if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
  set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
) else if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
  set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
) else if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" (
  set "CHROME=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
) else (
  echo Chrome was not found. Set CAREER_OPS_CHROME_PATH to chrome.exe.
  exit /b 1
)

if not exist "%PROFILE%" mkdir "%PROFILE%"

echo Launching Career-Ops Chrome on port %PORT%.
echo Profile: %PROFILE%
echo Sign in to job portals in this window. Close it to end browser access.

start "Career-Ops Chrome" "%CHROME%" ^
  --remote-debugging-port=%PORT% ^
  --user-data-dir="%PROFILE%" ^
  --no-first-run ^
  --no-default-browser-check

endlocal

@echo off
setlocal

REM Usage: launch-chrome.bat [profile-id] [debug-port]
REM Each Career-Ops profile gets its own persistent Chrome data directory.

set "PROFILE_ID=%~1"
set "PORT_ARG=%~2"
set "CAREER_OPS_PROFILE_ID="

if defined PROFILE_ID (
  if defined PORT_ARG (
    for /f "tokens=1,* delims==" %%A in ('node scripts\profile.mjs activate "%PROFILE_ID%" --browser-port "%PORT_ARG%" --batch') do set "%%A=%%B"
  ) else (
    for /f "tokens=1,* delims==" %%A in ('node scripts\profile.mjs activate "%PROFILE_ID%" --batch') do set "%%A=%%B"
  )
) else (
  if defined PORT_ARG (
    for /f "tokens=1,* delims==" %%A in ('node scripts\profile.mjs activate --browser-port "%PORT_ARG%" --batch') do set "%%A=%%B"
  ) else (
    for /f "tokens=1,* delims==" %%A in ('node scripts\profile.mjs activate --batch') do set "%%A=%%B"
  )
)

if not defined CAREER_OPS_PROFILE_ID (
  echo Could not activate a Career-Ops profile.
  echo Create one with: node scripts\profile.mjs create ^<profile-id^> --name "Display Name"
  echo List profiles with: node scripts\profile.mjs list
  exit /b 1
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

if not exist "%CAREER_OPS_CHROME_PROFILE%" mkdir "%CAREER_OPS_CHROME_PROFILE%"

echo Launching Career-Ops profile "%CAREER_OPS_PROFILE_ID%" on port %CAREER_OPS_CHROME_PORT%.
echo Chrome data: %CAREER_OPS_CHROME_PROFILE%
echo Sign in and install the CAPTCHA extension separately for this profile.

start "Career-Ops - %CAREER_OPS_PROFILE_ID%" "%CHROME%" ^
  --remote-debugging-port=%CAREER_OPS_CHROME_PORT% ^
  --user-data-dir="%CAREER_OPS_CHROME_PROFILE%" ^
  --no-first-run ^
  --no-default-browser-check

endlocal

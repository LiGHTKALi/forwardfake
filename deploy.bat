@echo off
cd /d "%~dp0"
node deploy.mjs
if errorlevel 1 (
  echo.
  echo Deployment did not complete. Review the error above.
  pause
)

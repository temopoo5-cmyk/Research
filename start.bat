@echo off
echo Starting backend...
start "Research Server" cmd /k "cd /d %~dp0 && node api/index.js"
timeout /t 2 > nul
echo Starting frontend...
start "Research Client" cmd /k "cd /d %~dp0client && npm start"
echo Both running. Open http://localhost:3000
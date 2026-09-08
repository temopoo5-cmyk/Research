@echo off
echo Starting backend...
start "Research Server" cmd /k "cd /d %~dp0server && npm start"
timeout /t 2 > nul
echo Starting frontend...
start "Research Client" cmd /k "cd /d %~dp0client && npm start"
echo Both running. Open http://localhost:3000

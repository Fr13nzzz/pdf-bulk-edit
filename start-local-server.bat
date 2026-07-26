@echo off
REM Startet einen einfachen statischen Webserver fuer die Anwendung.
REM Nutzung: start-local-server.bat [port]
setlocal
set PORT=%1
if "%PORT%"=="" set PORT=8080
cd /d "%~dp0"
echo Oeffne im Browser: http://localhost:%PORT%
python -m http.server %PORT%

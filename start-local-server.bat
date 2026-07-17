@echo off
REM Startet einen einfachen statischen Webserver fuer den dist/-Ordner.
REM Nutzung: start-local-server.bat [port]
setlocal
set PORT=%1
if "%PORT%"=="" set PORT=8080
cd /d "%~dp0dist"
echo Oeffne im Browser: http://localhost:%PORT%
python -m http.server %PORT%

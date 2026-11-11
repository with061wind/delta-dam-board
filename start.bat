@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
title Dam Intel Board

where python >nul 2>nul
if errorlevel 1 goto try_py
python server.py %*
if errorlevel 1 pause
goto :eof

:try_py
where py >nul 2>nul
if errorlevel 1 goto fallback
py -3 server.py %*
if errorlevel 1 pause
goto :eof

:fallback
echo.
echo   Python 3 was not found.
echo   Opening the static page directly. For stable local storage, install Python 3 and run start.bat again.
echo.
start "" "%~dp0index.html"
pause

@echo off
where py >nul 2>nul
if not errorlevel 1 (
    py -3 "%~dp0start-local.py" %*
) else (
    python "%~dp0start-local.py" %*
)
exit /b %errorlevel%

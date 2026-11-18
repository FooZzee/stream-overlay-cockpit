@echo off
chcp 65001 >nul
title "ETS2 / ATS Native Plugin Builder & Installer (overlayobs_foozzee_telemetry.dll)"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\build-plugin.ps1"
echo.
pause

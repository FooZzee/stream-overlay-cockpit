@echo off
chcp 65001 >nul
title ETS2 / ATS Stream Overlay Cockpit — Telemetry Bridge
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\udp-bridge.ps1"
echo.
pause

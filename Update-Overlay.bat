@echo off
chcp 65001 >nul
title ETS2 / ATS Stream Overlay — Pip-Boy 3000 Update Terminal
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -STA -WindowStyle Hidden -File "%~dp0scripts\updater.ps1"

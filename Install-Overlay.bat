@echo off
chcp 65001 >nul
title ETS2 / ATS Stream Overlay — Setup Wizard
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -STA -WindowStyle Hidden -File "%~dp0scripts\installer.ps1"

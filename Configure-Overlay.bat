@echo off
chcp 65001 >nul
title ETS2 / ATS Stream Overlay Cockpit — Configurator
powershell.exe -NoProfile -ExecutionPolicy Bypass -STA -File "%~dp0scripts\configurator.ps1"

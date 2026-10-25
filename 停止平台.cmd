@echo off
chcp 936 >nul
setlocal
cd /d "%~dp0"
title 农智云 - 停止服务

set "PROJ=%~dp0"
powershell -NoProfile -Command "$proj = '%PROJ%'.Trim(); $procs = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { $_.Name -match 'python' -and $_.CommandLine -and $_.CommandLine -like '*app.py*' -and $_.CommandLine -like ('*' + $proj + '*') }; if (-not $procs) { Write-Host '未发现运行中的农智云服务。'; exit 0 }; foreach ($p in $procs) { Write-Host ('正在停止进程 PID ' + $p.ProcessId); Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue }"

echo.
echo 停止完成。若浏览器页面仍显示旧内容，请按 Ctrl+F5 强制刷新。
echo.
pause
endlocal

@echo off
chcp 936 >nul
setlocal
cd /d "%~dp0"
title 农智云 - 环境检查

echo.
echo ============================================
echo   农智云 环境检查
echo ============================================
echo.

set "PYEXE="
python --version >nul 2>&1
if not errorlevel 1 set "PYEXE=python"
if not defined PYEXE goto :try_py
goto :python_ok

:try_py
py --version >nul 2>&1
if not errorlevel 1 set "PYEXE=py -3"
if not defined PYEXE goto :no_python
goto :python_ok

:no_python
echo [失败] 未检测到 Python 3.11 或更高版本。
echo        请先安装 Python，安装时勾选 Add Python to PATH。
goto :done

:python_ok
echo [通过] Python：
%PYEXE% --version

if not exist ".venv\Scripts\python.exe" goto :no_venv
set "VPY=%CD%\.venv\Scripts\python.exe"
echo [通过] 虚拟环境：.venv
goto :check_deps

:no_venv
echo [提示] 尚未创建 .venv，运行“启动平台.cmd”会自动创建。
set "VPY="
goto :check_deps

:check_deps
if not defined VPY goto :check_env
"%VPY%" -m pip show flask >nul 2>&1
if errorlevel 1 goto :deps_missing
echo [通过] 核心 Python 依赖已就绪。
goto :check_env

:deps_missing
echo [提示] 依赖尚未安装完整，运行“启动平台.cmd”会自动安装。

:check_env
if not exist ".env" goto :no_env
echo [通过] 已存在 .env 配置文件。
findstr /B /C:"DEEPSEEK_API_KEY=sk-" ".env" >nul 2>&1
if errorlevel 1 goto :no_key
echo [提示] 已配置 DEEPSEEK_API_KEY，AI 助手会尝试使用在线模型。
goto :check_port
:no_key
echo [提示] DEEPSEEK_API_KEY 为空，AI 助手使用本地规则库（基础演示模式）。
goto :check_port

:no_env
echo [提示] 未找到 .env，运行“启动平台.cmd”会从 .env.example 复制。

:check_port
powershell -NoProfile -Command "if (Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue) { Write-Host '[提示] 端口 5000 正在被监听。' } else { Write-Host '[通过] 端口 5000 可用。' }"

where node >nul 2>&1
if errorlevel 1 goto :no_node
echo [通过] Node.js：
node --version
goto :check_chrome

:no_node
echo [提示] 未检测到 Node.js（可选，仅 server.js 独立聊天服务需要）。
goto :check_chrome

:check_chrome
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" goto :has_chrome
echo [提示] 未检测到 Chrome，可用任意现代浏览器访问。
goto :done

:has_chrome
echo [通过] 已检测到 Google Chrome。

:done
echo.
echo 建议下一步：运行“启动平台.cmd”。
echo.
pause
endlocal

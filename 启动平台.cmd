@echo off
chcp 936 >nul
setlocal
cd /d "%~dp0"
title 农智云 - 本地服务

echo.
echo ============================================
echo   农智云 AgriTech 中国大陆本地化版
echo   本地地址：http://127.0.0.1:5000
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
echo [错误] 未检测到 Python。
echo        请先安装 Python 3.11 或更高版本，并在安装时勾选 Add Python to PATH。
echo.
pause
exit /b 1

:python_ok
echo [1/4] 检查运行环境：已找到 Python
%PYEXE% --version

if exist ".venv\Scripts\python.exe" goto :venv_ok
echo       正在创建虚拟环境 .venv（首次约 10 秒）...
%PYEXE% -m venv .venv
if errorlevel 1 goto :venv_failed
del /f ".venv\.deps-installed" >nul 2>&1
goto :venv_ok

:venv_failed
echo [错误] 创建虚拟环境失败。
echo.
pause
exit /b 1

:venv_ok
set "VENV_PY=%CD%\.venv\Scripts\python.exe"
if exist ".venv\.deps-installed" goto :deps_done
echo [2/4] 正在安装依赖（仅首次执行，约需 3-8 分钟）...
echo       优先使用阿里云镜像（国内网络更快）...
"%VENV_PY%" -m pip install --upgrade pip --no-cache-dir -i https://mirrors.aliyun.com/pypi/simple/
if errorlevel 1 "%VENV_PY%" -m pip install --upgrade pip --no-cache-dir --no-cache-dir
"%VENV_PY%" -m pip install -r requirements-cn.txt --no-cache-dir -i https://mirrors.aliyun.com/pypi/simple/
if errorlevel 1 goto :install_fallback
goto :deps_installed

:install_fallback
echo       镜像不可用，改用官方源重试...
"%VENV_PY%" -m pip install -r requirements-cn.txt --no-cache-dir
if errorlevel 1 goto :install_failed

:deps_installed
echo ok> ".venv\.deps-installed"
echo       依赖安装完成。
goto :deps_done

:install_failed
echo [错误] 依赖安装失败。国内网络可改用阿里云镜像：
echo   "%VENV_PY%" -m pip install -r requirements-cn.txt --no-cache-dir -i https://mirrors.aliyun.com/pypi/simple/
echo.
pause
exit /b 1

:deps_done
if exist ".env" goto :env_ready
echo [3/4] 未找到 .env，已从 .env.example 复制一份。
copy ".env.example" ".env" >nul
echo       你可以在 .env 中填入 DEEPSEEK_API_KEY 启用在线问答。
goto :env_ready

:env_ready
echo [3/4] 已读取本地 .env 配置。
echo [4/4] 正在启动服务...
echo.
echo   主站：http://127.0.0.1:5000
echo   作物推荐：http://127.0.0.1:5000/crop/
echo   农产品交易市场：http://127.0.0.1:5000/marketplace.html
echo   AI 农业助手：http://127.0.0.1:5000/chat.html
echo.
echo   关闭本窗口或按 Ctrl+C 即可停止服务。
echo.

start "" powershell -NoProfile -Command "Start-Sleep -Seconds 30; Start-Process 'http://127.0.0.1:5000'"

"%VENV_PY%" app.py
if errorlevel 1 goto :run_failed
goto :end

:run_failed
echo.
echo [错误] 服务异常退出，请查看上方日志。
echo.

:end
pause
endlocal

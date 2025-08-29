@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo 🚀 Loki SDK CORS代理服务部署工具
echo ==================================

:: 检查Node.js
echo 📋 检查依赖...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: 需要安装Node.js
    pause
    exit /b 1
)

npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: 需要安装npm
    pause
    exit /b 1
)

echo ✅ 依赖检查通过

:: 创建部署目录
set "deploy_dir=loki-cors-proxy-deploy"
echo 📁 创建部署目录: %deploy_dir%

if exist "%deploy_dir%" (
    rmdir /s /q "%deploy_dir%"
)

mkdir "%deploy_dir%"
cd "%deploy_dir%"

:: 复制必要文件
copy "..\cors-proxy-server.js" .
copy "..\cors-proxy-package.json" package.json
copy "..\vercel.json" .

echo ✅ 部署目录创建完成

:: 安装依赖
echo 📦 安装依赖...
call npm install --production
echo ✅ 依赖安装完成

:: 选择部署方式
echo.
echo 请选择部署方式:
echo 1) 部署到Vercel (推荐)
echo 2) 部署到Netlify
echo 3) 本地部署
echo 4) 退出
echo.
set /p choice="请输入选择 (1-4): "

if "%choice%"=="1" goto deploy_vercel
if "%choice%"=="2" goto deploy_netlify
if "%choice%"=="3" goto deploy_local
if "%choice%"=="4" goto exit
echo ❌ 无效选择
pause
exit /b 1

:deploy_vercel
echo 🚀 部署到Vercel...
vercel --version >nul 2>&1
if errorlevel 1 (
    echo 📦 安装Vercel CLI...
    call npm install -g vercel
)
echo 🔐 请按照提示登录Vercel账户...
call vercel --prod
echo ✅ Vercel部署完成
echo 🌐 你的CORS代理服务地址将在上方显示
goto show_usage

:deploy_netlify
echo 🚀 部署到Netlify...
netlify --version >nul 2>&1
if errorlevel 1 (
    echo 📦 安装Netlify CLI...
    call npm install -g netlify-cli
)
echo 🔐 请按照提示登录Netlify账户...
call netlify deploy --prod --dir=.
echo ✅ Netlify部署完成
goto show_usage

:deploy_local
echo 🚀 本地部署...
echo 📦 安装所有依赖...
call npm install
echo 🔧 启动服务...
echo 📍 服务地址: http://localhost:3000
echo 🔗 健康检查: http://localhost:3000/health
echo 📡 代理端点: http://localhost:3000/proxy?target=^<loki-url^>
echo.
echo 按 Ctrl+C 停止服务
call npm start
goto exit

:show_usage
echo.
echo 📖 使用说明:
echo ==========
echo.
echo 1. 部署完成后，在SDK中配置:
echo    transportMode: 'cors-proxy'
echo    corsProxyUrl: '你的代理服务地址'
echo.
echo 2. 示例配置:
echo    sdkH5.init({
echo      appName: 'my-app',
echo      endpoints: { loki: 'http://your-loki-server:3100' },
echo      transportMode: 'cors-proxy',
echo      corsProxyUrl: 'https://your-proxy.vercel.app'
echo    });
echo.
echo 3. 测试代理服务:
echo    curl 'https://your-proxy.vercel.app/health'
echo.

:exit
echo 👋 再见!
pause

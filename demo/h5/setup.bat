@echo off
chcp 65001 >nul
echo 🚀 设置H5 SDK Demo环境...

REM 检查Node.js版本
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误：未找到Node.js，请先安装Node.js 18+
    pause
    exit /b 1
)

for /f "tokens=1,2,3 delims=." %%a in ('node --version') do set NODE_VERSION=%%a
set NODE_VERSION=%NODE_VERSION:~1%
if %NODE_VERSION% LSS 18 (
    echo ❌ 错误：Node.js版本过低，需要18+，当前版本：
    node --version
    pause
    exit /b 1
)

echo ✅ Node.js版本检查通过：
node --version

REM 检查GitHub Token
if "%GITHUB_TOKEN%"=="" (
    echo ⚠️  警告：未设置GITHUB_TOKEN环境变量
    echo 请设置GITHUB_TOKEN环境变量或在.npmrc文件中配置
    echo 获取Token：https://github.com/settings/tokens
)

REM 安装依赖
echo 📦 安装依赖...
pnpm --version >nul 2>&1
if errorlevel 1 (
    echo 使用npm安装...
    npm install
) else (
    echo 使用pnpm安装...
    pnpm install
)

if errorlevel 1 (
    echo ❌ 依赖安装失败
    pause
    exit /b 1
) else (
    echo ✅ 依赖安装完成
    echo.
    echo 🎉 设置完成！
    echo.
    echo 下一步：
    echo 1. 确保已配置GitHub Token
    echo 2. 运行 'npm run dev' 或 'pnpm dev' 启动开发服务器
    echo 3. 打开浏览器访问 http://localhost:5173
)

pause

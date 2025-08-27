#!/bin/bash

echo "🚀 设置H5 SDK Demo环境..."

# 检查Node.js版本
if ! command -v node &> /dev/null; then
    echo "❌ 错误：未找到Node.js，请先安装Node.js 18+"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ 错误：Node.js版本过低，需要18+，当前版本：$(node -v)"
    exit 1
fi

echo "✅ Node.js版本检查通过：$(node -v)"

# 检查GitHub Token
if [ -z "$GITHUB_TOKEN" ]; then
    echo "⚠️  警告：未设置GITHUB_TOKEN环境变量"
    echo "请设置GITHUB_TOKEN环境变量或在.npmrc文件中配置"
    echo "获取Token：https://github.com/settings/tokens"
fi

# 安装依赖
echo "📦 安装依赖..."
if command -v pnpm &> /dev/null; then
    echo "使用pnpm安装..."
    pnpm install
else
    echo "使用npm安装..."
    npm install
fi

if [ $? -eq 0 ]; then
    echo "✅ 依赖安装完成"
    echo ""
    echo "🎉 设置完成！"
    echo ""
    echo "下一步："
    echo "1. 确保已配置GitHub Token"
    echo "2. 运行 'npm run dev' 或 'pnpm dev' 启动开发服务器"
    echo "3. 打开浏览器访问 http://localhost:5173"
else
    echo "❌ 依赖安装失败"
    exit 1
fi

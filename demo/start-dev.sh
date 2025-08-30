#!/bin/bash

# SDK 开发环境启动脚本

echo "🚀 启动 SDK 开发环境..."
echo ""

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误：请在项目根目录运行此脚本"
    exit 1
fi

# 进入开发环境目录
cd dev

# 检查依赖是否已安装
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    pnpm install
fi

echo "🌐 启动开发服务器..."
echo "📍 访问地址: http://localhost:5174"
echo "🔧 开发环境特点:"
echo "   - 直接引用 SDK 源码"
echo "   - 无需构建和发布"
echo "   - 支持热重载"
echo ""

# 启动开发服务器
pnpm dev

#!/bin/bash

# SDK 生产环境启动脚本

echo "📦 启动 SDK 生产环境..."
echo ""

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误：请在项目根目录运行此脚本"
    exit 1
fi

# 进入生产环境目录
cd h5

# 检查依赖是否已安装
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    pnpm install
fi

echo "🌐 启动生产服务器..."
echo "📍 访问地址: http://localhost:5173"
echo "🔧 生产环境特点:"
echo "   - 引用发布的 npm 包"
echo "   - 验证发布包功能"
echo "   - 模拟真实使用场景"
echo ""

# 启动生产服务器
pnpm dev

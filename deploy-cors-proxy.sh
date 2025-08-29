#!/bin/bash

# Loki SDK CORS代理服务快速部署脚本
# 支持部署到Vercel、Netlify等平台

set -e

echo "🚀 Loki SDK CORS代理服务部署工具"
echo "=================================="

# 检查必要的工具
check_dependencies() {
    echo "📋 检查依赖..."
    
    if ! command -v node &> /dev/null; then
        echo "❌ 错误: 需要安装Node.js"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo "❌ 错误: 需要安装npm"
        exit 1
    fi
    
    echo "✅ 依赖检查通过"
}

# 创建部署目录
create_deploy_dir() {
    local deploy_dir="loki-cors-proxy-deploy"
    
    echo "📁 创建部署目录: $deploy_dir"
    
    if [ -d "$deploy_dir" ]; then
        rm -rf "$deploy_dir"
    fi
    
    mkdir -p "$deploy_dir"
    cd "$deploy_dir"
    
    # 复制必要文件
    cp ../cors-proxy-server.js .
    cp ../cors-proxy-package.json package.json
    cp ../vercel.json .
    
    echo "✅ 部署目录创建完成"
}

# 安装依赖
install_dependencies() {
    echo "📦 安装依赖..."
    npm install --production
    echo "✅ 依赖安装完成"
}

# 部署到Vercel
deploy_to_vercel() {
    echo "🚀 部署到Vercel..."
    
    if ! command -v vercel &> /dev/null; then
        echo "📦 安装Vercel CLI..."
        npm install -g vercel
    fi
    
    echo "🔐 请按照提示登录Vercel账户..."
    vercel --prod
    
    echo "✅ Vercel部署完成"
    echo "🌐 你的CORS代理服务地址将在上方显示"
}

# 部署到Netlify
deploy_to_netlify() {
    echo "🚀 部署到Netlify..."
    
    if ! command -v netlify &> /dev/null; then
        echo "📦 安装Netlify CLI..."
        npm install -g netlify-cli
    fi
    
    echo "🔐 请按照提示登录Netlify账户..."
    netlify deploy --prod --dir=.
    
    echo "✅ Netlify部署完成"
}

# 本地部署
deploy_locally() {
    echo "🚀 本地部署..."
    
    echo "📦 安装所有依赖..."
    npm install
    
    echo "🔧 启动服务..."
    echo "📍 服务地址: http://localhost:3000"
    echo "🔗 健康检查: http://localhost:3000/health"
    echo "📡 代理端点: http://localhost:3000/proxy?target=<loki-url>"
    echo ""
    echo "按 Ctrl+C 停止服务"
    
    npm start
}

# 显示使用说明
show_usage() {
    echo ""
    echo "📖 使用说明:"
    echo "=========="
    echo ""
    echo "1. 部署完成后，在SDK中配置:"
    echo "   transportMode: 'cors-proxy'"
    echo "   corsProxyUrl: '你的代理服务地址'"
    echo ""
    echo "2. 示例配置:"
    echo "   sdkH5.init({"
    echo "     appName: 'my-app',"
    echo "     endpoints: { loki: 'http://your-loki-server:3100' },"
    echo "     transportMode: 'cors-proxy',"
    echo "     corsProxyUrl: 'https://your-proxy.vercel.app'"
    echo "   });"
    echo ""
    echo "3. 测试代理服务:"
    echo "   curl 'https://your-proxy.vercel.app/health'"
    echo ""
}

# 主函数
main() {
    check_dependencies
    
    echo ""
    echo "请选择部署方式:"
    echo "1) 部署到Vercel (推荐)"
    echo "2) 部署到Netlify"
    echo "3) 本地部署"
    echo "4) 退出"
    echo ""
    read -p "请输入选择 (1-4): " choice
    
    case $choice in
        1)
            create_deploy_dir
            install_dependencies
            deploy_to_vercel
            show_usage
            ;;
        2)
            create_deploy_dir
            install_dependencies
            deploy_to_netlify
            show_usage
            ;;
        3)
            create_deploy_dir
            deploy_locally
            ;;
        4)
            echo "👋 再见!"
            exit 0
            ;;
        *)
            echo "❌ 无效选择"
            exit 1
            ;;
    esac
}

# 运行主函数
main "$@"

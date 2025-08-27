#!/bin/bash

# 包名迁移脚本
# 用法: ./scripts/migrate-package-names.sh <old-scope> <new-scope>
# 示例: ./scripts/migrate-package-names.sh @chenpingfromgxu @loki-sdk-org

set -e

OLD_SCOPE=${1:-@chenpingfromgxu}
NEW_SCOPE=${2:-@loki-sdk-org}

if [ -z "$1" ] || [ -z "$2" ]; then
    echo "用法: $0 <old-scope> <new-scope>"
    echo "示例: $0 @chenpingfromgxu @loki-sdk-org"
    exit 1
fi

echo "🚀 开始迁移包名..."
echo "旧作用域: $OLD_SCOPE"
echo "新作用域: $NEW_SCOPE"
echo ""

# 备份当前状态
echo "📦 创建备份..."
if [ ! -d "backup-$(date +%Y%m%d)" ]; then
    mkdir -p "backup-$(date +%Y%m%d)"
    cp -r packages "backup-$(date +%Y%m%d)/"
    cp package.json "backup-$(date +%Y%m%d)/"
    cp pnpm-workspace.yaml "backup-$(date +%Y%m%d)/"
    echo "✅ 备份已创建: backup-$(date +%Y%m%d)/"
fi

# 更新根目录package.json
echo "📝 更新根目录package.json..."
if [ -f "package.json" ]; then
    sed -i "s/$OLD_SCOPE/$NEW_SCOPE/g" package.json
    echo "✅ 根目录package.json已更新"
fi

# 更新所有包的package.json
echo "📝 更新包配置..."
for pkg in packages/*/; do
    if [ -f "${pkg}package.json" ]; then
        echo "  更新 $(basename $pkg)..."
        sed -i "s/$OLD_SCOPE/$NEW_SCOPE/g" "${pkg}package.json"
    fi
done

# 更新工作流配置
echo "📝 更新GitHub Actions配置..."
if [ -f ".github/workflows/publish.yml" ]; then
    sed -i "s/scope: '$OLD_SCOPE'/scope: '$NEW_SCOPE'/g" .github/workflows/publish.yml
    echo "✅ GitHub Actions配置已更新"
fi

# 更新文档文件
echo "📝 更新文档文件..."
find . -name "*.md" -type f -exec sed -i "s/$OLD_SCOPE/$NEW_SCOPE/g" {} \;
find . -name "*.ts" -type f -exec sed -i "s/$OLD_SCOPE/$NEW_SCOPE/g" {} \;
find . -name "*.js" -type f -exec sed -i "s/$OLD_SCOPE/$NEW_SCOPE/g" {} \;
echo "✅ 文档文件已更新"

# 更新demo项目
echo "📝 更新demo项目..."
if [ -f "demo/h5/package.json" ]; then
    sed -i "s/$OLD_SCOPE/$NEW_SCOPE/g" demo/h5/package.json
    echo "✅ demo/h5/package.json已更新"
fi

if [ -f "demo/h5/.npmrc" ]; then
    sed -i "s/$OLD_SCOPE/$NEW_SCOPE/g" demo/h5/.npmrc
    echo "✅ demo/h5/.npmrc已更新"
fi

# 更新TypeScript配置
echo "📝 更新TypeScript配置..."
if [ -f "tsconfig.json" ]; then
    sed -i "s/$OLD_SCOPE/$NEW_SCOPE/g" tsconfig.json
    echo "✅ tsconfig.json已更新"
fi

# 检查是否有遗漏的文件
echo "🔍 检查遗漏的文件..."
MISSING_FILES=$(grep -r "$OLD_SCOPE" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=backup-* 2>/dev/null || true)

if [ -n "$MISSING_FILES" ]; then
    echo "⚠️  发现可能遗漏的文件:"
    echo "$MISSING_FILES"
    echo ""
    echo "请手动检查这些文件并更新包名引用"
else
    echo "✅ 所有文件都已更新"
fi

echo ""
echo "🎉 包名迁移完成！"
echo ""
echo "下一步操作："
echo "1. 检查所有更改是否正确"
echo "2. 提交更改到Git"
echo "3. 推送代码触发新的发布"
echo "4. 通知用户更新依赖"
echo ""
echo "用户需要更新.npmrc配置："
echo "  旧配置: $OLD_SCOPE:registry=https://npm.pkg.github.com"
echo "  新配置: $NEW_SCOPE:registry=https://npm.pkg.github.com"

#!/bin/bash

# SDK-H5 独立仓库设置脚本
# 用于快速创建一个独立的SDK仓库

set -e

echo "🚀 开始设置SDK-H5独立仓库..."

# 配置变量
REPO_NAME="sdk-h5"
GITHUB_USERNAME="chenpingfromgxu"
GITHUB_URL="https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git"

# 检查当前目录
if [ ! -d "packages" ]; then
    echo "❌ 请在sdk-h5目录中运行此脚本"
    exit 1
fi

echo "📁 更新项目结构..."

# 创建必要的目录
mkdir -p {docs,examples,scripts,tests/{unit,integration,e2e}}

# 创建examples目录结构
mkdir -p examples/{vanilla-js,vue3,react,nuxt,react-native}

echo "📝 更新文档文件..."

# 移动和重命名文件
if [ -f "README-STANDALONE.md" ]; then
    mv README-STANDALONE.md README.md
fi

if [ -f "CORS-SOLUTIONS.md" ]; then
    mv CORS-SOLUTIONS.md docs/cors-solutions.md
fi

if [ -f "PUBLISH-GUIDE.md" ]; then
    mv PUBLISH-GUIDE.md docs/publish-guide.md
fi

if [ -f "MIGRATION-GUIDE.md" ]; then
    mv MIGRATION-GUIDE.md docs/migration.md
fi

# 创建API文档模板
cat > docs/api.md << 'EOF'
# API参考文档

## 核心API

### sdkH5.init(config)

初始化SDK实例。

**参数:**
- `config: SdkH5Config` - 配置对象

**示例:**
```typescript
sdkH5.init({
  appName: 'my-app',
  environment: 'production',
  endpoints: { loki: 'https://loki.example.com/loki/api/v1/push' }
});
```

### sdkH5.log(level, message, attributes?)

发送日志记录。

**参数:**
- `level: 'debug' | 'info' | 'warn' | 'error'` - 日志级别
- `message: string` - 日志消息
- `attributes?: Record<string, any>` - 附加属性

### sdkH5.captureError(error, attributes?)

捕获错误。

**参数:**
- `error: unknown` - 错误对象
- `attributes?: Record<string, any>` - 附加属性

更多API详情请查看类型定义文件。
EOF

# 创建使用指南模板
cat > docs/guide.md << 'EOF'
# 使用指南

## 安装

### NPM安装
```bash
npm install @chenpingfromgxu/sdk-h5-core
```

### CDN引用
```html
<script src="https://unpkg.com/@chenpingfromgxu/sdk-h5-core/dist/sdk-h5.umd.js"></script>
```

## 快速开始

### 1. 初始化SDK
```typescript
import { sdkH5, installAutoCapture } from '@chenpingfromgxu/sdk-h5-core';

sdkH5.init({
  appName: 'my-app',
  environment: 'production',
  endpoints: { loki: 'https://loki.example.com/loki/api/v1/push' }
});

installAutoCapture(sdkH5);
```

### 2. 发送日志
```typescript
sdkH5.log('info', '用户登录', { userId: 123 });
```

### 3. 错误处理
```typescript
try {
  // 可能出错的代码
} catch (error) {
  sdkH5.captureError(error, { context: 'login' });
}
```

## 高级功能

### 用户上下文
```typescript
sdkH5.setUser('user-123');
sdkH5.setContext({
  user: { role: 'admin' },
  page: { name: 'dashboard' }
});
```

### 自定义过滤
```typescript
sdkH5.init({
  // ...其他配置
  redact: {
    custom: (envelope) => {
      // 过滤敏感信息
      if (envelope.message.includes('password')) {
        return null; // 丢弃此记录
      }
      return envelope;
    }
  }
});
```
EOF

echo "📦 创建示例项目..."

# 创建vanilla-js示例
cat > examples/vanilla-js/package.json << 'EOF'
{
  "name": "sdk-h5-example-vanilla",
  "private": true,
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  "devDependencies": {
    "vite": "^5.0.0"
  },
  "dependencies": {
    "@chenpingfromgxu/sdk-h5-core": "workspace:*"
  }
}
EOF

cat > examples/vanilla-js/index.html << 'EOF'
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SDK-H5 Vanilla JS示例</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .button { padding: 10px 20px; margin: 10px; border: none; border-radius: 4px; cursor: pointer; }
    .error { background: #ff4444; color: white; }
    .warn { background: #ffaa00; color: white; }
    .info { background: #0088ff; color: white; }
  </style>
</head>
<body>
  <h1>SDK-H5 示例</h1>
  <p>这个示例展示了如何在原生JavaScript中使用SDK-H5。</p>
  
  <div>
    <button class="button error" id="btn-error">触发错误</button>
    <button class="button warn" id="btn-reject">Promise拒绝</button>
    <button class="button info" id="btn-log">发送日志</button>
    <button class="button" id="btn-resource">资源错误</button>
  </div>
  
  <img id="missing-image" style="display: none;" />
  
  <script type="module" src="./main.js"></script>
</body>
</html>
EOF

cat > examples/vanilla-js/main.js << 'EOF'
import { sdkH5, installAutoCapture } from '@chenpingfromgxu/sdk-h5-core';

// 初始化SDK
sdkH5.init({
  appName: 'vanilla-js-example',
  environment: 'development',
  endpoints: { loki: 'unused-in-proxy-mode' },
  useProxy: true,
  proxyPath: '/api/loki',
  corsMode: 'same-origin'
});

// 启用自动错误捕获
installAutoCapture(sdkH5);

// 设置用户信息
sdkH5.setUser('demo-user-123');

// 绑定事件
document.getElementById('btn-error').onclick = () => {
  throw new Error('这是一个演示错误！');
};

document.getElementById('btn-reject').onclick = () => {
  Promise.reject(new Error('未处理的Promise拒绝！'));
};

document.getElementById('btn-log').onclick = () => {
  sdkH5.log('info', '用户点击了日志按钮', { 
    timestamp: Date.now(),
    page: location.pathname 
  });
};

document.getElementById('btn-resource').onclick = () => {
  const img = document.getElementById('missing-image');
  img.src = '/not-exists-' + Date.now() + '.png';
  img.style.display = 'block';
};

console.log('SDK-H5 vanilla示例已加载');
EOF

cat > examples/vanilla-js/vite.config.js << 'EOF'
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@chenpingfromgxu/sdk-h5-core': path.resolve(__dirname, '../../packages/core'),
    },
  },
  server: {
    proxy: {
      '/api/loki': {
        target: 'http://47.77.196.223:3100',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/loki/, ''),
      },
    },
  },
});
EOF

echo "🔧 创建构建脚本..."

# 创建统一构建脚本
cat > scripts/build.sh << 'EOF'
#!/bin/bash

echo "🔨 构建所有包..."

# 清理旧的构建产物
pnpm run clean

# 构建包（按依赖顺序）
pnpm --filter @chenpingfromgxu/sdk-h5-transport-loki build
pnpm --filter @chenpingfromgxu/sdk-h5-core build
pnpm --filter @chenpingfromgxu/sdk-h5-adapter-js build
pnpm --filter @chenpingfromgxu/sdk-h5-adapter-vue build
pnpm --filter @chenpingfromgxu/sdk-h5-adapter-rn build

# 构建UMD版本
pnpm run build:umd

echo "✅ 构建完成！"
EOF

chmod +x scripts/build.sh

# 创建发布脚本
cat > scripts/publish.sh << 'EOF'
#!/bin/bash

echo "📦 发布所有包..."

# 确保代码是最新的
git pull origin main

# 构建
./scripts/build.sh

# 发布到GitHub Packages
pnpm -r publish --access public

echo "✅ 发布完成！"
EOF

chmod +x scripts/publish.sh

echo "📋 更新package.json..."

# 更新根package.json
cat > package.json << 'EOF'
{
  "name": "sdk-h5",
  "version": "1.0.0",
  "description": "轻量级前端错误采集和日志上报SDK",
  "keywords": ["logging", "error-tracking", "loki", "frontend", "sdk"],
  "author": "chenpingfromgxu",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/chenpingfromgxu/sdk-h5.git"
  },
  "homepage": "https://github.com/chenpingfromgxu/sdk-h5#readme",
  "bugs": {
    "url": "https://github.com/chenpingfromgxu/sdk-h5/issues"
  },
  "workspaces": [
    "packages/*",
    "examples/*"
  ],
  "scripts": {
    "build": "./scripts/build.sh",
    "build:umd": "pnpm --filter @chenpingfromgxu/sdk-h5-core build:umd",
    "dev": "pnpm -r dev",
    "clean": "rimraf packages/*/dist examples/*/dist",
    "test": "vitest",
    "test:ci": "vitest run",
    "lint": "eslint packages/*/src --ext .ts,.js",
    "lint:fix": "eslint packages/*/src --ext .ts,.js --fix",
    "type-check": "pnpm -r type-check",
    "publish": "./scripts/publish.sh",
    "changeset": "changeset",
    "version-packages": "changeset version",
    "release": "pnpm build && pnpm changeset publish"
  },
  "devDependencies": {
    "@changesets/cli": "^2.26.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0", 
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.0.0",
    "rimraf": "^5.0.5",
    "tsup": "^7.2.0",
    "typescript": "^5.6.3",
    "vitest": "^1.0.0"
  }
}
EOF

echo "⚙️ 更新GitHub Actions..."

# 确保.github/workflows目录存在
mkdir -p .github/workflows

# 更新发布工作流，使用正确的仓库URL
sed -i 's|py-gitea.git|sdk-h5.git|g' .github/workflows/publish.yml
sed -i 's|sdk-h5/packages|packages|g' .github/workflows/publish.yml

echo "📄 创建LICENSE..."

cat > LICENSE << 'EOF'
MIT License

Copyright (c) 2024 chenpingfromgxu

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOF

echo "📝 创建CHANGELOG..."

cat > CHANGELOG.md << 'EOF'
# 更新日志

所有显著变更都会记录在此文件中。

本项目遵循[语义化版本](https://semver.org/zh-CN/)规范。

## [未发布]

### 新增
- 初始版本发布
- 完整的错误采集和日志上报功能
- 支持Vue、React Native适配器
- CORS解决方案
- 离线缓存支持

### 变更
- 无

### 修复
- 无

## [1.0.0] - 2024-08-27

### 新增
- 🎉 首次发布SDK-H5
EOF

echo "🎯 创建.gitignore..."

cat > .gitignore << 'EOF'
# Dependencies
node_modules/
pnpm-lock.yaml

# Build outputs
dist/
*.tsbuildinfo

# Logs
*.log
logs/

# Environment
.env
.env.local
.env.*.local

# Editor
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Testing
coverage/

# Package manager
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Temporary
.tmp/
.cache/
EOF

echo "✅ 独立仓库设置完成！"

echo ""
echo "📋 下一步："
echo "1. 在GitHub创建新仓库: https://github.com/new"
echo "2. 仓库名称: sdk-h5"
echo "3. 运行以下命令推送代码:"
echo ""
echo "   git init"
echo "   git add ."
echo "   git commit -m 'Initial commit: SDK-H5 独立仓库'"
echo "   git branch -M main"
echo "   git remote add origin ${GITHUB_URL}"
echo "   git push -u origin main"
echo ""
echo "4. 设置GitHub Packages发布权限"
echo "5. 运行示例: cd examples/vanilla-js && pnpm install && pnpm run dev"
echo ""
echo "🎉 完成后你就有了一个专业的SDK仓库！"
EOF

chmod +x /workspace/sdk-h5/STANDALONE-SETUP.sh

<function_calls>
<invoke name="todo_write">
<parameter name="merge">true
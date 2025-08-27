# SDK独立仓库迁移指南

## 🎯 迁移目标

将 `sdk-h5` 从当前项目中分离出来，创建独立的SDK仓库，便于：
- 独立版本管理
- 跨项目复用
- 专业化维护
- 清晰的职责分离

## 📁 新仓库结构

```
sdk-h5-standalone/
├── .github/
│   └── workflows/
│       ├── ci.yml           # 持续集成
│       ├── publish.yml      # 自动发布
│       └── release.yml      # 版本发布
├── packages/
│   ├── core/               # 核心包
│   ├── transport-loki/     # Loki传输
│   ├── adapter-js/         # JS适配器
│   ├── adapter-vue/        # Vue适配器
│   └── adapter-rn/         # RN适配器
├── examples/               # 使用示例
│   ├── vanilla-js/         # 原生JS示例
│   ├── vue3/              # Vue 3示例
│   ├── react/             # React示例
│   └── nuxt/              # Nuxt示例
├── docs/                  # 文档
│   ├── api.md             # API文档
│   ├── guide.md           # 使用指南
│   ├── cors-solutions.md  # CORS解决方案
│   └── migration.md       # 迁移指南
├── scripts/               # 构建脚本
│   ├── build.sh           # 统一构建
│   ├── publish.sh         # 发布脚本
│   └── version.sh         # 版本管理
├── tests/                 # 测试
│   ├── unit/              # 单元测试
│   ├── integration/       # 集成测试
│   └── e2e/               # 端到端测试
├── package.json           # 根包配置
├── pnpm-workspace.yaml    # 工作区配置
├── tsconfig.json          # TS配置
├── README.md              # 主文档
├── CHANGELOG.md           # 更新日志
├── LICENSE                # 开源协议
└── .gitignore             # Git忽略
```

## 🚀 迁移步骤

### 步骤1：创建新仓库

```bash
# 1. 在GitHub创建新仓库：sdk-h5
# 2. 克隆新仓库
git clone https://github.com/chenpingfromgxu/sdk-h5.git
cd sdk-h5
```

### 步骤2：复制SDK代码

```bash
# 从当前项目复制SDK相关文件
cp -r /path/to/current/project/sdk-h5/* ./
```

### 步骤3：更新项目配置

```bash
# 更新包名和仓库信息
find packages -name "package.json" -exec sed -i 's|py-gitea.git|sdk-h5.git|g' {} \;
find packages -name "package.json" -exec sed -i 's|sdk-h5/packages|packages|g' {} \;
```

### 步骤4：完善项目结构

参考本文档的项目结构，添加缺失的目录和文件。

### 步骤5：更新CI/CD配置

更新GitHub Actions配置，适配新的仓库结构。

### 步骤6：测试和验证

```bash
# 安装依赖
pnpm install

# 构建测试
pnpm run build

# 运行示例
cd examples/vanilla-js
pnpm run dev
```

## 📦 新仓库的package.json

```json
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
  "workspaces": [
    "packages/*",
    "examples/*"
  ],
  "scripts": {
    "build": "pnpm -r build",
    "build:umd": "pnpm --filter @chenpingfromgxu/sdk-h5-core build:umd",
    "dev": "pnpm -r dev",
    "clean": "rimraf packages/*/dist examples/*/dist",
    "test": "pnpm -r test",
    "lint": "eslint packages/*/src --ext .ts,.js",
    "type-check": "pnpm -r type-check",
    "publish": "pnpm -r publish",
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
```

## 🔧 CI/CD配置

### GitHub Actions工作流

#### .github/workflows/ci.yml
```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: latest
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm run lint
      - run: pnpm run type-check
      - run: pnpm run test
      - run: pnpm run build
```

#### .github/workflows/publish.yml
```yaml
name: Publish

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: latest
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          registry-url: 'https://npm.pkg.github.com'
          scope: '@chenpingfromgxu'
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm run build
      
      - name: Publish packages
        run: pnpm -r publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## 📚 文档结构

### README.md主文档
- 项目介绍和特性
- 快速开始
- 安装和使用
- API概览
- 示例链接
- 贡献指南

### docs/目录文档
- **api.md** - 完整API文档
- **guide.md** - 详细使用指南  
- **cors-solutions.md** - CORS解决方案
- **migration.md** - 从旧版本迁移
- **contributing.md** - 贡献指南
- **changelog.md** - 更新日志

## 🌟 最佳实践

### 1. 版本管理
使用 [Changesets](https://github.com/changesets/changesets) 进行版本管理：

```bash
# 添加变更记录
pnpm changeset

# 版本升级
pnpm changeset version

# 发布
pnpm changeset publish
```

### 2. 代码质量
- ESLint + TypeScript规则
- Prettier代码格式化
- Husky Git钩子
- 单元测试覆盖

### 3. 文档维护
- 保持README简洁明了
- API文档自动生成
- 示例代码可运行
- 更新日志规范

### 4. 发布流程
- main分支自动发布
- develop分支开发测试
- 语义化版本控制
- 自动生成更新日志

## 🔄 现有项目适配

### 更新依赖引用

```bash
# 卸载旧的workspace依赖
npm uninstall @sdk-h5/core

# 安装新的GitHub包
npm install @chenpingfromgxu/sdk-h5-core

# 或使用新仓库的releases
# 下载: https://github.com/chenpingfromgxu/sdk-h5/releases
```

### 更新import语句

```typescript
// 旧的引用
import { sdkH5 } from '@sdk-h5/core';

// 新的引用（如果使用NPM包）
import { sdkH5 } from '@chenpingfromgxu/sdk-h5-core';

// 或使用CDN
<script src="https://unpkg.com/@chenpingfromgxu/sdk-h5-core/dist/sdk-h5.umd.js"></script>
```

## 📋 迁移检查清单

- [ ] 创建新的GitHub仓库
- [ ] 复制SDK代码和配置
- [ ] 更新package.json配置
- [ ] 设置GitHub Actions
- [ ] 添加完整的文档
- [ ] 创建使用示例
- [ ] 配置测试环境
- [ ] 验证构建和发布
- [ ] 更新现有项目依赖
- [ ] 添加CHANGELOG.md

## 🎯 预期收益

### 短期收益
- ✅ 代码结构更清晰
- ✅ 发布流程更简单
- ✅ 文档更专业

### 长期收益  
- ✅ 便于跨项目复用
- ✅ 独立技术演进
- ✅ 社区贡献友好
- ✅ 维护成本降低

## 📞 支持

迁移过程中如有问题，可以：
1. 查看示例项目
2. 参考GitHub Issues
3. 联系维护团队
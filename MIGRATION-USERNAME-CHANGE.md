# GitHub用户名变更迁移指南

## 问题说明

如果GitHub用户名发生变更，会影响所有使用 `@chenpingfromgxu/*` 包名的项目。

## 解决方案

### 方案1：使用GitHub组织（推荐）

1. **创建GitHub组织**
   - 访问：https://github.com/organizations/new
   - 创建组织，例如：`loki-sdk-org`
   - 将仓库转移到组织下

2. **更新包名**
   ```json
   // 旧包名
   "@chenpingfromgxu/sdk-h5-core"
   
   // 新包名
   "@loki-sdk-org/sdk-h5-core"
   ```

3. **更新所有package.json文件**
   ```bash
   # 批量替换包名
   find . -name "package.json" -exec sed -i 's/@chenpingfromgxu/@loki-sdk-org/g' {} \;
   ```

### 方案2：使用无作用域包名

1. **重新发布为无作用域包**
   ```json
   // 新包名
   "sdk-h5-core"
   "sdk-h5-adapter-vue"
   "sdk-h5-adapter-js"
   "sdk-h5-adapter-rn"
   "sdk-h5-transport-loki"
   ```

2. **更新引用**
   ```typescript
   // 旧引用
   import { sdkH5 } from '@chenpingfromgxu/sdk-h5-core';
   
   // 新引用
   import { sdkH5 } from 'sdk-h5-core';
   ```

### 方案3：保持向后兼容

1. **发布新版本时同时支持两个包名**
   - 保持旧包名继续工作
   - 新版本使用新包名
   - 在文档中说明迁移路径

## 迁移步骤

### 1. 准备阶段
```bash
# 备份当前配置
cp -r packages packages-backup
cp package.json package.json.backup
```

### 2. 更新包配置
```bash
# 更新所有包的package.json
for pkg in packages/*/; do
  cd $pkg
  # 更新包名
  sed -i 's/"name": "@chenpingfromgxu\//"name": "@new-org\//' package.json
  # 更新publishConfig
  sed -i 's/"registry": "https:\/\/npm.pkg.github.com"/"registry": "https:\/\/npm.pkg.github.com"/' package.json
  cd ../..
done
```

### 3. 更新工作流配置
```yaml
# .github/workflows/publish.yml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '18'
    registry-url: 'https://npm.pkg.github.com'
    scope: '@new-org'  # 更新作用域
```

### 4. 更新文档
```bash
# 更新所有文档中的包名引用
find . -name "*.md" -exec sed -i 's/@chenpingfromgxu/@new-org/g' {} \;
find . -name "*.ts" -exec sed -i 's/@chenpingfromgxu/@new-org/g' {} \;
find . -name "*.js" -exec sed -i 's/@chenpingfromgxu/@new-org/g' {} \;
```

### 5. 更新demo项目
```bash
# 更新demo项目的依赖
cd demo/h5
sed -i 's/@chenpingfromgxu/@new-org/g' package.json
sed -i 's/@chenpingfromgxu/@new-org/g' .npmrc
```

## 用户迁移指南

### 对于现有用户

1. **更新.npmrc配置**
   ```bash
   # 旧配置
   @chenpingfromgxu:registry=https://npm.pkg.github.com
   
   # 新配置
   @new-org:registry=https://npm.pkg.github.com
   ```

2. **更新package.json依赖**
   ```json
   {
     "dependencies": {
       "@new-org/sdk-h5-core": "latest"
     }
   }
   ```

3. **更新导入语句**
   ```typescript
   // 旧导入
   import { sdkH5 } from '@chenpingfromgxu/sdk-h5-core';
   
   // 新导入
   import { sdkH5 } from '@new-org/sdk-h5-core';
   ```

4. **重新安装依赖**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

## 最佳实践建议

### 1. 使用组织而非个人账户
- 组织名更稳定，不会因为个人原因改变
- 便于团队协作和权限管理
- 更容易维护长期项目

### 2. 版本管理策略
- 使用语义化版本号
- 在README中明确说明版本兼容性
- 提供详细的迁移指南

### 3. 文档维护
- 保持文档与代码同步
- 提供清晰的安装和使用说明
- 建立问题反馈渠道

## 紧急处理方案

如果用户名突然变更导致包无法访问：

1. **临时解决方案**
   ```bash
   # 使用GitHub Packages的完整URL
   npm install https://github.com/new-username/repo-name/packages/npm/package-name
   ```

2. **联系GitHub支持**
   - 如果包名冲突或访问问题
   - 请求协助处理包名迁移

3. **社区通知**
   - 在GitHub Issues中发布迁移通知
   - 更新所有相关文档和示例

# 用户迁移指南

## 重要通知

如果SDK包的GitHub用户名发生变更，您需要更新项目配置。本指南将帮助您快速完成迁移。

## 快速迁移

### 1. 更新.npmrc配置

```bash
# 旧配置
@chenpingfromgxu:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN

# 新配置（替换为新的作用域）
@new-org:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

### 2. 更新package.json依赖

```json
{
  "dependencies": {
    // 旧依赖
    "@chenpingfromgxu/sdk-h5-core": "latest",
    "@chenpingfromgxu/sdk-h5-adapter-vue": "latest",
    
    // 新依赖（替换为新的包名）
    "@new-org/sdk-h5-core": "latest",
    "@new-org/sdk-h5-adapter-vue": "latest"
  }
}
```

### 3. 更新导入语句

```typescript
// 旧导入
import { sdkH5 } from '@chenpingfromgxu/sdk-h5-core';
import { createSdkVuePlugin } from '@chenpingfromgxu/sdk-h5-adapter-vue';

// 新导入（替换为新的包名）
import { sdkH5 } from '@new-org/sdk-h5-core';
import { createSdkVuePlugin } from '@new-org/sdk-h5-adapter-vue';
```

### 4. 重新安装依赖

```bash
# 删除旧的依赖
rm -rf node_modules package-lock.json pnpm-lock.yaml

# 重新安装
npm install
# 或
pnpm install
```

## 自动化迁移脚本

如果您有多个项目需要迁移，可以使用以下脚本：

### Linux/Mac 脚本

```bash
#!/bin/bash
# migrate-sdk.sh

OLD_SCOPE="@chenpingfromgxu"
NEW_SCOPE="@new-org"

echo "开始迁移SDK依赖..."

# 更新.npmrc
if [ -f ".npmrc" ]; then
    sed -i "s/$OLD_SCOPE/$NEW_SCOPE/g" .npmrc
    echo "✅ .npmrc已更新"
fi

# 更新package.json
if [ -f "package.json" ]; then
    sed -i "s/$OLD_SCOPE/$NEW_SCOPE/g" package.json
    echo "✅ package.json已更新"
fi

# 更新TypeScript/JavaScript文件
find . -name "*.ts" -o -name "*.js" -o -name "*.tsx" -o -name "*.jsx" | xargs sed -i "s/$OLD_SCOPE/$NEW_SCOPE/g"
echo "✅ 代码文件已更新"

# 重新安装依赖
rm -rf node_modules package-lock.json pnpm-lock.yaml
npm install
echo "✅ 依赖已重新安装"

echo "🎉 迁移完成！"
```

### Windows 批处理脚本

```batch
@echo off
REM migrate-sdk.bat

set OLD_SCOPE=@chenpingfromgxu
set NEW_SCOPE=@new-org

echo 开始迁移SDK依赖...

REM 更新.npmrc
if exist .npmrc (
    powershell -Command "(Get-Content .npmrc) -replace '%OLD_SCOPE%', '%NEW_SCOPE%' | Set-Content .npmrc"
    echo ✅ .npmrc已更新
)

REM 更新package.json
if exist package.json (
    powershell -Command "(Get-Content package.json) -replace '%OLD_SCOPE%', '%NEW_SCOPE%' | Set-Content package.json"
    echo ✅ package.json已更新
)

REM 更新TypeScript/JavaScript文件
for /r %%f in (*.ts *.js *.tsx *.jsx) do (
    powershell -Command "(Get-Content '%%f') -replace '%OLD_SCOPE%', '%NEW_SCOPE%' | Set-Content '%%f'"
)
echo ✅ 代码文件已更新

REM 重新安装依赖
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json
if exist pnpm-lock.yaml del pnpm-lock.yaml
npm install
echo ✅ 依赖已重新安装

echo 🎉 迁移完成！
pause
```

## 验证迁移

### 1. 检查安装

```bash
# 检查包是否正确安装
npm list @new-org/sdk-h5-core
# 或
pnpm list @new-org/sdk-h5-core
```

### 2. 测试导入

```typescript
// 测试导入是否正常
import { sdkH5 } from '@new-org/sdk-h5-core';
console.log('SDK导入成功:', sdkH5);
```

### 3. 运行测试

```bash
# 运行项目测试
npm test
# 或
npm run dev
```

## 常见问题

### Q: 迁移后包安装失败怎么办？

A: 检查以下几点：
1. 确认新的GitHub Token有读取包的权限
2. 确认.npmrc配置正确
3. 清除npm缓存：`npm cache clean --force`

### Q: 导入时出现模块找不到的错误？

A: 确保：
1. 包名已正确更新
2. 依赖已重新安装
3. TypeScript配置正确

### Q: 如何回滚到旧版本？

A: 如果新版本有问题，可以：
1. 恢复备份的package.json
2. 使用旧的作用域重新安装
3. 联系维护者获取支持

## 获取帮助

如果遇到迁移问题：

1. **查看文档**：检查项目README和迁移指南
2. **提交Issue**：在GitHub仓库提交问题
3. **社区支持**：在相关社区寻求帮助

## 版本兼容性

- **向后兼容**：新版本通常保持API兼容性
- **破坏性更新**：会在CHANGELOG中明确说明
- **迁移期限**：建议在3个月内完成迁移

---

**注意**：迁移完成后，请及时更新您的CI/CD配置和部署脚本。

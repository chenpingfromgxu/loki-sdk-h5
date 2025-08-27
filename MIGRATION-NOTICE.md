# 🚨 重要通知：包名迁移

## 迁移说明

SDK包名已从 `@chenpingfromgxu/*` 迁移到 `@ppyuesheng-org/*`。

## 新包名

| 旧包名 | 新包名 |
|--------|--------|
| `@chenpingfromgxu/sdk-h5-core` | `@ppyuesheng-org/sdk-h5-core` |
| `@chenpingfromgxu/sdk-h5-adapter-vue` | `@ppyuesheng-org/sdk-h5-adapter-vue` |
| `@chenpingfromgxu/sdk-h5-adapter-js` | `@ppyuesheng-org/sdk-h5-adapter-js` |
| `@chenpingfromgxu/sdk-h5-adapter-rn` | `@ppyuesheng-org/sdk-h5-adapter-rn` |
| `@chenpingfromgxu/sdk-h5-transport-loki` | `@ppyuesheng-org/sdk-h5-transport-loki` |

## 快速迁移

### 1. 更新.npmrc

```bash
# 旧配置
@chenpingfromgxu:registry=https://npm.pkg.github.com

# 新配置
@ppyuesheng-org:registry=https://npm.pkg.github.com
```

### 2. 更新package.json

```json
{
  "dependencies": {
    // 旧依赖
    "@chenpingfromgxu/sdk-h5-core": "latest",
    
    // 新依赖
    "@ppyuesheng-org/sdk-h5-core": "latest"
  }
}
```

### 3. 更新导入语句

```typescript
// 旧导入
import { sdkH5 } from '@chenpingfromgxu/sdk-h5-core';

// 新导入
import { sdkH5 } from '@ppyuesheng-org/sdk-h5-core';
```

### 4. 重新安装依赖

```bash
rm -rf node_modules package-lock.json
npm install
```

## 自动化迁移

使用提供的迁移脚本：

```bash
# Linux/Mac
./scripts/migrate-package-names.sh @chenpingfromgxu @ppyuesheng-org

# Windows
# 手动执行迁移步骤
```

## 兼容性

- **API兼容**：新版本保持完全API兼容
- **功能一致**：所有功能保持不变
- **性能优化**：包含最新的性能优化

## 支持

如有问题，请：
1. 查看 [迁移指南](./USER-MIGRATION-GUIDE.md)
2. 提交 [GitHub Issue](https://github.com/ppyuesheng-org/py-gitea/issues)
3. 联系维护者

## 时间线

- **迁移开始**：立即生效
- **旧包支持**：继续维护3个月
- **完全迁移**：建议在3个月内完成

---

**注意**：请及时更新您的项目配置，避免依赖中断。

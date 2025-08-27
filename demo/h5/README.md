# H5 SDK Demo - NPM版本

这个demo展示了如何使用通过npm安装的H5 SDK。

## 环境要求

- Node.js 18+
- pnpm 或 npm
- GitHub Token（用于访问GitHub Packages）

## 设置步骤

### 1. 配置GitHub Token

在项目根目录创建 `.env` 文件：

```bash
GITHUB_TOKEN=your_github_token_here
```

或者直接在 `.npmrc` 文件中设置：

```bash
@chenpingfromgxu:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=your_github_token_here
```

### 2. 安装依赖

```bash
# 使用pnpm
pnpm install

# 或使用npm
npm install
```

### 3. 启动开发服务器

```bash
# 使用pnpm
pnpm dev

# 或使用npm
npm run dev
```

## 功能说明

这个demo包含以下功能：

- **错误捕获**：自动捕获JavaScript错误
- **Promise拒绝**：捕获未处理的Promise拒绝
- **资源加载错误**：捕获图片等资源加载失败
- **自定义日志**：手动发送日志信息

## 代理配置

demo使用Vite代理来解决CORS问题：

- 开发环境：通过Vite代理到Loki服务器
- 生产环境：需要配置Nginx代理

## 文件说明

- `main.ts`：主要入口文件，使用SDK核心功能
- `main-proxy.ts`：代理模式示例
- `index.html`：HTML页面
- `vite.config.ts`：Vite配置，包含代理设置

## 故障排查

### 1. 包安装失败

确保：
- GitHub Token有效且有读取包的权限
- `.npmrc` 配置正确
- 网络连接正常

### 2. 导入错误

确保：
- 包已正确安装
- 导入路径正确：`@chenpingfromgxu/sdk-h5-core`
- TypeScript配置正确

### 3. 代理问题

检查：
- Vite代理配置是否正确
- Loki服务器是否可访问
- 网络连接是否正常
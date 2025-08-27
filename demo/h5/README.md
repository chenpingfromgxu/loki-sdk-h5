# H5 SDK Demo

这个demo展示了如何使用H5 SDK进行日志收集和错误监控。

## 快速开始

### 1. 安装依赖

```bash
# 使用pnpm
pnpm install

# 或使用npm
npm install
```

### 2. 启动开发服务器

```bash
# 使用pnpm
pnpm dev

# 或使用npm
npm run dev
```

### 3. 访问demo

打开浏览器访问 http://localhost:5173

## 功能说明

这个demo包含以下功能：

- **错误捕获**：自动捕获JavaScript错误
- **Promise拒绝**：捕获未处理的Promise拒绝
- **资源加载错误**：捕获图片等资源加载失败
- **自定义日志**：手动发送日志信息

## 测试功能

页面提供4个测试按钮：

1. **Throw JS Error** - 触发JavaScript错误，测试自动错误捕获
2. **Unhandled Rejection** - 触发未处理的Promise拒绝
3. **Load Missing Image** - 触发资源加载错误
4. **Custom Info Log** - 发送自定义日志

## 代理配置

demo使用Vite代理来解决CORS问题：

- 开发环境：通过Vite代理到Loki服务器
- 生产环境：需要配置Nginx代理

## 文件说明

- `main.ts`：主要入口文件，使用SDK核心功能
- `main-proxy.ts`：代理模式示例
- `index.html`：HTML页面
- `vite.config.ts`：Vite配置，包含代理设置

## 验证方法

1. 打开浏览器开发者工具
2. 切换到Network面板
3. 点击测试按钮
4. 查看网络请求：
   - 应该看到发送到 `/api/loki/loki/api/v1/push` 的POST请求
   - 状态码应该是200（成功）或者显示具体的错误信息
   - 不应该再有CORS错误
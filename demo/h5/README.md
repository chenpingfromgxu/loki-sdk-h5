# SDK-H5 Demo 使用说明

这个demo展示了如何使用SDK代理模式来解决CORS问题。

## 运行方式

### 开发模式（推荐）
```bash
npm run dev
```

开发模式会启动Vite开发服务器，自动代理 `/api/loki/*` 请求到 `http://47.77.196.223:3100`。

### 生产构建
```bash
npm run build
npm run preview
```

## 配置说明

### 1. SDK配置 (main.ts)
- `useProxy: true` - 启用代理模式
- `proxyPath: '/api/loki'` - 代理路径前缀  
- `corsMode: 'same-origin'` - 避免CORS问题

### 2. Vite代理配置 (vite.config.ts)
- 将 `/api/loki/*` 代理到 `http://47.77.196.223:3100/*`
- 自动处理路径重写
- 添加调试日志

## 测试功能

页面提供4个测试按钮：

1. **Throw JS Error** - 触发JavaScript错误，测试自动错误捕获
2. **Unhandled Rejection** - 触发未处理的Promise拒绝
3. **Load Missing Image** - 触发资源加载错误
4. **Custom Info Log** - 发送自定义日志

## 验证方法

1. 打开浏览器开发者工具
2. 切换到Network面板
3. 点击测试按钮
4. 查看网络请求：
   - 应该看到发送到 `/api/loki/loki/api/v1/push` 的POST请求
   - 状态码应该是200（成功）或者显示具体的错误信息
   - 不应该再有CORS错误

## 故障排查

### 如果仍然出现CORS错误：

1. **确认Vite代理配置**
   ```bash
   # 检查控制台是否有代理日志
   # 应该显示: "Sending Request to the Target: POST /api/loki/loki/api/v1/push"
   ```

2. **检查SDK配置**
   ```typescript
   // 确认这些配置存在
   useProxy: true,
   proxyPath: '/api/loki',
   corsMode: 'same-origin'
   ```

3. **验证Loki服务**
   ```bash
   # 直接测试Loki端点是否可访问
   curl -X POST http://47.77.196.223:3100/loki/api/v1/push \
     -H "Content-Type: application/json" \
     -d '{"streams":[]}'
   ```

4. **重启开发服务器**
   ```bash
   # 停止当前服务器 (Ctrl+C)
   npm run dev
   ```

## 生产环境部署

生产环境需要配置Nginx或其他代理服务器，参考项目根目录的 `nginx-loki-proxy.conf` 文件。
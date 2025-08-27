import { sdkH5, installAutoCapture } from '@ppyuesheng-org/sdk-h5-core';

// 代理模式配置 - 解决CORS问题
// 需要配合Nginx或后端代理使用
sdkH5.init({
  appName: 'demo-h5',
  environment: 'dev',
  endpoints: { 
    loki: 'unused-in-proxy-mode' // 代理模式下此值会被忽略
  },
  // 启用代理模式
  useProxy: true,
  proxyPath: '/api/loki', // 代理路径前缀，最终请求 /api/loki/loki/api/v1/push
  corsMode: 'same-origin', // 同源模式，避免CORS问题
});

// 安装自动错误捕获
installAutoCapture(sdkH5);

// 绑定按钮事件
(document.getElementById('btn-error') as HTMLButtonElement).onclick = () => {
  throw new Error('Boom from demo!');
};

(document.getElementById('btn-reject') as HTMLButtonElement).onclick = () => {
  Promise.reject(new Error('Unhandled rejection!'));
};

(document.getElementById('btn-resource') as HTMLButtonElement).onclick = () => {
  const img = document.getElementById('missing') as HTMLImageElement;
  img.src = '/not-exists-' + Date.now() + '.png';
  img.style.display = 'block';
};

(document.getElementById('btn-log') as HTMLButtonElement).onclick = () => {
  sdkH5.log('info', 'User clicked custom log', { path: location.pathname });
};
import { sdkH5, installAutoCapture } from '@ppyuesheng/loki-sdk-h5-core';

// 使用代理模式避免CORS问题
// 开发环境通过Vite代理，生产环境通过Nginx代理
sdkH5.init({
  appName: 'demo-h5',
  environment: 'dev',
  endpoints: { 
    loki: 'unused-in-proxy-mode' // 代理模式下此值会被忽略
  },
  // 启用代理模式解决CORS问题
  useProxy: true,
  proxyPath: '/api/loki',
  corsMode: 'same-origin',
  onError: (err) => {
    console.error('SDK Error:', err);
  }
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
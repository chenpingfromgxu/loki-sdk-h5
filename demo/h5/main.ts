import { sdkH5, installAutoCapture } from '@ppyuesheng/loki-sdk-h5-core';

// 多种传输模式示例 - 用户可以根据部署环境选择最适合的方式

// 方式1: 直接模式（需要Loki服务器支持CORS）
// sdkH5.init({
//   appName: 'demo-h5',
//   environment: 'dev',
//   endpoints: { 
//     loki: 'http://47.77.196.223:3001'
//   },
//   transportMode: 'direct',
//   corsMode: 'cors',
//   onError: (err) => {
//     console.error('SDK Error:', err);
//   }
// });

// 方式2: 本地代理模式（需要配置Nginx等反向代理）
// sdkH5.init({
//   appName: 'demo-h5',
//   environment: 'dev',
//   endpoints: { 
//     loki: 'http://47.77.196.223:3001'
//   },
//   transportMode: 'proxy',
//   proxyPath: '/api/loki',
//   corsMode: 'same-origin',
//   onError: (err) => {
//     console.error('SDK Error:', err);
//   }
// });

// 方式3: CORS代理服务模式（推荐 - 自动检测代理URL）
sdkH5.init({
  appName: 'demo-h5',
  environment: 'dev',
  endpoints: { 
    loki: 'http://47.77.196.223:3100'
  },
  transportMode: 'cors-proxy',
  // corsProxyUrl: 'https://your-cors-proxy-domain.com', // 可选：手动指定代理URL
  autoDetectCorsProxy: true, // 自动检测代理URL（默认true）
  corsMode: 'cors',
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
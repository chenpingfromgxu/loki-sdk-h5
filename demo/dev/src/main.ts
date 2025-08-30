// 开发环境主入口文件
// 直接引用 SDK 源码，无需构建和发布

import { sdkH5, installAutoCapture } from '@ppyuesheng/loki-sdk-h5-core';

// 全局变量用于存储日志
let logHistory: string[] = [];
let currentSdk: any = null;

// 日志记录函数
function log(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    logHistory.push(logEntry);
    
    const logDiv = document.getElementById('log');
    if (logDiv) {
        const className = type === 'error' ? 'error' : 
                         type === 'success' ? 'success' : 
                         type === 'warning' ? 'warning' : 'info';
        logDiv.innerHTML += `<span class="${className}">${logEntry}</span>\n`;
        logDiv.scrollTop = logDiv.scrollHeight;
    }
    
    // 同时输出到控制台
    console.log(`[${type.toUpperCase()}] ${message}`);
}

// 清空日志
function clearLog() {
    logHistory = [];
    const logDiv = document.getElementById('log');
    if (logDiv) {
        logDiv.innerHTML = '日志已清空...\n';
    }
}

// 导出日志
function exportLog() {
    const logText = logHistory.join('\n');
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sdk-test-log-${new Date().toISOString().slice(0, 19)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    log('日志已导出', 'success');
}

// 基础初始化测试
function testBasicInit() {
    log('开始测试基础初始化...', 'info');
    
    try {
        sdkH5.init({
            appName: 'dev-test',
            environment: 'dev',
            endpoints: { 
                loki: 'http://47.77.196.223:3100'
            },
            // 使用智能CORS策略
            corsStrategy: 'auto',
            enableBeaconFallback: true,
            enableOfflineQueue: true,
            onError: (err) => {
                log(`SDK 错误: ${err.message}`, 'error');
            }
        });
        
        currentSdk = sdkH5;
        log('基础初始化成功', 'success');
        
        // 安装自动错误捕获
        installAutoCapture(sdkH5);
        log('自动错误捕获已安装', 'success');
        
    } catch (err) {
        log(`基础初始化失败: ${err instanceof Error ? err.message : String(err)}`, 'error');
    }
}

// 日志记录测试
function testLogging() {
    if (!currentSdk) {
        log('请先初始化 SDK', 'warning');
        return;
    }
    
    log('开始测试日志记录...', 'info');
    
    try {
        currentSdk.log('info', '这是一条信息日志', { test: true, timestamp: Date.now() });
        currentSdk.log('warn', '这是一条警告日志', { level: 'warning' });
        currentSdk.log('error', '这是一条错误日志', { error: 'test error' });
        
        log('日志记录测试完成', 'success');
    } catch (err) {
        log(`日志记录测试失败: ${err instanceof Error ? err.message : String(err)}`, 'error');
    }
}

// 错误捕获测试
function testErrorCapture() {
    if (!currentSdk) {
        log('请先初始化 SDK', 'warning');
        return;
    }
    
    log('开始测试错误捕获...', 'info');
    
    try {
        // 手动捕获一个错误
        const testError = new Error('这是一个测试错误');
        currentSdk.captureError(testError, { context: 'test_capture' }, '测试错误捕获');
        
        log('错误捕获测试完成', 'success');
    } catch (err) {
        log(`错误捕获测试失败: ${err instanceof Error ? err.message : String(err)}`, 'error');
    }
}

// 上下文管理测试
function testContext() {
    if (!currentSdk) {
        log('请先初始化 SDK', 'warning');
        return;
    }
    
    log('开始测试上下文管理...', 'info');
    
    try {
        // 设置用户
        currentSdk.setUser('dev-user-123');
        log('用户已设置', 'success');
        
        // 更新上下文
        currentSdk.setContext({
            app: { version: 'dev-1.0.0' },
            user: { sessionId: 'dev-session-456' }
        });
        log('上下文已更新', 'success');
        
        // 发送一条测试日志
        currentSdk.log('info', '上下文测试日志', { contextTest: true });
        
        log('上下文管理测试完成', 'success');
    } catch (err) {
        log(`上下文管理测试失败: ${err instanceof Error ? err.message : String(err)}`, 'error');
    }
}

// 直接模式测试
function testDirectMode() {
    log('开始测试直接模式...', 'info');
    
    try {
        sdkH5.init({
            appName: 'dev-test-direct',
            environment: 'dev',
            endpoints: { 
                loki: 'http://47.77.196.223:3100'
            },
            corsStrategy: 'direct',
            onError: (err) => {
                log(`直接模式错误: ${err.message}`, 'error');
            }
        });
        
        currentSdk = sdkH5;
        log('直接模式初始化成功', 'success');
        sdkH5.log('info', '直接模式测试日志');
        
    } catch (err) {
        log(`直接模式测试失败: ${err instanceof Error ? err.message : String(err)}`, 'error');
    }
}

// 代理模式测试
function testProxyMode() {
    log('开始测试代理模式...', 'info');
    
    try {
        sdkH5.init({
            appName: 'dev-test-proxy',
            environment: 'dev',
            endpoints: { 
                loki: 'http://47.77.196.223:3100'
            },
            corsStrategy: 'proxy',
            proxyPath: '/api/loki',
            onError: (err) => {
                log(`代理模式错误: ${err.message}`, 'error');
            }
        });
        
        currentSdk = sdkH5;
        log('代理模式初始化成功', 'success');
        sdkH5.log('info', '代理模式测试日志');
        
    } catch (err) {
        log(`代理模式测试失败: ${err instanceof Error ? err.message : String(err)}`, 'error');
    }
}

// Beacon模式测试
function testBeaconMode() {
    log('开始测试Beacon模式...', 'info');
    
    try {
        sdkH5.init({
            appName: 'dev-test-beacon',
            environment: 'dev',
            endpoints: { 
                loki: 'http://47.77.196.223:3100'
            },
            corsStrategy: 'beacon',
            onError: (err) => {
                log(`Beacon模式错误: ${err.message}`, 'error');
            }
        });
        
        currentSdk = sdkH5;
        log('Beacon模式初始化成功', 'success');
        sdkH5.log('info', 'Beacon模式测试日志');
        
    } catch (err) {
        log(`Beacon模式测试失败: ${err instanceof Error ? err.message : String(err)}`, 'error');
    }
}

// 触发 JS 错误
function triggerJsError() {
    log('触发 JS 错误...', 'warning');
    throw new Error('这是一个手动触发的 JS 错误');
}

// 触发 Promise 拒绝
function triggerPromiseRejection() {
    log('触发 Promise 拒绝...', 'warning');
    Promise.reject(new Error('这是一个手动触发的 Promise 拒绝'));
}

// 触发资源加载错误
function triggerResourceError() {
    log('触发资源加载错误...', 'warning');
    const img = new Image();
    img.onerror = () => log('资源加载错误已触发', 'info');
    img.src = '/not-exists-image.png';
}

// 性能测试
function testPerformance() {
    log('开始性能测试...', 'info');
    
    const startTime = performance.now();
    const testCount = 100;
    
    for (let i = 0; i < testCount; i++) {
        if (currentSdk) {
            currentSdk.log('info', `性能测试日志 ${i}`, { testIndex: i });
        }
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    log(`性能测试完成: ${testCount} 条日志，耗时 ${duration.toFixed(2)}ms`, 'success');
    log(`平均每条日志耗时: ${(duration / testCount).toFixed(2)}ms`, 'info');
}

// 初始化页面
function initPage() {
    log('开发测试环境已加载', 'success');
    log('可以直接引用 SDK 源码进行开发和测试', 'info');
    log('修改 SDK 源码后刷新页面即可看到效果', 'info');
}

// 暴露函数到全局
(window as any).testBasicInit = testBasicInit;
(window as any).testLogging = testLogging;
(window as any).testErrorCapture = testErrorCapture;
(window as any).testContext = testContext;
(window as any).testDirectMode = testDirectMode;
(window as any).testProxyMode = testProxyMode;
(window as any).testBeaconMode = testBeaconMode;
(window as any).triggerJsError = triggerJsError;
(window as any).triggerPromiseRejection = triggerPromiseRejection;
(window as any).triggerResourceError = triggerResourceError;
(window as any).clearLog = clearLog;
(window as any).exportLog = exportLog;
(window as any).testPerformance = testPerformance;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initPage);

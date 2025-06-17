import * as http from 'http';
import * as http2 from 'http2';
import * as fs from 'fs';
import * as path from 'path';

// 设置端口号
const HTTP1_PORT = 3031;
const HTTP2_PORT = 3032;

// 定义处理函数
const handleRequest = (req, res) => {
  if (req.url === '/read') {
    // 设置 2 秒定时器，模拟处理时间
    setTimeout(() => {
      // 设置响应头
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      // 返回字符串响应
      res.end('这是来自服务器的响应数据');
    }, 2000);
  } else {
    // 未找到路由的响应
    res.statusCode = 404;
    res.end('Not Found');
  }
};

// 创建 HTTP/1.1 服务器
const httpServer = http.createServer(handleRequest);

// 启动 HTTP/1.1 服务器
httpServer.listen(HTTP1_PORT, () => {
  console.log(`HTTP/1.1 服务器运行在端口 ${HTTP1_PORT}`);
});

// 创建 HTTP/2 服务器（使用 h2c 模式 - 不带 TLS 的 HTTP/2）
const http2Server = http2.createServer();

// 处理 HTTP/2 请求
http2Server.on('stream', (stream, headers) => {
  const path = headers[':path'];

  if (path === '/read') {
    // 设置 2 秒定时器，模拟处理时间
    setTimeout(() => {
      // 发送响应头
      stream.respond({
        'content-type': 'text/plain; charset=utf-8',
        ':status': 200,
      });
      // 发送响应数据并结束流
      stream.end('这是来自 HTTP/2 服务器的响应数据');
    }, 2000);
  } else {
    // 未找到路由的响应
    stream.respond({ ':status': 404 });
    stream.end('Not Found');
  }
});

// 启动 HTTP/2 服务器
http2Server.listen(HTTP2_PORT, () => {
  console.log(`HTTP/2 服务器(h2c)运行在端口 ${HTTP2_PORT}`);
});

// 处理进程退出
process.on('SIGINT', () => {
  console.log('正在关闭服务器...');
  httpServer.close(() => console.log('HTTP/1.1 服务器已关闭'));
  http2Server.close(() => console.log('HTTP/2 服务器已关闭'));
});

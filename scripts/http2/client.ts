import axios from 'axios';
import * as http2 from 'http2';
import * as http from 'http';
import { URL } from 'url';

let agent1 = new http.Agent({
  keepAlive: true,
  maxSockets: 20,
  maxTotalSockets: 20,
});
agent1.on('error', (err) => {
  console.error('HTTP/1.1 Agent error:', err);
});
agent1.on('connection', (socket) => {
  console.log('HTTP/1.1 Agent connection established');
});
let client2 = http2.connect('http://localhost:3032', {
  // createConnection:()=>{

  // }
  //   maxReservedRemoteStreams: 100,
  maxOutstandingPings: 40,
  protocol: 'http:',
  peerMaxConcurrentStreams: 100,
});
client2.on('error', (err) => {
  console.error('HTTP/2 Client error:', err);
});
client2.on('connect', () => {
  console.log('HTTP/2 Client connected');
});

// 原生 HTTP/1.1 请求
function makeHttp1Request(urlString: string) {
  const url = new URL(urlString);

  const options: http.RequestOptions = {
    hostname: url.hostname,
    port: url.port || 80,
    path: url.pathname + url.search,
    method: 'GET',
    headers: {
      'User-Agent': 'Node.js HTTP/1.1 Client',
    },
    agent: agent1,
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.end();
  });
}

// 原生 HTTP/2 请求
function makeHttp2Request(urlString: string) {
  const url = new URL(urlString);

  return new Promise((resolve, reject) => {
    const client = client2;

    const req = client.request({
      ':path': url.pathname + url.search,
      ':method': 'GET',
      'User-Agent': 'Node.js HTTP/2 Client',
    });

    let data = '';

    req.on('data', (chunk) => {
      data += chunk;
    });

    req.on('end', () => {
      try {
        const jsonData = JSON.parse(data);
        resolve(jsonData);
      } catch (e) {
        resolve(data);
      }
    });

    req.on('error', (err) => {
      client.close();
      reject(err);
    });

    req.end();
  });
}

// 使用示例
async function main() {
  try {
    // HTTP/1.1 请求示例
    console.log('发起 HTTP/1.1 请求...');
    let count_1 = 0;
    let latency_1 = 0;
    let count_2 = 0;
    let latency_2 = 0;

    await Promise.allSettled(
      Array.from({ length: 100 }, async (_, i) => {
        const start = Date.now();
        const res = await makeHttp1Request('http://127.0.0.1:3031/read');
        count_1++;
        latency_1 += Date.now() - start;
      }),
    );
    await Promise.allSettled(
      Array.from({ length: 100 }, async (_, i) => {
        const start = Date.now();
        const res = await makeHttp2Request('http://localhost:3032/read');
        count_2++;
        latency_2 += Date.now() - start;
      }),
    );

    console.log(
      `HTTP/1.1 请求成功: ${count_1} 次, 平均延迟: ${latency_1 / count_1} ms`,
    );
    console.log(
      `HTTP/2 请求成功: ${count_2} 次, 平均延迟: ${latency_2 / count_2} ms`,
    );
  } catch (error) {
    console.error('请求出错:', error);
  }
}

main().finally(() => {
  client2.close();
  agent1.destroy();
  console.log('HTTP/2 Client and HTTP/1.1 Agent closed');
});

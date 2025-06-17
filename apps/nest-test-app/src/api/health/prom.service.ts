import { Injectable, OnModuleInit } from '@nestjs/common';
import * as client from 'prom-client';
import { PromHelper } from './prom-helper';

@Injectable()
export class PrometheusService implements OnModuleInit {
  private register: client.Registry;

  // 创建一些示例指标
  private httpRequestCounter = new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
  });

  private httpRequestDurationHistogram = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
  });

  constructor() {
    // 创建一个新的注册表并设置默认指标收集器
    this.register = PromHelper.registry;
    this.register.registerMetric(this.httpRequestCounter);
    this.register.registerMetric(this.httpRequestDurationHistogram);

    // 收集默认指标 (如 Node.js内存、CPU使用率等)
    client.collectDefaultMetrics({ register: this.register });
  }

  onModuleInit() {
    console.log('Prometheus metrics initialized');
  }

  // 用于记录HTTP请求
  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    duration: number,
  ): void {
    this.httpRequestCounter.inc({ method, route, status_code: statusCode });
    this.httpRequestDurationHistogram.observe(
      { method, route, status_code: statusCode },
      duration / 1000, // 将毫秒转换为秒
    );
  }

  // 获取所有指标以暴露给Prometheus
  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }
}

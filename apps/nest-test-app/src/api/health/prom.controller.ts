import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { PrometheusService } from './prom.service';
import { PromHelper, countTest, ObserveHttp } from './prom-helper';

@Controller('metrics')
export class MetricsController {
  constructor(private prometheusService: PrometheusService) {}

  @Get()
  @ObserveHttp((end) => end({ method: 'get', path: 'metrics' }))
  async getMetrics(@Res() response: Response) {
    const metrics = await this.prometheusService.getMetrics();
    response.setHeader('Content-Type', 'text/plain');
    countTest(1, { method: 'get', path: 'metrics' });
    return response.send(metrics);
  }
}

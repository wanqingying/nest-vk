import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  OnModuleInit,
} from '@nestjs/common';
import { HealthService } from './health.service';
import { Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { hero } from '@libs/microrpc/protos/hero.js';
import axios from 'axios';

@Controller('health')
export class HealthController implements OnModuleInit {
  private heroService: hero.HeroesService;
  constructor(
    private readonly healthService: HealthService,
    // rpc
    @Inject('GRPC_HERO') private client: ClientGrpc,
  ) {}

  async onModuleInit() {
    console.log('init rpc HeroesService');
    this.heroService =
      this.client.getService<hero.HeroesService>('HeroesService');
  }

  @Get()
  check() {
    return 'ok-' + process.env.HOSTNAME;
  }

  @Get('/test-rpc')
  async test() {
    const res = await this.heroService.findOne({ id: 1 });
    return res;
  }

  @Get('/server-health')
  async s_health() {
    const res = await axios.get('http://172.18.0.5:3004/health');
    return res.data;
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.healthService.findOne(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.healthService.remove(+id);
  }
}

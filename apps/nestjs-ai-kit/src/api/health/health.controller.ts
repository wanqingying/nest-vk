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
import { CreateHealthDto } from './dto/create-health.dto';
import { UpdateHealthDto } from './dto/update-health.dto';
import { Inject } from '@nestjs/common';
import { ClientProxy, ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { hero } from '@app/microrpc/protos/hero.js';

const HeroService = hero.HeroesService;

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

  @Post()
  create(@Body() createHealthDto: CreateHealthDto) {
    return this.healthService.create(createHealthDto);
  }

  @Get()
  check() {
    return 'ok-' + process.env.HOSTNAME;
  }

  @Get('/test-rpc')
  async test() {
    const res = await this.heroService.findOne({ id: 1 });
    console.log('hero rpc test', res);
    return res;
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.healthService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateHealthDto: UpdateHealthDto) {
    return this.healthService.update(+id, updateHealthDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.healthService.remove(+id);
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { HealthService } from './health.service';
import { getNodeEnv ,getServerNodeId} from '@libs/utils/src';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Post()
  create(@Body() createHealthDto: any) {
    return this.healthService.create(createHealthDto);
  }

  @Get()
  check() {
    const ok = 'ok-' + getNodeEnv('CONSUL_ID');
    console.log('health ', ok);
    return ok;
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.healthService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateHealthDto: any) {
    return this.healthService.update(+id, updateHealthDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.healthService.remove(+id);
  }
}

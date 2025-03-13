import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, GrpcMethod } from '@nestjs/microservices';
import { HeroService } from './hero.service';
import { CreateHeroDto } from './dto/create-hero.dto';
import { UpdateHeroDto } from './dto/update-hero.dto';
import { hero } from '@app/microrpc/protos/hero.js';
import { Metadata, ServerUnaryCall } from '@grpc/grpc-js';
import { getNodeEnv } from '@app/utils';

@Controller()
export class HeroController {
  constructor(private readonly heroService: HeroService) {}

  @GrpcMethod('HeroesService', 'FindOne')
  findOne(
    data: hero.HeroById,
    metadata: Metadata,
    call: ServerUnaryCall<any, any>,
  ): hero.Hero {
    const items = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Doe' },
    ];
    const one = items.find(({ id }) => id === data.id) || {
      id: 0,
      name: 'Not Found',
    };
    one.name += ' - ' + getNodeEnv('CONSUL_ID');
    one.id = Number(process.env.PORT);
    return hero.Hero.create(one);
  }
}

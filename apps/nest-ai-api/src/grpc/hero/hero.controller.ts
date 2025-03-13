import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, GrpcMethod } from '@nestjs/microservices';
import { HeroService } from './hero.service';
import { CreateHeroDto } from './dto/create-hero.dto';
import { UpdateHeroDto } from './dto/update-hero.dto';
import { hero } from '@app/microrpc/protos/hero.js';
import { Metadata, ServerUnaryCall } from '@grpc/grpc-js';

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
    const one = items.find(({ id }) => id === data.id);
    one.name += ' - ' + process.env.HOSTNAME;
    return hero.Hero.create(one);
  }
}

import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, GrpcMethod } from '@nestjs/microservices';
import { HeroService } from './hero.service';
import { hero } from '@libs/microrpc/protos/hero.js';
import { Metadata, ServerUnaryCall } from '@grpc/grpc-js';
import { getNodeEnv, getServerNodeId } from '@libs/utils';

@Controller()
export class HeroController {
  constructor(private readonly heroService: HeroService) {}

  public static items = [
    { id: 1, name: 'John' },
    { id: 2, name: 'Doe' },
  ];

  @GrpcMethod('HeroesService', 'FindOne')
  findOne(
    data: hero.HeroById,
    metadata: Metadata,
    call: ServerUnaryCall<any, any>,
  ): hero.Hero {
    const items = HeroController.items;
    let one = items.find(({ id }) => id === data.id) || {
      id: data.id,
      name: 'Not Found',
    };
    one = Object.create(one);
    one.name += ' - ' + getServerNodeId();
    one.id = Number(process.env.PORT);
    return hero.Hero.create(one);
  }
}

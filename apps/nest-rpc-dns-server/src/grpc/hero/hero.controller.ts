import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, GrpcMethod } from '@nestjs/microservices';
import { HeroService } from './hero.service';
import { hero } from 'libs/microrpc/src/protos/gen/hero.js';
import { Metadata, ServerUnaryCall } from '@grpc/grpc-js';
import { getNodeEnv, getServerNodeId } from '@libs/utils/src';

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
    one = { ...one };
    one.name += ' - ' + getServerNodeId();
    console.log('find by id ', data.id, one);
    return hero.Hero.create(one);
  }

  @GrpcMethod('HeroesService', 'UpdateHero')
  updateHero(data: hero.Hero): hero.Hero {
    const items = HeroController.items;
    const index = items.findIndex(({ id }) => id === data.id);
    if (index !== -1) {
      items[index] = { ...items[index], ...data };
      return hero.Hero.create(items[index]);
    } else {
      return hero.Hero.create({ id: data.id, name: 'Not Found' });
    }
  }
}

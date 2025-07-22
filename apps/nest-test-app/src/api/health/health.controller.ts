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
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import {
  Cat,
  CatDocument,
  CatSchema,
} from '@libs/db/src/mongo/schemas/cat.schema';
import {
  TestCollection,
  TestDocument,
  TestSchema,
} from '@libs/db/src/mongo/schemas/test.schema';
import { RedisClusterService } from '@libs/db/src';
import { NestLogger } from '@libs/utils/src';
import { SingleClsTest } from './single.cls';
import { ModuleRef } from '@nestjs/core';

const gid = (): string => Math.random().toString(36).substring(3);

@Controller('health')
export class HealthController {
  constructor(
    private readonly healthService: HealthService,
    private readonly ref: ModuleRef,
    // @InjectModel(Cat.name) private catModel: Model<CatDocument>,
    // @InjectModel(TestCollection.name)
    // private testModel: Model<TestDocument>,
    // private readonly cluster: RedisClusterService,
  ) {}
  private array = [];

  @Get()
  async test() {
    const cls = new SingleClsTest(this.ref);
    cls.test();

    return Math.random().toString(36);
  }
  @Get('v2')
  test2() {
    return 'ok';
  }
  // @Get('test')
  // async testv2() {
  //   const largeIds = new Array(500).fill(1).map((_, i) => {
  //     return 'g-' + i + gid();
  //   });
  //   const newOne = await this.testModel.create({
  //     name: 'Sammy',
  //     age: 22,
  //     resourceId: largeIds[2],
  //     tags: ['cute', 'fluffy'],
  //   });

  //   await newOne.save();
  //   const t1 = Date.now();
  //   const res = await this.testModel.find({
  //     resourceId: { $in: largeIds },
  //   });
  //   const t2 = Date.now();
  //   console.log('find cost ', t2 - t1);

  //   return  res;
  // }
  // @Get('cats')
  // async getCats() {
  //   const newOne = new this.catModel({
  //     name: 'Sammy',
  //     age: 22,
  //     breed: 'Persian',
  //     tags: ['cute', 'fluffy'],
  //   });
  //   await newOne.save();

  //   await this.catModel.create({
  //     name: 'Tommy',
  //     age: 2,
  //     breed: 'Persian',
  //     tags: ['cute', 'fluffy'],
  //   });
  //   const b = await this.catModel.find().limit(3).exec();
  //   console.log(b);
  //   return b;
  // }
}

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
import { TestV1Pipe, TestV2Pipe } from '../../pipes/test.pipe';

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
  @Get('pip')
  test2() {
    return 'ok';
  }
}

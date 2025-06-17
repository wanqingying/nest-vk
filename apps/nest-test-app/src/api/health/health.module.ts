import { Module } from '@nestjs/common';
import { HealthService } from './health.service';
import { HealthController } from './health.controller';
import { MathModule } from '../../modules/math/math.module';
import {
  TwosumModule,
  TwosumService,
} from '../../modules/twosum/twosum.module';
// import { AModule, AService } from '../../modules/modulea/a.module';
// import { BModule, BService } from '../../modules/moduleb/b.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Cat, CatDocument, CatSchema } from '@libs/db/mongo/schemas/cat.schema';
import {
  TestCollection,
  TestDocument,
  TestSchema,
} from '@libs/db/mongo/schemas/test.schema';
import { PrometheusService } from './prom.service';
import { MetricsController } from './prom.controller';

@Module({
  imports: [
    TwosumModule,
    MathModule.forRoot(TwosumService),
    // MongooseModule.forFeature([{ name: Cat.name, schema: CatSchema }]),
    // MongooseModule.forFeature([
    //   { name: TestCollection.name, schema: TestSchema },
    // ]),
  ],
  providers: [HealthService, PrometheusService],
  controllers: [HealthController, MetricsController],
})
export class HealthModule {}

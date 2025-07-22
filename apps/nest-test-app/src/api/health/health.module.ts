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
import { SingleService } from './single.service';

@Module({
  imports: [
    TwosumModule,
    MathModule.forRoot(TwosumService),
    // MongooseModule.forFeature([{ name: Cat.name, schema: CatSchema }]),
    // MongooseModule.forFeature([
    //   { name: TestCollection.name, schema: TestSchema },
    // ]),
  ],
  providers: [HealthService, SingleService],
  controllers: [HealthController],
})
export class HealthModule {}

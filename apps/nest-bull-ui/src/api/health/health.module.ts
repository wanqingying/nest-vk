import { Module } from '@nestjs/common';
import { HealthService } from './health.service';
import { HealthController } from './health.controller';
import { BullModule } from '@nestjs/bullmq';
import { Q_NNAME_1 } from '@libs/shared/src/bull.const';

// import { AModule, AService } from '../../modules/modulea/a.module';
// import { BModule, BService } from '../../modules/moduleb/b.module';
import { MongooseModule } from '@nestjs/mongoose';
import { SingleService } from './single.service';



@Module({
  imports: [
    // MongooseModule.forFeature([{ name: Cat.name, schema: CatSchema }]),
    // MongooseModule.forFeature([
    //   { name: TestCollection.name, schema: TestSchema },
    // ]),
    BullModule.registerQueue({
      name: Q_NNAME_1,
      // other queue options
    }),
  ],
  providers: [HealthService, SingleService],
  controllers: [HealthController],
})
export class HealthModule {}

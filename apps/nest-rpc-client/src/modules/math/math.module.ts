import { Module, DynamicModule } from '@nestjs/common';
import { MathService } from './math.service';
import { TwosumService } from '../twosum/twosum.service';
import { TwosumModule } from '../twosum/twosum.module';

@Module({
  // providers:[],
})
export class MathModule {
  public static forFeature(twosum: any): DynamicModule {

    return {
      module: MathModule,
      imports: [TwosumModule],
      providers: [
        MathService,
      ],
      exports: [MathService],
    };
  }
}

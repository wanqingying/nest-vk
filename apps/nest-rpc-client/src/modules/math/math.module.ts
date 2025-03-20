import { Module, DynamicModule } from '@nestjs/common';
import { MathService, TwoSumService } from './math.service';

@Module({
  // providers:[],
})
export class MathModule {
  public static forFeature(twosum: any): DynamicModule {

    return {
      module: MathModule,
      providers: [
        {
          provide: MathService,
          useFactory: (twosum) => {
            return new MathService(twosum);
          },
          inject: [twosum],
        },
      ],
      exports: [MathService],
    };
  }
}

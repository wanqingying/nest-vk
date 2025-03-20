import { Module, DynamicModule } from '@nestjs/common';
import { MathService, TwoSumT } from './math.service';
// import { TwosumService } from '../twosum/twosum.module';

@Module({
  // providers:[],
})
export class MathModule {
  public static forRoot(service: typeof TwoSumT): DynamicModule {
    return {
      module: MathModule,
      providers: [
        {
          provide: 'TS',
          useClass: service as any,
        },
        MathService,
      ],
      exports: [MathService],
    };
  }
}
